// Server-side AI proxy through OpenRouter (https://openrouter.ai). The API key
// stays in the server environment (OPENROUTER_API_KEY) and never reaches the
// browser.
//
// Pages POST { tool, fields } (see utils/ai.ts). Each tool in api/_aiTools.ts
// checks its fields and builds the prompt on the server, so visitors can only
// fill in a tool's form, never send their own instructions to the AI.
// "text" tools run on Claude Haiku 5.5 (reads photos too), "image" tools on
// Flux 3 Klein, which can also edit a photo the visitor sends (the wrap
// visualizer). Both can be changed in Vercel with AI_TEXT_MODEL / AI_IMAGE_MODEL.
//
// Limits, from cheapest to check to final backstop:
// 1. request size and strict field validation (api/_aiTools.ts)
// 2. per-IP burst limits per server instance (below)
// 3. site-wide and per-visitor daily caps shared by all instances (api/_limits.ts)
// 4. the spending limit set on the OpenRouter key itself
import { BadRequest, clientIp, createRateLimiter, isAllowedOrigin, isPlainObject, json } from './_shared.js';
import { buildToolRequest, type BuiltRequest, type ChatTurn, type Part, type Tier } from './_aiTools.js';
import { getShared, putShared, takeDaily } from './_limits.js';

const TEXT_MODEL = () => process.env.AI_TEXT_MODEL || 'anthropic/claude-haiku-5.5';
const IMAGE_MODEL = () => process.env.AI_IMAGE_MODEL || 'black-forest-labs/flux-3-image-klein';
// Overridable only for local tests against a mock server.
const OPENROUTER = () => process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

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
// Default output limit; Haiku 5.5 thinks before answering, and thinking and the answer share it.
const MAX_OUTPUT_TOKENS = 6_000;

const rateLimit = createRateLimiter();

// --- Translation to OpenRouter -----------------------------------------------

const toContent = (parts: Part[]) =>
  parts.every((p) => 'text' in p)
    ? parts.map((p) => (p as { text: string }).text).join('\n\n')
    : parts.map((p) =>
        'text' in p
          ? { type: 'text', text: p.text }
          : { type: 'image_url', image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` } },
      );

function toMessages(contents: BuiltRequest['contents'], system?: string) {
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

const photoOf = (contents: BuiltRequest['contents']) =>
  typeof contents === 'string' ? undefined : (contents as Part[]).find((p): p is Extract<Part, { inlineData: unknown }> => 'inlineData' in p);

const promptText = (contents: BuiltRequest['contents']) =>
  typeof contents === 'string'
    ? contents
    : (contents as Part[]).map((p) => ('text' in p ? p.text : '')).filter(Boolean).join('\n\n');

async function openrouter(path: string, payload: unknown, apiKey: string) {
  const res = await fetch(`${OPENROUTER()}${path}`, {
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

  let input: BuiltRequest;
  let tool: string;
  try {
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new BadRequest('Body must be JSON');
    }
    ({ tool, request: input } = buildToolRequest(body));
  } catch (err) {
    if (err instanceof BadRequest) return json({ error: err.message }, 400);
    throw err;
  }

  // Answers that are the same for everyone are served from storage when fresh.
  const sharedKey = input.cacheSeconds ? `tool:${tool}` : null;
  if (sharedKey) {
    const cached = await getShared(sharedKey);
    if (cached) return json(JSON.parse(cached));
  }

  const ip = clientIp(request);
  const retryAfter = rateLimit(`${ip}|${input.tier}`, RATE_LIMITS[input.tier]);
  if (retryAfter > 0) {
    return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429, { 'Retry-After': String(retryAfter) });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('api/ai: OPENROUTER_API_KEY is not set');
    return json({ error: 'The AI service is not configured.' }, 500);
  }

  const daily = await takeDaily(input.tier, ip);
  if (!daily.ok) {
    return json(
      {
        error:
          daily.scope === 'visitor'
            ? "You've reached today's limit for this tool. Please come back tomorrow."
            : 'This tool is very busy today. Please try again tomorrow.',
      },
      429,
      { 'Retry-After': '3600' },
    );
  }

  try {
    if (input.tier === 'image') {
      const photo = photoOf(input.contents);
      const { status, body } = await openrouter(
        '/images',
        {
          model: IMAGE_MODEL(),
          prompt: promptText(input.contents),
          n: 1,
          resolution: '1K',
          ...(input.aspectRatio ? { aspect_ratio: input.aspectRatio } : {}),
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

    const payload = {
      model: TEXT_MODEL(),
      messages: toMessages(input.contents, input.system),
      max_tokens: input.maxTokens ?? MAX_OUTPUT_TOKENS,
      // Low effort keeps answers fast and cheap; the thinking text isn't returned.
      reasoning: { effort: 'low', exclude: true },
      ...(input.schema
        ? { response_format: { type: 'json_schema', json_schema: { name: 'result', strict: true, schema: toJsonSchema(input.schema) } } }
        : input.json
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
    const result = { text, candidates: [{ content: { parts: [{ text: text ?? '' }] }, finishReason: choice.finish_reason }] };
    if (sharedKey && text && choice.finish_reason === 'stop') await putShared(sharedKey, JSON.stringify(result), input.cacheSeconds!);
    return json(result);
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
