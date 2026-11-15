// Server-side AI proxy through OpenRouter (https://openrouter.ai). The API key
// stays in the server environment (OPENROUTER_API_KEY) and never reaches the
// browser.
//
// Pages POST { model: 'text' | 'image', contents, config } (see utils/ai.ts).
// "text" runs on Claude Haiku 5.5 (reads photos too), "image" on Flux 3 Klein,
// which can also edit a photo the visitor sends (the wrap visualizer).
// Both can be changed in Vercel with AI_TEXT_MODEL / AI_IMAGE_MODEL.
// Only the options the site uses are accepted, requests must come from the
// site itself, and each IP is rate-limited.
import { BadRequest, clientIp, createRateLimiter, isAllowedOrigin, isPlainObject, json, onlyKeys } from './_shared.js';

type Tier = 'text' | 'image';
const TIERS: Tier[] = ['text', 'image'];

const TEXT_MODEL = () => process.env.AI_TEXT_MODEL || 'anthropic/claude-haiku-5.5';
const IMAGE_MODEL = () => process.env.AI_IMAGE_MODEL || 'black-forest-labs/flux-3-image-klein';
const OPENROUTER = 'https://openrouter.ai/api/v1';

const RATE_LIMITS: Record<Tier, { windowMs: number; max: number }[]> = {
  text: [
    { windowMs: 60_000, max: 20 },
    { windowMs: 60 * 60_000, max: 200 },
  ],
  image: [
    { windowMs: 60_000, max: 5 },
    { windowMs: 60 * 60_000, max: 30 },
    { windowMs: 24 * 60 * 60_000, max: 60 },
  ],
};

// Large enough for one phone photo (resized in the browser).
const MAX_BODY_BYTES = 3_300_000;
// Total text across the prompt, or across a whole chat history.
const MAX_PROMPT_CHARS = 24_000;
const MAX_CHAT_TURNS = 30;
const MAX_IMAGE_BASE64_CHARS = 3_000_000;
const MAX_SYSTEM_INSTRUCTION_CHARS = 4_000;
const MAX_SCHEMA_CHARS = 10_000;
// Haiku 5.5 thinks before answering; thinking and the answer share this limit.
const MAX_OUTPUT_TOKENS = 6_000;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

const rateLimit = createRateLimiter();

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
type ChatTurn = { role: 'user' | 'model'; parts: Part[] };

interface AiRequest {
  tier: Tier;
  contents: string | Part[] | ChatTurn[];
  config?: Record<string, unknown>;
}

// --- Input validation -------------------------------------------------------

/** Accepts text, at most one photo and (text tier only) chat histories, with total text capped. */
function validateContents(contents: unknown, tier: Tier): AiRequest['contents'] {
  let textLength = 0;
  let images = 0;

  const checkPart = (part: unknown) => {
    if (!isPlainObject(part) || Object.keys(part).length !== 1) throw new BadRequest('each part must be { text } or { inlineData }');
    if (typeof part.text === 'string') {
      textLength += part.text.length;
      return;
    }
    const data = part.inlineData;
    if (!isPlainObject(data)) throw new BadRequest('each part must be { text } or { inlineData }');
    onlyKeys(data, ['mimeType', 'data'], 'inlineData');
    if (!IMAGE_TYPES.includes(data.mimeType as string)) throw new BadRequest('images must be JPEG, PNG or WebP');
    if (typeof data.data !== 'string' || data.data.length > MAX_IMAGE_BASE64_CHARS || !/^[A-Za-z0-9+/=]+$/.test(data.data)) {
      throw new BadRequest('image data must be base64 and under about 2 MB');
    }
    images++;
  };

  if (typeof contents === 'string') {
    textLength = contents.length;
  } else if (Array.isArray(contents) && contents.length > 0) {
    const isChat = contents.every((c) => isPlainObject(c) && 'role' in c);
    if (isChat) {
      if (tier !== 'text') throw new BadRequest('chats can only be sent to the text model');
      if (contents.length > MAX_CHAT_TURNS) throw new BadRequest(`chats can have at most ${MAX_CHAT_TURNS} turns`);
      for (const turn of contents as Record<string, unknown>[]) {
        onlyKeys(turn, ['role', 'parts'], 'turn');
        if (turn.role !== 'user' && turn.role !== 'model') throw new BadRequest('turn role must be user or model');
        if (!Array.isArray(turn.parts) || turn.parts.length === 0 || turn.parts.length > 4) throw new BadRequest('each turn needs 1-4 parts');
        turn.parts.forEach(checkPart);
      }
      const last = contents[contents.length - 1] as Record<string, unknown>;
      if (last.role !== 'user') throw new BadRequest('a chat must end with a user turn');
    } else {
      if (contents.length > 4) throw new BadRequest('at most 4 parts');
      contents.forEach(checkPart);
    }
  } else {
    throw new BadRequest('contents must be a string, a list of parts or a chat history');
  }

  if (images > 1) throw new BadRequest('at most one image per request');
  if (textLength === 0 || textLength > MAX_PROMPT_CHARS) throw new BadRequest(`text must be 1-${MAX_PROMPT_CHARS} characters`);
  return contents as AiRequest['contents'];
}

