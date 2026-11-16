// Server-side AI for the site's tools, through OpenRouter (https://openrouter.ai).
// The API key stays in the server environment (OPENROUTER_API_KEY).
//
// Pages POST { tool, fields } (see utils/ai.ts). The tool picks a prompt
// template in api/_tools.ts and the fields fill it in after validation: a
// request cannot send a prompt, a system instruction or a schema of its own.
// "text" tools run on Claude Haiku 5.5 (reads photos too); the wrap tool runs
// on Flux 3 Klein and only recolors a car. Change the models in Vercel with
// AI_TEXT_MODEL / AI_IMAGE_MODEL.
//
// Every call takes one unit of a daily allowance, per visitor and site-wide,
// counted in Postgres (api/_usage.ts), after a per-instance per-minute limit
// and a Vercel BotID check.
import { BadRequest, clientKey, createRateLimiter, isAllowedOrigin, isPlainObject, json } from './_shared.js';
import { PHOTO_CHECK, matchesSchema, parseToolRequest, toJsonSchema, type ImagePlan, type TextPlan, type ToolRequest } from './_tools.js';
import { takeDailyQuota } from './_usage.js';
import { isBot } from './_botid.js';
import { verifyVehicle } from './_vehicles.js';

const TEXT_MODEL = () => process.env.AI_TEXT_MODEL || 'anthropic/claude-haiku-5.5';
const IMAGE_MODEL = () => process.env.AI_IMAGE_MODEL || 'black-forest-labs/flux-3-image-klein';
const OPENROUTER = 'https://openrouter.ai/api/v1';

// Short bursts, per instance (a speed bump in front of the daily caps).
const RATE_LIMITS = {
  text: [
    { windowMs: 60_000, max: 20 },
    { windowMs: 60 * 60_000, max: 200 },
  ],
  image: [
    { windowMs: 60_000, max: 5 },
    { windowMs: 60 * 60_000, max: 30 },
  ],
};

// Large enough for one phone photo (resized in the browser).
const MAX_BODY_BYTES = 3_300_000;
// Haiku 5.5 thinks before answering; thinking and the answer share this limit.
const MAX_OUTPUT_TOKENS = 6_000;

const rateLimit = createRateLimiter();

export const LIMIT_MESSAGES = {
  site: 'Our AI tools are very busy today and have reached their daily limit. Please try again tomorrow.',
  caller: "You've reached today's limit for our AI tools. Please try again tomorrow.",
  unavailable: 'Our AI tools are busy right now. Please try again in a few minutes.',
};

// --- OpenRouter -----------------------------------------------------------------

class UpstreamError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`OpenRouter answered ${status}`);
  }
}

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

const toContent = (content: TextPlan['messages'][number]['content']) =>
  typeof content === 'string'
    ? content
    : content.map((p) =>
        p.type === 'text' ? { type: 'text', text: p.text } : { type: 'image_url', image_url: { url: `data:${p.mimeType};base64,${p.data}` } },
      );

/** Runs a text plan. Returns the parsed JSON for plans with a schema, else the text. */
async function runText(plan: TextPlan, apiKey: string): Promise<{ data: unknown } | { text: string }> {
  const schema = plan.schema ? toJsonSchema(plan.schema.schema) : null;
  const payload = {
    model: TEXT_MODEL(),
    messages: [...(plan.system ? [{ role: 'system', content: plan.system }] : []), ...plan.messages.map((m) => ({ role: m.role, content: toContent(m.content) }))],
    max_tokens: MAX_OUTPUT_TOKENS,
    // Low effort keeps answers fast and cheap; the thinking text isn't returned.
    reasoning: { effort: 'low', exclude: true },
    ...(schema ? { response_format: { type: 'json_schema', json_schema: { name: plan.schema!.name, strict: true, schema } } } : {}),
  };
  const { status, body } = await openrouter('/chat/completions', payload, apiKey);
  const choice = body?.choices?.[0];
  if (status !== 200 || !choice || choice.error) throw new UpstreamError(choice?.error?.code ?? status, body);
  const content = choice.message?.content;
  const text =
    typeof content === 'string' ? content : Array.isArray(content) ? content.map((c: { text?: string }) => c?.text ?? '').join('') : '';
  if (!schema) {
    if (!text.trim()) throw new UpstreamError(502, body);
    return { text: plan.maxChars ? text.slice(0, plan.maxChars) : text };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new UpstreamError(502, { error: { message: 'The answer was not JSON' } });
  }
  // Enforce the tool's schema here too, whatever the provider did with it.
  if (!matchesSchema(data, schema)) throw new UpstreamError(502, { error: { message: `The answer did not match the ${plan.schema!.name} schema` } });
  return { data };
}

