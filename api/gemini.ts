// Server-side proxy for Gemini. The API key stays in the server environment
// (GEMINI_API_KEY) and is never sent to the browser.
//
// The browser POSTs { model, contents, config } (see utils/gemini.ts). This
// function only accepts the models and config options the site actually uses,
// checks that the request comes from the site itself and rate-limits by IP.
import { GoogleGenAI } from '@google/genai';

type ModelKind = 'text' | 'image';

// Models the site uses. Anything else is rejected.
const MODELS: Record<string, ModelKind> = {
  'gemini-3-flash-preview': 'text',
  'gemini-2.5-flash': 'text',
  'gemini-2.5-flash-image': 'image',
};

// Requests allowed per IP, per window. Counted per function instance (in memory),
// so this is a speed bump rather than a hard quota: also set a quota or budget
// alert for the key in Google Cloud.
const RATE_LIMITS: Record<ModelKind, { windowMs: number; max: number }[]> = {
  text: [
    { windowMs: 60_000, max: 20 },
    { windowMs: 60 * 60_000, max: 200 },
  ],
  image: [
    { windowMs: 60_000, max: 5 },
    { windowMs: 60 * 60_000, max: 30 },
  ],
};

// Hosts allowed to call this endpoint besides the host it is served from
// (which covers production, Vercel previews and local dev). Extra hosts can be
// added with ALLOWED_ORIGINS="https://example.com,https://other.example".
const DEFAULT_ALLOWED_HOSTS = ['www.myautospex.com', 'myautospex.com'];

const MAX_BODY_BYTES = 64 * 1024;
const MAX_PROMPT_CHARS = 10_000;
const MAX_SYSTEM_INSTRUCTION_CHARS = 4_000;
const MAX_SCHEMA_CHARS = 10_000;
const MAX_THINKING_BUDGET = 8_192;
const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

class BadRequest extends Error {}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function onlyKeys(value: Record<string, unknown>, allowed: string[], label: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new BadRequest(`${label}.${key} is not allowed`);
  }
}

// --- Origin check -----------------------------------------------------------

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function isAllowedOrigin(request: Request): boolean {
  // Browsers always send Origin on POST requests.
  const callerHost = hostOf(request.headers.get('origin')) ?? hostOf(request.headers.get('referer'));
  if (!callerHost) return false;

  const servedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (callerHost === servedHost) return true;

  const extra = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => hostOf(origin.trim()))
    .filter((host): host is string => Boolean(host));
  return [...DEFAULT_ALLOWED_HOSTS, ...extra].includes(callerHost);
}

// --- Rate limit -------------------------------------------------------------

const hits = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}

/** Records one request and returns the seconds to wait if the IP is over a limit. */
function rateLimit(ip: string, kind: ModelKind): number {
  const now = Date.now();
  if (hits.size > 10_000) {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }

  let retryAfterMs = 0;
  for (const { windowMs, max } of RATE_LIMITS[kind]) {
    const key = `${ip}|${kind}|${windowMs}`;
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;
    if (entry.count > max) retryAfterMs = Math.max(retryAfterMs, entry.resetAt - now);
  }
  return Math.ceil(retryAfterMs / 1000);
}

// --- Input validation -------------------------------------------------------

interface GeminiRequest {
  model: string;
  contents: string | { text: string }[];
  config?: Record<string, unknown>;
}

function validateContents(contents: unknown): GeminiRequest['contents'] {
  let length = 0;
  if (typeof contents === 'string') {
    length = contents.length;
  } else if (Array.isArray(contents) && contents.length > 0 && contents.length <= 4) {
    for (const part of contents) {
      if (!isPlainObject(part) || typeof part.text !== 'string' || Object.keys(part).length !== 1) {
        throw new BadRequest('contents parts must be { text: string }');
      }
      length += part.text.length;
    }
  } else {
    throw new BadRequest('contents must be a string or a list of text parts');
  }
  if (length === 0 || length > MAX_PROMPT_CHARS) {
    throw new BadRequest(`contents must be 1-${MAX_PROMPT_CHARS} characters`);
  }
  return contents as GeminiRequest['contents'];
}