function validateConfig(config: unknown, tier: Tier): Record<string, unknown> | undefined {
  if (config === undefined) return undefined;
  if (!isPlainObject(config)) throw new BadRequest('config must be an object');

  if (tier === 'image') onlyKeys(config, ['imageConfig'], 'config');
  else onlyKeys(config, ['systemInstruction', 'responseMimeType', 'responseSchema'], 'config');

  const { systemInstruction, responseMimeType, responseSchema, imageConfig } = config;
  if (systemInstruction !== undefined && (typeof systemInstruction !== 'string' || systemInstruction.length > MAX_SYSTEM_INSTRUCTION_CHARS)) {
    throw new BadRequest(`config.systemInstruction must be a string of at most ${MAX_SYSTEM_INSTRUCTION_CHARS} characters`);
  }
  if (responseMimeType !== undefined && responseMimeType !== 'application/json' && responseMimeType !== 'text/plain') {
    throw new BadRequest('config.responseMimeType must be application/json or text/plain');
  }
  if (responseSchema !== undefined && (!isPlainObject(responseSchema) || JSON.stringify(responseSchema).length > MAX_SCHEMA_CHARS)) {
    throw new BadRequest('config.responseSchema must be an object of reasonable size');
  }
  if (imageConfig !== undefined) {
    if (!isPlainObject(imageConfig)) throw new BadRequest('config.imageConfig must be an object');
    onlyKeys(imageConfig, ['aspectRatio'], 'config.imageConfig');
    if (imageConfig.aspectRatio !== undefined && !ASPECT_RATIOS.includes(imageConfig.aspectRatio as string)) {
      throw new BadRequest('config.imageConfig.aspectRatio is not supported');
    }
  }
  return config;
}

function parseBody(raw: string): AiRequest {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new BadRequest('Body must be JSON');
  }
  if (!isPlainObject(body)) throw new BadRequest('Body must be a JSON object');
  onlyKeys(body, ['model', 'contents', 'config'], 'body');
  if (!TIERS.includes(body.model as Tier)) throw new BadRequest('model must be "text" or "image"');
  const tier = body.model as Tier;
  return { tier, contents: validateContents(body.contents, tier), config: validateConfig(body.config, tier) };
}

// --- Translation to OpenRouter -----------------------------------------------