const detectImageType = (base64: string) =>
  base64.startsWith('iVBOR') ? 'image/png' : base64.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';

/** Asks the text model whether the photo shows a car (and not a person) before it is edited. */
async function photoShowsCar(photo: NonNullable<ImagePlan['photo']>, apiKey: string): Promise<boolean> {
  const result = await runText(
    {
      tier: 'text',
      messages: [{ role: 'user', content: [{ type: 'image', ...photo }, { type: 'text', text: PHOTO_CHECK.prompt }] }],
      schema: { name: PHOTO_CHECK.name, schema: PHOTO_CHECK.schema },
    },
    apiKey,
  );
  const answer = (result as { data: { vehicle: boolean; person: boolean } }).data;
  return answer.vehicle && !answer.person;
}

async function runImage(plan: ImagePlan, apiKey: string): Promise<Response> {
  if (plan.photo && !(await photoShowsCar(plan.photo, apiKey))) {
    return json(
      { error: "This photo doesn't look like a car. Upload a photo that shows your car from the outside.", code: 'not_a_car' },
      422,
    );
  }
  const { status, body } = await openrouter(
    '/images',
    {
      model: IMAGE_MODEL(),
      prompt: plan.prompt,
      n: 1,
      resolution: '1K',
      aspect_ratio: plan.aspectRatio,
      // The owner's car photo to edit, rather than a picture from scratch.
      ...(plan.photo
        ? { input_references: [{ type: 'image_url', image_url: { url: `data:${plan.photo.mimeType};base64,${plan.photo.data}` } }] }
        : {}),
    },
    apiKey,
  );
  if (status !== 200) throw new UpstreamError(status, body);
  const image = body?.data?.[0];
  let data: string | undefined = image?.b64_json;
  if (!data && typeof image?.url === 'string' && image.url.startsWith('data:')) data = image.url.split(',')[1];
  if (!data) throw new UpstreamError(502, body);
  return json({ image: { mimeType: detectImageType(data), data } });
}

// --- Handler ----------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  if (!isAllowedOrigin(request)) return json({ error: 'Forbidden' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Request is too large' }, 413);

  let input: ToolRequest;
  try {
    input = parseToolRequest(raw);
  } catch (err) {
    if (err instanceof BadRequest) return json({ error: err.message }, 400);
    throw err;
  }
  const retryAfter = rateLimit(`${clientKey(request)}|${input.tier}`, RATE_LIMITS[input.tier]);
  if (retryAfter > 0) {
    return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429, { 'Retry-After': String(retryAfter) });
  }
  if (await isBot()) return json({ error: 'Forbidden' }, 403);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('api/ai: OPENROUTER_API_KEY is not set');
    return json({ error: 'The AI service is not configured.' }, 500);
  }

  const refused = await takeDailyQuota(request, input.tier === 'image' ? 'ai-image' : 'ai-text');
  if (refused) {
    return json({ error: LIMIT_MESSAGES[refused.reason], code: 'daily_limit' }, refused.reason === 'unavailable' ? 503 : 429, {
      'Retry-After': String(refused.retryAfter),
    });
  }

  try {
    const plan = await input.plan({ verifyVehicle });
    if (plan.tier === 'image') return await runImage(plan, apiKey);
    return json(await runText(plan, apiKey));
  } catch (err) {
    if (err instanceof UpstreamError) return upstreamError(err.status, err.body);
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
