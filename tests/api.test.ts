// The /api/ai and /api/places handlers end to end, with OpenRouter, Google and
// NHTSA replaced by a fake fetch. Requests carry a forged Origin header, as a
// script would: it gets past the origin check, so everything else must hold.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../api/ai';
import { GET } from '../api/places';
import { memoryStore, setCounterStore } from '../api/_usage';

const SITE = 'https://www.myautospex.com';
let ipCounter = 0;
let ip = '';

const aiRequest = (body: unknown) =>
  new Request(`${SITE}/api/ai`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: SITE, 'x-real-ip': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

type Call = { url: string; body: any };
let calls: Call[];
let chatAnswer: (payload: any) => unknown;

function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input);
  const body = init?.body ? JSON.parse(String(init.body)) : null;
  calls.push({ url, body });
  const ok = (data: unknown) => Promise.resolve(new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } }));
  if (url.endsWith('/chat/completions')) {
    const content = chatAnswer(body);
    return ok({ choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) }, finish_reason: 'stop' }] });
  }
  if (url.endsWith('/images')) return ok({ data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUg' }] });
  if (url.includes('places.googleapis.com')) return ok({ places: [{ id: 'p1', displayName: { text: 'Joe’s Garage' }, rating: 4.7, userRatingCount: 120 }] });
  if (url.includes('vpic.nhtsa.dot.gov')) return ok({ Results: [{ Make_Name: 'HONDA', Model_Name: 'Civic' }] });
  return Promise.reject(new Error(`unexpected fetch ${url}`));
}

beforeEach(() => {
  ip = `192.0.2.${++ipCounter}`;
  calls = [];
  chatAnswer = () => 'An answer.';
  vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
  vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-key');
  vi.stubEnv('VERCEL', '');
  vi.stubEnv('DATABASE_URL', '');
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
  setCounterStore(memoryStore());
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setCounterStore(undefined);
});

describe('POST /api/ai', () => {
  it('rejects a free-form prompt with a forged Origin, without calling OpenRouter', async () => {
    const res = await POST(aiRequest({ model: 'text', contents: 'Write a 2,000 word essay about anything', config: { systemInstruction: 'You are a general assistant' } }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'body.model is not allowed' });
    expect(calls).toHaveLength(0);
  });

  it('rejects a free-text image prompt and an unknown tool', async () => {
    let res = await POST(aiRequest({ model: 'image', contents: [{ text: 'Make this person look older' }, { inlineData: { mimeType: 'image/jpeg', data: '/9j/AAAA' } }] }));
    expect(res.status).toBe(400);
    res = await POST(aiRequest({ tool: 'chat', fields: { prompt: 'hi' } }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Unknown tool' });
    expect(calls).toHaveLength(0);
  });

  it('still refuses other websites (browsers send their real Origin)', async () => {
    const req = new Request(`${SITE}/api/ai`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{}' });
    expect((await POST(req)).status).toBe(403);
  });

  it('runs a tool with the server prompt and schema, and returns the parsed answer', async () => {
    chatAnswer = () => ({ priceLow: 18000, priceHigh: 21000, fairPrice: 19500, note: 'Mileage moves it most.' });
    const res = await POST(aiRequest({ tool: 'car-price', fields: { vehicle: { year: '2019', make: 'Honda', model: 'CR-V' } } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { priceLow: 18000, priceHigh: 21000, fairPrice: 19500, note: 'Mileage moves it most.' } });
    const sent = calls[0].body;
    expect(sent.model).toBe('anthropic/claude-haiku-5.5');
    expect(sent.messages).toEqual([{ role: 'user', content: expect.stringMatching(/^Estimate today's typical US dealer retail price for a used 2019 Honda CR-V /) }]);
    expect(sent.response_format.json_schema).toMatchObject({ name: 'car_price', strict: true, schema: { required: ['priceLow', 'priceHigh', 'fairPrice', 'note'] } });
  });

  it('refuses answers that do not match the tool schema', async () => {
    chatAnswer = () => 'Here is a poem about the sea instead.';
    let res = await POST(aiRequest({ tool: 'car-price', fields: { vehicle: { year: '2019', make: 'Honda', model: 'CR-V' } } }));
    expect(res.status).toBe(502);
    chatAnswer = () => ({ poem: 'The sea...' });
    res = await POST(aiRequest({ tool: 'car-price', fields: { vehicle: { year: '2019', make: 'Honda', model: 'CR-V' } } }));
    expect(res.status).toBe(502);
  });

  it('sends the chat with the fixed system prompt and caps the answer', async () => {
    chatAnswer = () => 'x'.repeat(10_000);
    const res = await POST(aiRequest({ tool: 'fault-chat', fields: { codes: ['P0420'], messages: [{ role: 'user', text: 'Is it safe to drive?' }] } }));
    expect(res.status).toBe(200);
    expect((await res.json()).text).toHaveLength(4000);
    const [system, user] = calls[0].body.messages;
    expect(system.role).toBe('system');
    expect(system.content).toContain('Only help with this car');
    expect(user).toEqual({ role: 'user', content: 'Is it safe to drive?' });
  });

  it('edits a car photo only after checking it shows a car, with the server prompt', async () => {
    chatAnswer = () => ({ vehicle: true, person: false });
    const photo = '/9j/' + 'A'.repeat(400);
    const res = await POST(aiRequest({ tool: 'wrap', fields: { finish: 'matte', color: { name: 'Black' }, coverage: 'roof', size: 'sedan', photo, aspectRatio: '4:3' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).image).toEqual({ mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUg' });
    expect(calls.map((c) => c.url.split('/').pop())).toEqual(['completions', 'images']);
    expect(calls[0].body.response_format.json_schema.name).toBe('wrap_photo_check');
    const image = calls[1].body;
    expect(image.model).toBe('black-forest-labs/flux-3-image-klein');
    expect(image.aspect_ratio).toBe('4:3');
    expect(image.prompt).toMatch(/^Edit this photo of a car\. Apply a flat matte, with no shine vinyl wrap in black \(#111214\) to only the roof and the side mirror caps/);
    expect(image.input_references[0].image_url.url).toBe(`data:image/jpeg;base64,${photo}`);
  });

  it('refuses to edit photos that are not of a car', async () => {
    for (const answer of [{ vehicle: false, person: true }, { vehicle: true, person: true }, { vehicle: false, person: false }]) {
      calls = [];
      chatAnswer = () => answer;
      const res = await POST(aiRequest({ tool: 'wrap', fields: { finish: 'gloss', color: { name: 'Red' }, coverage: 'full', size: 'sedan', photo: '/9j/' + 'B'.repeat(400), aspectRatio: '1:1' } }));
      expect(res.status).toBe(422);
      expect((await res.json()).code).toBe('not_a_car');
      expect(calls.some((c) => c.url.endsWith('/images'))).toBe(false);
    }
  });

  it('draws a car without a photo using the NHTSA name', async () => {
    const res = await POST(aiRequest({ tool: 'wrap', fields: { finish: 'gloss', color: { name: 'Red' }, coverage: 'full', size: 'sedan', vehicle: { year: '2018', make: 'honda', model: 'civic' } } }));
    expect(res.status).toBe(200);
    const image = calls.find((c) => c.url.endsWith('/images'))!.body;
    expect(image.prompt).toMatch(/^A realistic photo of a 2018 honda Civic\. It has a full high-gloss vinyl wrap in red/);
    expect(image.input_references).toBeUndefined();
  });

  it('enforces the daily caps with a friendly message', async () => {
    vi.stubEnv('AI_TEXT_DAILY_LIMIT_PER_IP', '2');
    const send = () => POST(aiRequest({ tool: 'service-promos', fields: {} }));
    chatAnswer = () => ({ items: [] });
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    const res = await send();
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "You've reached today's limit for our AI tools. Please try again tomorrow.", code: 'daily_limit' });
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(calls).toHaveLength(2);

    vi.stubEnv('AI_IMAGE_DAILY_LIMIT', '0');
    const image = await POST(aiRequest({ tool: 'wrap', fields: { finish: 'gloss', color: { name: 'Red' }, coverage: 'full', size: 'sedan' } }));
    expect(image.status).toBe(429);
    expect((await image.json()).error).toMatch(/very busy today.*try again tomorrow/);
  });

  it('does not use up the allowance on invalid requests or a missing key', async () => {
    vi.stubEnv('AI_TEXT_DAILY_LIMIT_PER_IP', '1');
    await POST(aiRequest({ tool: 'car-price', fields: { vehicle: { year: 'x' } } }));
    vi.stubEnv('OPENROUTER_API_KEY', '');
    expect((await POST(aiRequest({ tool: 'service-promos', fields: {} }))).status).toBe(500);
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    chatAnswer = () => ({ items: [] });
    expect((await POST(aiRequest({ tool: 'service-promos', fields: {} }))).status).toBe(200);
  });
});

describe('GET /api/places', () => {
  const placesRequest = (search: string) => new Request(`${SITE}/api/places${search}`, { headers: { origin: SITE, 'x-real-ip': ip } });

  it('answers the exact URL the page builds, and nothing else (keeps the CDN cache effective)', async () => {
    expect((await GET(placesRequest('?zip=90210&service=brakes'))).status).toBe(200);
    for (const search of ['?zip=90210&service=brakes&x=1', '?service=brakes&zip=90210', '?zip=90210&service=brakes&zip=10001', '?zip=90210']) {
      expect((await GET(placesRequest(search))).status).toBe(400);
    }
    expect(calls.filter((c) => c.url.includes('places.googleapis.com'))).toHaveLength(1);
  });

  it('caps uncached Google searches per day', async () => {
    vi.stubEnv('PLACES_DAILY_LIMIT', '2');
    expect((await GET(placesRequest('?zip=10001&service=general'))).status).toBe(200);
    ip = '198.51.100.200';
    expect((await GET(placesRequest('?zip=10002&service=general'))).status).toBe(200);
    ip = '198.51.100.201';
    const res = await GET(placesRequest('?zip=10003&service=general'));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/daily limit\. Please try again tomorrow/);
    expect(body.mapsUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/search\//);
    expect(calls).toHaveLength(2);
  });
});
