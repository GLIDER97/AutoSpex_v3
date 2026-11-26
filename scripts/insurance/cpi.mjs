// Car insurance prices from the BLS consumer price index (docs/CONTENT-RULE.md, the /insurance-estimator piece).
//
//   NODE_USE_ENV_PROXY=1 node scripts/insurance/cpi.mjs            # download from api.bls.gov
//   node scripts/insurance/cpi.mjs --file <saved BLS response.json>  # use a response saved earlier
//
// Monthly index values (not seasonally adjusted, U.S. city average) for motor vehicle insurance and the other
// costs of running a car, from the free BLS public API (v2, no key: a low daily limit, so one request per run).
// Writes data/insurance/cpi.json, which the insurance estimator's guide section reads at build time.
// Refresh monthly, after BLS publishes the CPI (around the middle of each month).
import fs from 'node:fs/promises';

export const SERIES = {
  CUUR0000SETE: 'Car insurance',
  CUUR0000SA0: 'All items (overall inflation)',
  CUUR0000SETD: 'Car maintenance and repair',
  CUUR0000SETA01: 'New cars and trucks',
  CUUR0000SETA02: 'Used cars and trucks',
  CUUR0000SETB01: 'Gasoline',
};
const FIRST_YEAR = 2017;
const out = new URL('../../data/insurance/cpi.json', import.meta.url);

async function download() {
  const endyear = String(new Date().getUTCFullYear());
  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesid: Object.keys(SERIES), startyear: String(FIRST_YEAR), endyear }),
  });
  if (!res.ok) throw new Error(`BLS API: HTTP ${res.status}`);
  return res.json();
}

const fileArg = process.argv.indexOf('--file');
const body = fileArg > 0 ? JSON.parse(await fs.readFile(process.argv[fileArg + 1], 'utf8')) : await download();
if (body.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS API: ${body.status} ${JSON.stringify(body.message)}`);

const series = {};
let latest = '';
for (const s of body.Results.series) {
  if (!SERIES[s.seriesID]) continue;
  const values = {};
  const missing = [];
  for (const d of s.data) {
    if (!/^M(0[1-9]|1[0-2])$/.test(d.period) || Number(d.year) < FIRST_YEAR) continue;
    const key = `${d.year}-${d.period.slice(1)}`;
    const v = Number(d.value);
    // BLS prints "-" for months it didn't publish (October 2025, during the federal funding lapse).
    if (Number.isFinite(v) && d.value.trim() !== '-') values[key] = v;
    else missing.push(key);
  }
  const keys = Object.keys(values).sort();
  if (s.seriesID === 'CUUR0000SETE') latest = keys[keys.length - 1];
  series[s.seriesID] = { name: SERIES[s.seriesID], values: Object.fromEntries(keys.map((k) => [k, values[k]])) };
}
for (const id of Object.keys(SERIES)) if (!series[id]) throw new Error(`BLS API: no data for ${id}`);

const file = {
  asOf: new Date().toISOString().slice(0, 10),
  latest,
  source: 'U.S. Bureau of Labor Statistics, Consumer Price Index for All Urban Consumers (CPI-U), U.S. city average, not seasonally adjusted',
  series,
};
await fs.mkdir(new URL('.', out), { recursive: true });
await fs.writeFile(out, `${JSON.stringify(file, null, 1)}\n`);
console.log(`cpi: wrote ${Object.keys(series).length} series to ${latest} (${out.pathname})`);