const toContent = (parts: Part[]) =>
  parts.every((p) => 'text' in p)
    ? parts.map((p) => (p as { text: string }).text).join('\n\n')
    : parts.map((p) =>
        'text' in p
          ? { type: 'text', text: p.text }
          : { type: 'image_url', image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` } },
      );

function toMessages(contents: AiRequest['contents'], system?: string) {
  const messages: { role: string; content: unknown }[] = system ? [{ role: 'system', content: system }] : [];
  if (typeof contents === 'string') messages.push({ role: 'user', content: contents });
  else if ('role' in contents[0]) {
    for (const turn of contents as ChatTurn[]) messages.push({ role: turn.role === 'model' ? 'assistant' : 'user', content: toContent(turn.parts) });
  } else messages.push({ role: 'user', content: toContent(contents as Part[]) });
  return messages;
}

/** The pages describe outputs Gemini-style (type: 'OBJECT' ...); OpenRouter takes strict JSON Schema. */
function toJsonSchema(s: unknown): Record<string, unknown> {
  if (!isPlainObject(s)) return { type: 'string' };
  const type = String(s.type ?? '').toLowerCase();
  const out: Record<string, unknown> = typeof s.description === 'string' ? { description: s.description } : {};
  if (type === 'object') {
    const props = isPlainObject(s.properties) ? s.properties : {};
    return {
      ...out,
      type: 'object',
      properties: Object.fromEntries(Object.entries(props).map(([k, v]) => [k, toJsonSchema(v)])),
      required: Object.keys(props),
      additionalProperties: false,
    };
  }
  if (type === 'array') return { ...out, type: 'array', items: toJsonSchema(s.items) };
  if (['string', 'number', 'integer', 'boolean'].includes(type)) {
    return { ...out, type, ...(Array.isArray(s.enum) ? { enum: s.enum } : {}) };
  }
  return { ...out, type: 'string' };
}

const photoOf = (contents: AiRequest['contents']) =>
  typeof contents === 'string' ? undefined : (contents as Part[]).find((p): p is Extract<Part, { inlineData: unknown }> => 'inlineData' in p);

const promptText = (contents: AiRequest['contents']) =>
  typeof contents === 'string'
    ? contents
    : (contents as Part[]).map((p) => ('text' in p ? p.text : '')).filter(Boolean).join('\n\n');

async function openrouter(path: string, payload: unknown, apiKey: string) {
  const res = await fetch(`${OPENROUTER}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // Optional attribution shown in OpenRouter's dashboard.
      'HTTP-Referer': 'https://www.myautospex.com',
      'X-Title': 'MyAutoSpex',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(55_000),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

const detectImageType = (base64: string) =>
  base64.startsWith('iVBOR') ? 'image/png' : base64.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';

// --- Handler ----------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  if (!isAllowedOrigin(request)) return json({ error: 'Forbidden' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Request is too large' }, 413);

  let input: AiRequest;
  try {
    input = parseBody(raw);
  } catch (err) {
    if (err instanceof BadRequest) return json({ error: err.message }, 400);
    throw err;
  }

  const retryAfter = rateLimit(`${clientIp(request)}|${input.tier}`, RATE_LIMITS[input.tier]);
  if (retryAfter > 0) {
    return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429, { 'Retry-After': String(retryAfter) });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('api/ai: OPENROUTER_API_KEY is not set');
    return json({ error: 'The AI service is not configured.' }, 500);
  }

  try {
    if (input.tier === 'image') {
      const aspect = (input.config?.imageConfig as { aspectRatio?: string } | undefined)?.aspectRatio;
      const photo = photoOf(input.contents);
      const { status, body } = await openrouter(
        '/images',
        {
          model: IMAGE_MODEL(),
          prompt: promptText(input.contents),
          n: 1,
          resolution: '1K',
          ...(aspect ? { aspect_ratio: aspect } : {}),
          // A photo to edit (the visitor's car) rather than a picture from scratch.
          ...(photo
            ? { input_references: [{ type: 'image_url', image_url: { url: `data:${photo.inlineData.mimeType};base64,${photo.inlineData.data}` } }] }
            : {}),
        },
        apiKey,
      );
      if (status !== 200) return upstreamError(status, body);
      const image = body?.data?.[0];
      let data: string | undefined = image?.b64_json;
      if (!data && typeof image?.url === 'string' && image.url.startsWith('data:')) data = image.url.split(',')[1];
      if (!data) return upstreamError(502, body);
      return json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: detectImageType(data), data } }] } }] });
    }

    const schema = input.config?.responseSchema;
    const payload = {
      model: TEXT_MODEL(),
      messages: toMessages(input.contents, input.config?.systemInstruction as string | undefined),
      max_tokens: MAX_OUTPUT_TOKENS,
      // Low effort keeps answers fast and cheap; the thinking text isn't returned.
      reasoning: { effort: 'low', exclude: true },
      ...(schema
        ? { response_format: { type: 'json_schema', json_schema: { name: 'result', strict: true, schema: toJsonSchema(schema) } } }
        : input.config?.responseMimeType === 'application/json'
          ? { response_format: { type: 'json_object' } }
          : {}),
    };
    const { status, body } = await openrouter('/chat/completions', payload, apiKey);
    const choice = body?.choices?.[0];
    if (status !== 200 || !choice || choice.error) return upstreamError(choice?.error?.code ?? status, body);
    const content = choice.message?.content;
    const text =
      typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content.map((c: { text?: string }) => c?.text ?? '').join('')
          : undefined;
    return json({ text, candidates: [{ content: { parts: [{ text: text ?? '' }] }, finishReason: choice.finish_reason }] });
  } catch (err) {
    console.error('api/ai: OpenRouter request failed', err instanceof Error ? err.message : err);
    return json({ error: 'The AI service could not complete this request.' }, 502);
  }
}

function upstreamError(status: number, body: unknown): Response {
  const message = isPlainObject(body) && isPlainObject(body.error) ? String(body.error.message ?? '') : '';
  console.error('api/ai: OpenRouter error', status, message.slice(0, 300));
  if (status === 402) {
    // Out of OpenRouter credits: the owner needs to top up.
    return json({ error: 'The AI service is temporarily unavailable. Please try again later.' }, 503, { 'Retry-After': '300' });
  }
  if (status === 429 || status === 503) {
    return json({ error: 'The AI service is busy. Please try again shortly.' }, 503, { 'Retry-After': '30' });
  }
  return json({ error: 'The AI service could not complete this request.' }, 502);
}