function validateConfig(config: unknown, kind: ModelKind): Record<string, unknown> | undefined {
  if (config === undefined) return undefined;
  if (!isPlainObject(config)) throw new BadRequest('config must be an object');

  if (kind === 'image') {
    onlyKeys(config, ['imageConfig'], 'config');
  } else {
    onlyKeys(config, ['systemInstruction', 'responseMimeType', 'responseSchema', 'thinkingConfig', 'tools'], 'config');
  }

  const { systemInstruction, responseMimeType, responseSchema, thinkingConfig, tools, imageConfig } = config;

  if (systemInstruction !== undefined) {
    if (typeof systemInstruction !== 'string' || systemInstruction.length > MAX_SYSTEM_INSTRUCTION_CHARS) {
      throw new BadRequest(`config.systemInstruction must be a string of at most ${MAX_SYSTEM_INSTRUCTION_CHARS} characters`);
    }
  }
  if (responseMimeType !== undefined && responseMimeType !== 'application/json' && responseMimeType !== 'text/plain') {
    throw new BadRequest('config.responseMimeType must be application/json or text/plain');
  }
  if (responseSchema !== undefined) {
    if (!isPlainObject(responseSchema) || JSON.stringify(responseSchema).length > MAX_SCHEMA_CHARS) {
      throw new BadRequest('config.responseSchema must be an object of reasonable size');
    }
  }
  if (thinkingConfig !== undefined) {
    if (!isPlainObject(thinkingConfig)) throw new BadRequest('config.thinkingConfig must be an object');
    onlyKeys(thinkingConfig, ['thinkingBudget'], 'config.thinkingConfig');
    const budget = thinkingConfig.thinkingBudget;
    if (!Number.isInteger(budget) || (budget as number) < 0 || (budget as number) > MAX_THINKING_BUDGET) {
      throw new BadRequest(`config.thinkingConfig.thinkingBudget must be an integer from 0 to ${MAX_THINKING_BUDGET}`);
    }
  }
  if (tools !== undefined) {
    // Only Google Maps grounding (used by the mechanic finder) is allowed.
    const ok =
      Array.isArray(tools) &&
      tools.length === 1 &&
      isPlainObject(tools[0]) &&
      Object.keys(tools[0]).length === 1 &&
      isPlainObject(tools[0].googleMaps) &&
      Object.keys(tools[0].googleMaps).length === 0;
    if (!ok) throw new BadRequest('config.tools may only be [{ googleMaps: {} }]');
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

function parseBody(raw: string): GeminiRequest & { kind: ModelKind } {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new BadRequest('Body must be JSON');
  }
  if (!isPlainObject(body)) throw new BadRequest('Body must be a JSON object');
  onlyKeys(body, ['model', 'contents', 'config'], 'body');

  const model = body.model;
  if (typeof model !== 'string' || !Object.hasOwn(MODELS, model)) {
    throw new BadRequest('model is not allowed');
  }
  const kind = MODELS[model];
  return { model, kind, contents: validateContents(body.contents), config: validateConfig(body.config, kind) };
}

// --- Handler ----------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  if (!isAllowedOrigin(request)) {
    return json({ error: 'Forbidden' }, 403);
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: 'Request is too large' }, 413);
  }

  let input: ReturnType<typeof parseBody>;
  try {
    input = parseBody(raw);
  } catch (err) {
    if (err instanceof BadRequest) return json({ error: err.message }, 400);
    throw err;
  }

  const retryAfter = rateLimit(clientIp(request), input.kind);
  if (retryAfter > 0) {
    return json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      429,
      { 'Retry-After': String(retryAfter) },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('api/gemini: GEMINI_API_KEY is not set');
    return json({ error: 'The AI service is not configured.' }, 500);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: input.model,
      contents: input.contents,
      config: input.config,
    });

    // Return only what the components read: the text, image parts and Maps grounding.
    return json({
      text: response.text,
      candidates: (response.candidates ?? []).map((candidate) => ({
        content: candidate.content,
        groundingMetadata: candidate.groundingMetadata,
        finishReason: candidate.finishReason,
      })),
    });
  } catch (err) {
    const status = (err as { status?: number }).status;
    console.error('api/gemini: Gemini request failed', status, err instanceof Error ? err.message : err);
    if (status === 429) {
      return json({ error: 'The AI service is busy. Please try again shortly.' }, 503, { 'Retry-After': '30' });
    }
    return json({ error: 'The AI service could not complete this request.' }, 502);
  }
}
