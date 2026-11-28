// What US households spend on vehicle insurance, from the BLS Consumer Expenditure Surveys (docs/SILOS.md, silo 1,
// /car-insurance/average-cost).
//
//   NODE_USE_ENV_PROXY=1 node scripts/insurance/spending.mjs            # download from api.bls.gov
//   node scripts/insurance/spending.mjs --file <saved BLS response.json>  # use a response saved earlier
//
// Mean annual spending on vehicle insurance (CE item 500110) per consumer unit: all households, by region, by age
// of the reference person and by income quintile, plus total spending. One request to the free BLS API (v2, no key:
// a low daily limit). Writes data/insurance/spending.json. Refresh each September, when BLS publishes a new year.
import fs from 'node:fs/promises';

const GROUPS = {
  all: { label: 'All households', codes: { LB0101: 'All US households' } },
  region: { label: 'Region', codes: { LB1102: 'Northeast', LB1103: 'Midwest', LB1104: 'South', LB1105: 'West' } },
  age: {
    label: 'Age of the household head',
    codes: { LB0402: 'Under 25', LB0403: '25–34', LB0404: '35–44', LB0405: '45–54', LB0406: '55–64', LB0408: '65–74', LB0409: '75 and over' },
  },
  income: {
    label: 'Household income',
    codes: { LB0102: 'Lowest 20%', LB0103: 'Second 20%', LB0104: 'Middle 20%', LB0105: 'Fourth 20%', LB0106: 'Highest 20%' },
  },
};
const TOTAL = 'CXUTOTALEXPLB0101M';
// Years before 2019 sit on a much lower level (the series rises 58% from 2018 to 2019), so they are left out
// until their comparability is confirmed.
const FIRST_YEAR = 2019;
const id = (code) => `CXU500110${code}M`;
const out = new URL('../../data/insurance/spending.json', import.meta.url);

const ids = [...Object.values(GROUPS).flatMap((g) => Object.keys(g.codes).map(id)), TOTAL];

async function download() {
  const endyear = String(new Date().getUTCFullYear());
  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesid: ids, startyear: String(FIRST_YEAR), endyear }),
  });
  if (!res.ok) throw new Error(`BLS API: HTTP ${res.status}`);
  return res.json();
}

const fileArg = process.argv.indexOf('--file');
const body = fileArg > 0 ? JSON.parse(await fs.readFile(process.argv[fileArg + 1], 'utf8')) : await download();
if (body.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS API: ${body.status} ${JSON.stringify(body.message)}`);

const values = {};
for (const s of body.Results.series) {
  const v = {};
  for (const d of s.data) if (Number(d.year) >= FIRST_YEAR && d.period === 'A01' && Number.isFinite(Number(d.value))) v[d.year] = Number(d.value);
  values[s.seriesID] = v;
}
for (const sid of ids) if (!values[sid] || !Object.keys(values[sid]).length) throw new Error(`BLS API: no data for ${sid}`);

const latestYear = Math.max(...Object.keys(values[id('LB0101')]).map(Number));
const file = {
  asOf: new Date().toISOString().slice(0, 10),
  latestYear,
  source: 'U.S. Bureau of Labor Statistics, Consumer Expenditure Surveys: mean annual expenditure on vehicle insurance per consumer unit',
  groups: Object.fromEntries(
    Object.entries(GROUPS).map(([key, g]) => [
      key,
      { label: g.label, rows: Object.entries(g.codes).map(([code, label]) => ({ id: id(code), label, values: values[id(code)] })) },
    ]),
  ),
  totalSpending: { id: TOTAL, values: values[TOTAL] },
};
await fs.mkdir(new URL('.', out), { recursive: true });
await fs.writeFile(out, `${JSON.stringify(file, null, 1)}\n`);
console.log(`spending: wrote ${ids.length} series, ${FIRST_YEAR}–${latestYear} (${out.pathname})`);
