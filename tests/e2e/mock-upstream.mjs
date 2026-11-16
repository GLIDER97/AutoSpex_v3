// Preloaded into `npm run dev` for the browser tests (node --import): replaces
// the paid upstream APIs (OpenRouter, Google Places) and NHTSA's vPIC with
// canned answers, so the api/ functions run for real without keys or network.
// Every upstream request is appended to $MOCK_LOG as one JSON line.
import fs from 'node:fs';

const realFetch = globalThis.fetch;
const log = process.env.MOCK_LOG;

// A 2x2 PNG, returned as the wrap preview.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DAwMDAxMDAwMDAAAANHQEDK+mmyAAAAABJRU5ErkJggg==';

function answerFor(payload) {
  const name = payload.response_format?.json_schema?.name;
  const text = payload.messages
    .map((m) => (typeof m.content === 'string' ? m.content : m.content.map((p) => p.text ?? '').join('')))
    .join('\n');
  switch (name) {
    case 'fault_code': {
      const codes = (text.match(/Codes read from the car: (.*)/)?.[1] ?? 'P0171').split(', ');
      return {
        codes: codes.map((code) => ({
          code,
          title: `Mock title for ${code}`,
          system: 'Fuel and air metering',
          meaning: 'The engine computer sees more air than fuel.',
          severity: 'Medium',
          drive: 'Drive with caution',
          driveAdvice: 'Fine for short trips; get it checked soon.',
          symptoms: ['Rough idle', 'Hesitation'],
        })),
        combined: codes.length > 1 ? 'Both banks lean points to a shared cause such as a vacuum leak.' : '',
        causes: [
          { cause: 'Vacuum leak', likelihood: 'Most likely', howToConfirm: 'Smoke test', fix: 'Replace the cracked hose', diy: 'Moderate DIY', partsLow: 20, partsHigh: 80, laborHoursLow: 0.5, laborHoursHigh: 1.5 },
          { cause: 'Dirty MAF sensor', likelihood: 'Likely', howToConfirm: 'Check live data', fix: 'Clean the sensor', diy: 'Easy DIY', partsLow: 10, partsHigh: 15, laborHoursLow: 0.2, laborHoursHigh: 0.5 },
        ],
        quickChecks: ['Check the gas cap', 'Listen for hissing'],
        watchOut: 'Shops often replace O2 sensors first.',
      };
    }
    case 'quote_read':
      return {
        vehicle: { year: '2017', make: 'Toyota', model: 'Camry' },
        shopName: 'Mock Auto',
        zip: '60601',
        lines: [
          { description: 'Front brake pads', type: 'Part', quantity: 1, amount: 89.99 },
          { description: 'Brake labor', type: 'Labor', quantity: 1.5, amount: 210 },
        ],
      };
    case 'quote_audit': {
      const count = (text.match(/^\d+\. \[/gm) ?? []).length;
      return {
        verdict: 'A bit high',
        headline: 'Mock verdict: labor is billed above book time.',
        fairLow: 200,
        fairHigh: 260,
        lines: Array.from({ length: count }, () => ({ verdict: 'Fair', fairLow: 80, fairHigh: 120, note: 'Typical price.' })),
        canWait: [{ item: 'Cabin filter', why: 'Often upsold.' }],
        missing: [],
        questions: ['What is the book time for this job?'],
        script: 'I was quoted more than book time; can you match it?',
      };
    }
    case 'car_price':
      return { priceLow: 18000, priceHigh: 21000, fairPrice: 19500, note: 'Mock: mileage moves the price most.' };
    case 'depreciation':
      return {
        currentValue: { tradeIn: 30000, privateParty: 33000 },
        futureValue: { tradeIn: 26000, privateParty: 29000 },
        depreciation: { totalOneYear: 4000, perDay: 10.96, percentDrop: 12 },
        verdict: { status: 'Normal Depreciation', color: 'text-yellow-500', description: 'Mock: losing value at a typical pace.' },
        marketFactors: ['Mock factor one', 'Mock factor two', 'Mock factor three'],
      };
    case 'plate_ideas':
      return { plates: Array.from({ length: 6 }, (_, i) => ({ plate: `MOCK${i}`, meaning: `Mock meaning ${i}`, category: 'Funny' })) };
    case 'service_promos':
      return { items: [{ shop: 'Mock Lube', offer: 'Mock oil change deal', savingValue: '$20 Off', validIn: 'Nationwide', category: 'Oil Change' }] };
    case 'diy_toolkits':
      return { items: [{ name: 'Mock scanner', brand: 'Mock', rating: 4.6, category: 'Diagnostics', bestFor: 'Reading codes', imageUrl: 'https://example.com/x.jpg' }] };
    case 'wrap_photo_check':
      return { vehicle: true, person: false };
    case undefined:
      return payload.messages[0].role === 'system'
        ? 'Mock mechanic answer: **check the vacuum hoses** first.'
        : 'Mock insurance explanation: your clean record keeps the price down.';
    default:
      throw new Error(`mock-upstream: no answer for schema ${name}`);
  }
}

const reply = (data) => new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });

globalThis.fetch = async (input, init) => {
  const url = String(input instanceof Request ? input.url : input);
  const host = new URL(url).host;
  if (!['openrouter.ai', 'places.googleapis.com', 'vpic.nhtsa.dot.gov'].includes(host)) return realFetch(input, init);
  const body = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
  if (log) fs.appendFileSync(log, JSON.stringify({ url, body }) + '\n');
  await new Promise((r) => setTimeout(r, 150));

  if (url.endsWith('/chat/completions')) {
    const answer = answerFor(body);
    return reply({ choices: [{ message: { content: typeof answer === 'string' ? answer : JSON.stringify(answer) }, finish_reason: 'stop' }] });
  }
  if (url.endsWith('/images')) return reply({ data: [{ b64_json: PNG }] });
  if (host === 'places.googleapis.com') {
    return reply({
      places: [
        { id: 'mock1', displayName: { text: 'Mock Garage' }, formattedAddress: '1 Main St', rating: 4.8, userRatingCount: 210, nationalPhoneNumber: '(555) 010-0000', businessStatus: 'OPERATIONAL' },
        { id: 'mock2', displayName: { text: 'Second Mock Shop' }, formattedAddress: '2 Main St', rating: 4.5, userRatingCount: 80, businessStatus: 'OPERATIONAL' },
      ],
    });
  }
  if (host === 'vpic.nhtsa.dot.gov') return reply({ Results: [{ Make_Name: 'HONDA', Model_Name: 'Civic' }, { Make_Name: 'HONDA', Model_Name: 'Accord' }] });
  throw new Error(`mock-upstream: unexpected ${url}`);
};
