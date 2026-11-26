// Car insurance prices from the BLS consumer price index (data/insurance/cpi.json, written by scripts/insurance/cpi.mjs).
// Every figure in the insurance estimator's guide section, its embeds and its CSV is computed here.

interface CpiFile {
  asOf: string;
  latest: string;
  source: string;
  series: Record<string, { name: string; values: Record<string, number> }>;
}

const files = import.meta.glob<CpiFile>('./cpi.json', { eager: true, import: 'default' });
const raw: CpiFile = Object.values(files)[0] ?? { asOf: '', latest: '', source: '', series: {} };

export const INSURANCE_PATH = '/insurance-estimator';
export const INSURANCE_CSV = '/data/insurance/car-insurance-prices-cpi.csv';
export const CPI_AS_OF = raw.asOf;
export const CPI_LATEST = raw.latest;
export const CPI_SOURCE = raw.source;

export const INSURANCE_ID = 'CUUR0000SETE';
export const ALL_ITEMS_ID = 'CUUR0000SA0';
/** Driving costs compared with car insurance, in chart order. */
export const DRIVING_COST_IDS = ['CUUR0000SETE', 'CUUR0000SETD', 'CUUR0000SETB01', 'CUUR0000SETA01', 'CUUR0000SETA02', 'CUUR0000SA0'];

/** The BLS page for a series (data tables and charts). */
export const blsSeriesUrl = (id: string) => `https://data.bls.gov/timeseries/${id}`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-10" -> "October 2026" (or "Oct 2026" with short). */
export const monthName = (key: string, short = false) => (key ? `${(short ? SHORT : MONTHS)[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}` : '');

const value = (id: string, key: string) => raw.series[id]?.values[key];
const pct = (a?: number, b?: number) => (a && b ? (b / a - 1) * 100 : null);
const shiftYears = (key: string, years: number) => `${Number(key.slice(0, 4)) - years}${key.slice(4)}`;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Every month from the first insurance value to the latest, including months BLS didn't publish. */
function monthKeys() {
  const keys = Object.keys(raw.series[INSURANCE_ID]?.values ?? {});
  if (!keys.length) return [];
  const out: string[] = [];
  let [y, m] = keys[0].split('-').map(Number);
  const [ly, lm] = raw.latest.split('-').map(Number);
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export function insuranceFacts() {
  const months = monthKeys();
  const first = months[0] ?? '';
  const latest = raw.latest;
  const ins = raw.series[INSURANCE_ID]?.values ?? {};

  // Indexed to the first month = 100, for the trend chart (insurance vs overall inflation).
  const indexed = (id: string) => months.map((k) => (value(id, k) && value(id, first) ? round1((value(id, k)! / value(id, first)!) * 100) : null));

  // Calendar-year change, December to December; the current year so far is December to the latest month.
  const years: { label: string; value: number; partial?: boolean }[] = [];
  const firstYear = Number(first.slice(0, 4));
  const latestYear = Number(latest.slice(0, 4));
  for (let y = firstYear + 1; y <= latestYear; y++) {
    const end = y === latestYear ? latest : `${y}-12`;
    const change = pct(ins[`${y - 1}-12`], ins[end]);
    if (change !== null) years.push({ label: String(y), value: round1(change), ...(y === latestYear && latest.slice(5) !== '12' && { partial: true }) });
  }
  const fullYears = years.filter((y) => !y.partial);
  const biggestYear = [...fullYears].sort((a, b) => b.value - a.value)[0];

  // Five years to the latest month, for each driving cost.
  const fiveYearsBack = shiftYears(latest, 5);
  const fiveYear = DRIVING_COST_IDS.map((id) => ({ id, name: raw.series[id]?.name ?? id, value: round1(pct(value(id, fiveYearsBack), value(id, latest)) ?? 0) }));

  const peakKey = Object.keys(ins).reduce((best, k) => (ins[k] > (ins[best] ?? 0) ? k : best), first);
  // 12-month change: to the latest month, or to the latest month whose year-earlier value was published.
  const yoyEnd = [...months].reverse().find((k) => ins[k] && ins[shiftYears(k, 1)]) ?? latest;
  // The 2022-2024 surge: December 2021 to December 2024.
  const surge = pct(ins['2021-12'], ins['2024-12']);

  return {
    months,
    first,
    latest,
    insuranceIndexed: indexed(INSURANCE_ID),
    allItemsIndexed: indexed(ALL_ITEMS_ID),
    sinceFirst: round1(pct(ins[first], ins[latest]) ?? 0),
    allItemsSinceFirst: round1(pct(value(ALL_ITEMS_ID, first), value(ALL_ITEMS_ID, latest)) ?? 0),
    years,
    biggestYear,
    fiveYearsBack,
    fiveYear,
    fiveYearInsurance: fiveYear.find((f) => f.id === INSURANCE_ID)?.value ?? 0,
    fiveYearAllItems: fiveYear.find((f) => f.id === ALL_ITEMS_ID)?.value ?? 0,
    peakKey,
    fromPeak: round1(pct(ins[peakKey], ins[latest]) ?? 0),
    yoyEnd,
    yoy: round1(pct(ins[shiftYears(yoyEnd, 1)], ins[yoyEnd]) ?? 0),
    surge: surge === null ? null : round1(surge),
    missing: months.filter((k) => !ins[k]),
  };
}

/** One row per month: the published index values for each series, plus insurance and all items indexed to the first month. */
export function insuranceCsv() {
  const f = insuranceFacts();
  const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const ids = Object.keys(raw.series);
  const head = ['month', ...ids.map((id) => `${raw.series[id].name} (${id})`), `Car insurance, ${monthName(f.first)} = 100`, `All items, ${monthName(f.first)} = 100`];
  const lines = [head.map(q).join(',')];
  f.months.forEach((k, i) => {
    lines.push([k, ...ids.map((id) => value(id, k) ?? ''), f.insuranceIndexed[i] ?? '', f.allItemsIndexed[i] ?? ''].map(q).join(','));
  });
  lines.push(q(`Source: ${raw.source}. Retrieved ${raw.asOf} from api.bls.gov. Blank cells: months BLS did not publish.`));
  return `${lines.join('\n')}\n`;
}
