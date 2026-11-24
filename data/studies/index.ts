// Data study: owner complaints to NHTSA for 20 popular SUVs, model-years 2015-2022 (data/studies/suv-complaints.json,
// written by scripts/studies/suv-complaints.mjs). Counts only; every figure on the study page is computed here.
import { SITE_URL } from '../../seo/site';
import { componentName } from '../vehicles';

export interface StudyRow {
  make: string;
  model: string;
  year: number;
  complaints: number;
  recalls: number;
  crashes: number;
  fires: number;
  injuries: number;
  deaths: number;
  byComponent: Record<string, number>;
  byFiledYear: Record<string, number>;
  source: string;
}

interface StudyFile {
  asOf: string;
  years: number[];
  models: { make: string; model: string }[];
  rows: StudyRow[];
}

const files = import.meta.glob<StudyFile>('./suv-complaints.json', { eager: true, import: 'default' });
const raw: StudyFile = Object.values(files)[0] ?? { asOf: '', years: [], models: [], rows: [] };

export const SUV_STUDY_PATH = '/studies/suv-owner-complaints';
export const SUV_STUDY_CSV = '/data/studies/suv-owner-complaints-2015-2022.csv';
export const SUV_STUDY_TITLE = 'SUVs With the Most Owner Complaints, 2015–2022';
export const SUV_STUDY_DESCRIPTION =
  'Which used SUVs get the most owner complaints? NHTSA complaint counts for 20 popular SUVs, model-years 2015–2022, by year, model and problem area, with the data.';

export const STUDY_AS_OF = raw.asOf;
export const STUDY_YEARS = raw.years;
export const modelName = (r: { make: string; model: string }) => `${r.make} ${r.model}`;
export const rowName = (r: StudyRow) => `${r.year} ${r.make} ${r.model}`;

/** Model-years with at least one complaint (a model not sold that year, or listed under another name, has none). */
export const STUDY_ROWS: StudyRow[] = raw.rows.filter((r) => r.complaints > 0);
export const STUDY_MODELS = raw.models.filter((m) => STUDY_ROWS.some((r) => r.make === m.make && r.model === m.model));

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function studyFacts() {
  const rows = STUDY_ROWS;
  const total = sum(rows.map((r) => r.complaints));
  const byModelYear = [...rows].sort((a, b) => b.complaints - a.complaints);
  const byModel = STUDY_MODELS.map((m) => {
    const rs = rows.filter((r) => r.make === m.make && r.model === m.model);
    return { name: modelName(m), complaints: sum(rs.map((r) => r.complaints)), years: rs.length, worst: [...rs].sort((a, b) => b.complaints - a.complaints)[0] };
  }).sort((a, b) => b.complaints - a.complaints);

  // Problem areas across every complaint (one complaint can name several).
  const components: Record<string, number> = {};
  for (const r of rows) for (const [k, v] of Object.entries(r.byComponent)) components[k] = (components[k] ?? 0) + v;
  const topComponents = Object.entries(components)
    .filter(([k]) => k !== 'UNKNOWN OR OTHER')
    .sort((a, b) => b[1] - a[1])
    .map(([component, count]) => ({ component, name: componentName(component), count }));

  // Complaints by the year they were filed, all model-years together.
  const filed: Record<string, number> = {};
  for (const r of rows) for (const [y, v] of Object.entries(r.byFiledYear)) filed[y] = (filed[y] ?? 0) + v;
  const filedYears = Object.entries(filed)
    .map(([year, count]) => ({ year: Number(year), count }))
    .filter((x) => x.year >= 2014)
    .sort((a, b) => a.year - b.year);

  // Complaints filed in the latest full year about model-years at least 5 years old.
  const currentYear = Number(raw.asOf.slice(0, 4));
  const lastFull = currentYear - 1;
  const oldStill = rows
    .filter((r) => r.year <= lastFull - 5)
    .map((r) => ({ r, n: r.byFiledYear[String(lastFull)] ?? 0 }))
    .sort((a, b) => b.n - a.n);

  const fires = sum(rows.map((r) => r.fires));
  const crashes = sum(rows.map((r) => r.crashes));
  const byFires = [...rows].sort((a, b) => b.fires - a.fires).filter((r) => r.fires > 0);
  const recalls = sum(rows.map((r) => r.recalls));

  return { total, byModelYear, byModel, topComponents, filedYears, oldStill, lastFull, currentYear, fires, crashes, byFires, recalls, rows };
}

/** One CSV row per model-year: the study's full table. */
export function studyCsv() {
  const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const head = ['model_year', 'make', 'model', 'owner_complaints', 'top_problem_area', 'top_area_complaints', 'reported_crashes', 'reported_fires', 'reported_injuries', 'reported_deaths', 'recalls', 'nhtsa_source', 'data_as_of'];
  const lines = [head.map(q).join(',')];
  for (const r of [...raw.rows].sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || a.year - b.year)) {
    const top = Object.entries(r.byComponent).find(([k]) => k !== 'UNKNOWN OR OTHER');
    lines.push(
      [r.year, r.make, r.model, r.complaints, top ? componentName(top[0]) : '', top?.[1] ?? '', r.crashes, r.fires, r.injuries, r.deaths, r.recalls, r.source, raw.asOf]
        .map(q)
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

export const STUDY_URL = `${SITE_URL}${SUV_STUDY_PATH}`;
