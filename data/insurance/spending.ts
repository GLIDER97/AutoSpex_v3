// What US households spend on vehicle insurance (data/insurance/spending.json, written by scripts/insurance/spending.mjs,
// from the BLS Consumer Expenditure Surveys). Every figure on /car-insurance/average-cost is computed here.

interface Row {
  id: string;
  label: string;
  values: Record<string, number>;
}
interface SpendingFile {
  asOf: string;
  latestYear: number;
  source: string;
  groups: Record<'all' | 'region' | 'age' | 'income', { label: string; rows: Row[] }>;
  totalSpending: { id: string; values: Record<string, number> };
}

const files = import.meta.glob<SpendingFile>('./spending.json', { eager: true, import: 'default' });
const empty = { label: '', rows: [] };
const raw: SpendingFile = Object.values(files)[0] ?? {
  asOf: '',
  latestYear: 0,
  source: '',
  groups: { all: empty, region: empty, age: empty, income: empty },
  totalSpending: { id: '', values: {} },
};

export const AVERAGE_COST_PATH = '/car-insurance/average-cost';
export const AVERAGE_COST_CSV = '/data/insurance/car-insurance-spending-by-household.csv';
export const AVERAGE_COST_TITLE = 'Average Car Insurance Cost per Year and Month';
export const SPENDING_AS_OF = raw.asOf;
export const SPENDING_YEAR = raw.latestYear;
export const SPENDING_SOURCE = raw.source;
/** FRED mirrors every BLS Consumer Expenditure series with a readable page. */
export const fredSeriesUrl = (id: string) => `https://fred.stlouisfed.org/series/${id}`;
export const CE_TABLES_URL = 'https://www.bls.gov/cex/tables.htm';

const pct = (a?: number, b?: number) => (a && b ? Math.round((b / a - 1) * 1000) / 10 : 0);

export function spendingFacts() {
  const y = String(raw.latestYear);
  const prev = String(raw.latestYear - 1);
  const all = raw.groups.all.rows[0];
  const years = Object.keys(all?.values ?? {}).sort();
  const first = years[0] ?? '';
  const latest = all?.values[y] ?? 0;
  const byLatest = (rows: Row[]) => rows.map((r) => ({ label: r.label, id: r.id, value: r.values[y] ?? 0 }));
  const region = byLatest(raw.groups.region.rows).sort((a, b) => b.value - a.value);
  const age = byLatest(raw.groups.age.rows);
  const income = byLatest(raw.groups.income.rows);
  const ageTop = [...age].sort((a, b) => b.value - a.value)[0];
  const total = raw.totalSpending.values[y] ?? 0;
  return {
    year: raw.latestYear,
    first,
    allId: all?.id ?? '',
    latest,
    monthly: Math.round(latest / 12),
    change1y: pct(all?.values[prev], latest),
    sinceFirst: pct(all?.values[first], latest),
    firstValue: all?.values[first] ?? 0,
    byYear: years.map((k) => ({ label: k, value: all.values[k] })),
    shareOfSpending: total ? Math.round((latest / total) * 1000) / 10 : 0,
    totalSpending: total,
    region,
    regionGap: region.length > 1 ? pct(region[region.length - 1].value, region[0].value) : 0,
    age,
    ageTop,
    income,
    incomeRatio: income.length > 1 && income[0].value ? Math.round((income[income.length - 1].value / income[0].value) * 10) / 10 : 0,
  };
}

/** Every series and year, one row per group and year. */
export function spendingCsv() {
  const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const lines = [['group', 'household', 'year', 'vehicle_insurance_spending_usd', 'bls_series', 'data_as_of'].map(q).join(',')];
  for (const g of Object.values(raw.groups))
    for (const r of g.rows) for (const [year, v] of Object.entries(r.values).sort()) lines.push([g.label, r.label, year, v, r.id, raw.asOf].map(q).join(','));
  for (const [year, v] of Object.entries(raw.totalSpending.values).sort())
    lines.push(['All households', 'Total spending on everything (for the share)', year, v, raw.totalSpending.id, raw.asOf].map(q).join(','));
  lines.push(q(`Source: ${raw.source}. Mean per consumer unit, US dollars a year. Retrieved ${raw.asOf} from api.bls.gov.`));
  return `${lines.join('\n')}\n`;
}
