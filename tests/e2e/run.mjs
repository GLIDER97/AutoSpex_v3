// Browser tests for every tool page, in Chromium against `npm run dev`
// (npm run test:e2e). The api/ functions run for real through the dev
// server's devApi plugin; OpenRouter, Google Places and NHTSA vPIC are
// replaced by tests/e2e/mock-upstream.mjs, so no keys or network are needed.
//
// Pass 1 uses each tool normally and checks what the server sent upstream.
// Pass 2 restarts the server with every daily limit at 0 and checks that the
// tools show the "busy, try tomorrow" message.
//
// Needs Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`
// if it isn't installed globally).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const MOCK_LOG = path.join(os.tmpdir(), `autospex-e2e-${process.pid}.jsonl`);

// --- Dev server -------------------------------------------------------------------

async function startServer(extraEnv = {}) {
  fs.writeFileSync(MOCK_LOG, '');
  const env = {
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import=${path.join(root, 'tests/e2e/mock-upstream.mjs')}`.trim(),
    MOCK_LOG,
    OPENROUTER_API_KEY: 'mock-key',
    GOOGLE_MAPS_API_KEY: 'mock-key',
    DATABASE_URL: '',
    VERCEL: '',
    ...extraEnv,
  };
  const child = spawn(path.join(root, 'node_modules/.bin/vite'), ['--port', String(PORT), '--strictPort'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (d) => (output += d));
  child.stderr.on('data', (d) => (output += d));
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`vite exited:\n${output}`);
    try {
      if ((await fetch(BASE)).ok) return { stop: () => new Promise((r) => (child.once('exit', r), child.kill()))};
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  child.kill();
  throw new Error(`vite did not start:\n${output}`);
}

const upstreamCalls = () =>
  fs.readFileSync(MOCK_LOG, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
const chatCalls = (schema) => upstreamCalls().filter((c) => c.url.endsWith('/chat/completions') && c.body.response_format?.json_schema?.name === schema);
const textOf = (call) => call.body.messages.map((m) => (typeof m.content === 'string' ? m.content : m.content.map((p) => p.text ?? '').join(''))).join('\n');

// --- Tiny test runner ---------------------------------------------------------------

const results = [];
let browser;
let carJpeg;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function test(name, fn) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const problems = [];
  const aiBodies = [];
  page.on('pageerror', (err) => problems.push(`page error: ${err.message}`));
  page.on('request', (req) => {
    if (req.url().endsWith('/api/ai')) aiBodies.push(JSON.parse(req.postData() ?? 'null'));
  });
  const started = Date.now();
  try {
    await fn(page);
    // Every call the pages make is a tool id and fields, nothing else.
    for (const body of aiBodies) {
      assert(JSON.stringify(Object.keys(body).sort()) === '["fields","tool"]', `unexpected /api/ai body keys: ${Object.keys(body)}`);
    }
    assert(problems.length === 0, problems.join('\n'));
    results.push({ name, ok: true, ms: Date.now() - started, calls: aiBodies.map((b) => b.tool) });
  } catch (err) {
    const shot = path.join(os.tmpdir(), `e2e-${name.replace(/\W+/g, '-')}.png`);
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    results.push({ name, ok: false, error: `${err.message}\n  screenshot: ${shot}` });
  } finally {
    await context.close();
  }
}

const visible = (page, text, timeout = 10_000) => page.getByText(text).first().waitFor({ state: 'visible', timeout });

async function fillVehicle(page, { year, make, model }) {
  await page.locator('select[id$="-year"]').first().selectOption(year);
  await page.locator('input[id$="-make"]').first().fill(make);
  await page.locator('input[id$="-model"]').first().fill(model);
}

// --- Pass 1: the tools work -------------------------------------------------------------

async function toolTests() {
  await test('fault code decoder + AI mechanic chat', async (page) => {
    await page.goto(`${BASE}/fault-code-decoder`);
    await page.fill('#codes', 'p0171, P0174');
    await fillVehicle(page, { year: '2016', make: 'Honda', model: 'Civic' });
    await page.getByRole('button', { name: 'Look up code' }).click();
    await visible(page, 'Mock title for P0171');
    await visible(page, 'Vacuum leak');
    const [diag] = chatCalls('fault_code');
    assert(textOf(diag).includes('Codes read from the car: P0171, P0174\nVehicle: 2016 Honda Civic'), 'fault code prompt is missing the codes or vehicle');
    assert(textOf(diag).includes('P0171: System Too Lean (Bank 1)'), 'fault code prompt is missing the built-in definitions');

    await page.getByRole('button', { name: 'Can I fix this myself?' }).click();
    await visible(page, 'check the vacuum hoses');
    await page.fill('#chat-input', 'What should I ask the shop?');
    await page.getByRole('button', { name: 'Send question' }).click();
    await page.getByText('check the vacuum hoses').nth(1).waitFor();
    const chats = upstreamCalls().filter((c) => c.url.endsWith('/chat/completions') && !c.body.response_format);
    const last = chats[chats.length - 1].body.messages;
    assert(last[0].role === 'system' && last[0].content.includes('Only help with this car'), 'chat is missing the fixed system prompt');
    assert(last[0].content.includes('Diagnosis already shown to the owner: P0171 Mock title for P0171 (Drive with caution)'), 'chat is missing the diagnosis context');
    assert(JSON.stringify(last.slice(1).map((m) => m.role)) === '["user","assistant","user"]', 'chat history roles are wrong');
  });

  await test('fault code decoder from a shared link', async (page) => {
    await page.goto(`${BASE}/fault-code-decoder?codes=P0420&year=2012&make=Toyota&model=Camry`);
    await visible(page, 'Mock title for P0420');
  });

  await test('repair quote check: typed lines', async (page) => {
    await page.goto(`${BASE}/maintenance-validator`);
    await page.getByRole('tab', { name: 'Type it in' }).click().catch(() => page.getByRole('button', { name: 'Type it in' }).click());
    await page.getByLabel('Line 1 description').fill('Front brake pads and rotors');
    await page.getByLabel('Line 1 amount').fill('450');
    await page.locator('form button[type="submit"]').first().click();
    await visible(page, 'Mock verdict: labor is billed above book time.');
    const [audit] = chatCalls('quote_audit');
    assert(textOf(audit).includes('1. [Job] Front brake pads and rotors: $450.00'), 'quote audit prompt is missing the line');
  });

  await test('repair quote check: photo of an estimate', async (page) => {
    await page.goto(`${BASE}/maintenance-validator`);
    await page.setInputFiles('#estimate-photo', { name: 'estimate.jpg', mimeType: 'image/jpeg', buffer: carJpeg });
    await visible(page, 'Read 2 lines from Mock Auto');
    await visible(page, 'Mock verdict: labor is billed above book time.');
    const [read] = chatCalls('quote_read');
    const parts = read.body.messages[0].content;
    assert(parts[0].type === 'image_url' && parts[0].image_url.url.startsWith('data:image/jpeg;base64,/9j/'), 'estimate photo not sent as a JPEG');
    assert(parts[1].text.startsWith('This is a photo of a US auto repair estimate'), 'estimate prompt is not the server one');
    const audits = chatCalls('quote_audit');
    assert(textOf(audits[audits.length - 1]).includes('Vehicle: 2017 Toyota Camry'), 'audit did not use the vehicle read from the photo');
  });

  await test('insurance estimator', async (page) => {
    await page.goto(`${BASE}/insurance-estimator`);
    await page.getByPlaceholder('e.g. 90210').fill('30301');
    await page.getByPlaceholder('2020').fill('2020');
    await page.getByPlaceholder('Toyota Camry').fill('Toyota Camry');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Get Estimate' }).click();
    await visible(page, 'Mock insurance explanation');
    const call = upstreamCalls().find((c) => c.url.endsWith('/chat/completions') && textOf(c).includes('expert insurance underwriter'));
    assert(textOf(call).includes('- Vehicle: 2020  Toyota Camry') && textOf(call).includes('- Location ZIP: 30301'), 'insurance prompt fields are wrong');
  });

  await test('affordability: price estimate', async (page) => {
    await page.goto(`${BASE}/affordability-predictor`);
    await page.getByRole('button', { name: "Don't know a fair price? Estimate it" }).click();
    await fillVehicle(page, { year: '2019', make: 'Honda', model: 'CR-V' });
    await page.fill('#trim', 'EX-L');
    await page.fill('#est-zip', '90210');
    await page.getByRole('button', { name: /^Estimate/ }).last().click();
    await page.waitForFunction(() => document.querySelector('#price')?.value === '19500', null, { timeout: 10_000 });
    const [call] = chatCalls('car_price');
    assert(textOf(call).startsWith('Estimate today\'s typical US dealer retail price for a used 2019 Honda CR-V EX-L in average condition with typical mileage, near ZIP 90210.'), 'price prompt is wrong');
  });

  await test('value shock (depreciation)', async (page) => {
    await page.goto(`${BASE}/value-shock-calculator`);
    await page.getByPlaceholder('2020').fill('2020');
    await page.getByPlaceholder('BMW').fill('BMW');
    await page.getByPlaceholder('X5', { exact: true }).fill('X5');
    await page.getByPlaceholder('xDrive40i').fill('xDrive40i');
    await page.getByPlaceholder('45000').fill('45000');
    await page.getByRole('button', { name: 'Calculate My Loss' }).click();
    await visible(page, 'Mock: losing value at a typical pace.');
    const [call] = chatCalls('depreciation');
    assert(textOf(call).includes('Vehicle: 2020 BMW X5 xDrive40i\n        Current Mileage: 45000 miles\n        Condition: good'), 'depreciation prompt is wrong');
  });

  await test('vanity plate generator', async (page) => {
    await page.goto(`${BASE}/plate-generator`);
    await page.getByPlaceholder('e.g. Tesla Model Y, Jeep Wrangler').fill('Jeep Wrangler');
    await page.getByPlaceholder('e.g. Coding, Hiking, Coffee').fill('Hiking, Coffee!');
    await page.getByRole('button', { name: 'Generate Vanity Plates' }).click();
    await visible(page, 'MOCK0');
    const [call] = chatCalls('plate_ideas');
    assert(textOf(call) === 'Generate 6 clever, creative vanity plate ideas for a Jeep Wrangler in California with hobbies Hiking, Coffee and vibe Funny. Ensure they are 7 characters or less.', 'plate prompt is wrong');
  });

  await test('service coupons feed', async (page) => {
    await page.goto(`${BASE}/coupons`);
    await visible(page, 'Mock oil change deal');
  });

  await test('wrap visualizer: drawn from the car name', async (page) => {
    await page.goto(`${BASE}/wrap-designer`);
    await fillVehicle(page, { year: '2019', make: 'Honda', model: 'Civic' });
    await page.getByRole('button', { name: 'Draw my wrap' }).click();
    await page.locator('img[alt^="AI preview:"]').first().waitFor({ timeout: 10_000 });
    const images = upstreamCalls().filter((c) => c.url.endsWith('/images'));
    assert(images.length === 1 && images[0].body.prompt.startsWith('A realistic photo of a 2019 Honda Civic. It has a full satin, with a soft low sheen vinyl wrap in battleship grey (#6b6f72).'), `image prompt is wrong: ${images[0]?.body.prompt}`);
    assert(!images[0].body.input_references, 'no photo should be sent');
    assert(await page.getByLabel(/Anything else/).count() === 0, 'the free-text field should be gone');
  });

  await test('wrap visualizer: own photo, custom color', async (page) => {
    await page.goto(`${BASE}/wrap-designer`);
    await page.setInputFiles('input[aria-label="Car photo"]', { name: 'car.jpg', mimeType: 'image/jpeg', buffer: carJpeg });
    await page.locator('img[alt="Your car photo"]').waitFor();
    await page.locator('input[type="color"]').evaluate((el) => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(el, '#ff8800');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.getByRole('button', { name: 'Show it on my car' }).click();
    await page.getByLabel('Compare before and after').waitFor({ timeout: 10_000 });
    const calls = upstreamCalls();
    const check = calls.findLastIndex((c) => c.body?.response_format?.json_schema?.name === 'wrap_photo_check');
    const image = calls.findLastIndex((c) => c.url.endsWith('/images'));
    assert(check >= 0 && image > check, 'the photo must be checked before it is edited');
    const prompt = calls[image].body.prompt;
    assert(prompt.includes('custom color (#ff8800)') && prompt.includes("Repaint only the vehicle's body panels"), `photo prompt is wrong: ${prompt}`);
    assert(calls[image].body.input_references[0].image_url.url.startsWith('data:image/jpeg;base64,'), 'photo not sent for editing');
  });

  await test('wrap visualizer: wrap shops', async (page) => {
    await page.goto(`${BASE}/wrap-designer`);
    const zip = page.locator('input[id*="zip"]').last();
    await zip.fill('78701');
    await zip.press('Enter');
    await visible(page, 'Mock Garage');
  });

  await test('mechanic finder (Google Places)', async (page) => {
    await page.goto(`${BASE}/mechanic-finder`);
    await page.selectOption('#mechanic-service', 'brakes');
    await page.fill('#mechanic-zip', '78701');
    await page.getByRole('button', { name: 'Find shops' }).click();
    await visible(page, 'Mock Garage');
    const google = upstreamCalls().filter((c) => c.url.includes('places.googleapis.com'));
    assert(google.at(-1).body.textQuery === 'brake repair shop near 78701, USA', 'places query is wrong');
  });

  for (const [route, text] of [
    ['/', null],
    ['/vin-lookup', null],
    ['/mpg-calculator', null],
    ['/ownership-calculator', null],
    ['/recalls', null],
    ['/diy-toolkits', null],
  ]) {
    await test(`page loads: ${route}`, async (page) => {
      const res = await page.goto(`${BASE}${route}`);
      assert(res.ok(), `HTTP ${res.status()}`);
      await page.locator('h1').first().waitFor();
      if (text) await visible(page, text);
    });
  }
}

// --- Pass 2: daily limits reached ----------------------------------------------------------

const BUSY = /very busy today and have reached their daily limit\. Please try again tomorrow\./;

async function limitTests() {
  await test('limit: fault code decoder', async (page) => {
    await page.goto(`${BASE}/fault-code-decoder?codes=P0171`);
    await page.getByText(BUSY).first().waitFor();
  });

  await test('limit: plate generator', async (page) => {
    await page.goto(`${BASE}/plate-generator`);
    await page.getByPlaceholder('e.g. Tesla Model Y, Jeep Wrangler').fill('Jeep Wrangler');
    await page.getByPlaceholder('e.g. Coding, Hiking, Coffee').fill('Hiking');
    await page.getByRole('button', { name: 'Generate Vanity Plates' }).click();
    await page.getByText(BUSY).first().waitFor();
  });

  await test('limit: insurance explanation', async (page) => {
    await page.goto(`${BASE}/insurance-estimator`);
    await page.getByPlaceholder('e.g. 90210').fill('30301');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Get Estimate' }).click();
    await page.getByText(BUSY).first().waitFor();
  });

  await test('limit: value shock', async (page) => {
    await page.goto(`${BASE}/value-shock-calculator`);
    await page.getByPlaceholder('2020').fill('2020');
    await page.getByPlaceholder('BMW').fill('BMW');
    await page.getByPlaceholder('X5', { exact: true }).fill('X5');
    await page.getByPlaceholder('45000').fill('45000');
    await page.getByRole('button', { name: 'Calculate My Loss' }).click();
    await page.getByText(BUSY).first().waitFor();
  });

  await test('limit: affordability price estimate', async (page) => {
    await page.goto(`${BASE}/affordability-predictor`);
    await page.getByRole('button', { name: "Don't know a fair price? Estimate it" }).click();
    await fillVehicle(page, { year: '2019', make: 'Honda', model: 'CR-V' });
    await page.getByRole('button', { name: /^Estimate/ }).last().click();
    await page.getByText(BUSY).first().waitFor();
  });

  await test('limit: repair quote check', async (page) => {
    await page.goto(`${BASE}/maintenance-validator`);
    await page.getByRole('tab', { name: 'Type it in' }).click().catch(() => page.getByRole('button', { name: 'Type it in' }).click());
    await page.getByLabel('Line 1 description').fill('Oil change');
    await page.getByLabel('Line 1 amount').fill('80');
    await page.locator('form button[type="submit"]').first().click();
    await page.getByText(BUSY).first().waitFor();
  });

  await test('limit: coupons feed', async (page) => {
    await page.goto(`${BASE}/coupons`);
    await page.getByText(BUSY).first().waitFor();
  });

  await test('limit: wrap visualizer', async (page) => {
    await page.goto(`${BASE}/wrap-designer`);
    await page.getByRole('button', { name: 'Draw my wrap' }).click();
    await page.getByText(BUSY).first().waitFor();
  });

  await test('limit: mechanic finder', async (page) => {
    await page.goto(`${BASE}/mechanic-finder`);
    await page.fill('#mechanic-zip', '78701');
    await page.getByRole('button', { name: 'Find shops' }).click();
    await page.getByText(/Shop search is very busy today and has reached its daily limit\. Please try again tomorrow/).first().waitFor();
  });

  await test('limit: nothing reached the paid APIs', async () => {
    const paid = upstreamCalls().filter((c) => !c.url.includes('vpic.nhtsa.dot.gov'));
    assert(paid.length === 0, `${paid.length} upstream calls were made: ${paid.map((c) => c.url).join(', ')}`);
  });
}

// --- Main ------------------------------------------------------------------------------------

browser = await chromium.launch();
{
  // A plain JPEG made by Chromium, used as the car and estimate photos.
  const page = await browser.newPage();
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 420;
    const g = c.getContext('2d');
    g.fillStyle = '#87a8c8';
    g.fillRect(0, 0, 640, 420);
    g.fillStyle = '#b3141e';
    g.fillRect(120, 200, 400, 110);
    return c.toDataURL('image/jpeg', 0.9);
  });
  carJpeg = Buffer.from(dataUrl.split(',')[1], 'base64');
  await page.close();
}

let server = await startServer();
try {
  await toolTests();
} finally {
  await server.stop();
}
server = await startServer({ AI_TEXT_DAILY_LIMIT: '0', AI_IMAGE_DAILY_LIMIT: '0', PLACES_DAILY_LIMIT: '0' });
try {
  await limitTests();
} finally {
  await server.stop();
  await browser.close();
  fs.rmSync(MOCK_LOG, { force: true });
}

for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? ` (${r.ms} ms${r.calls.length ? `; ${r.calls.join(', ')}` : ''})` : `\n  ${r.error}`}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
