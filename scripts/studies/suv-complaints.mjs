// Data study: NHTSA owner complaints for popular SUVs, model-years 2015-2022 (docs/GROWTH-PLAN.md section 0).
//
//   NODE_USE_ENV_PROXY=1 node scripts/studies/suv-complaints.mjs
//
// For each model and model-year it downloads every complaint from NHTSA's public API and keeps counts
// only (by component, by filing year, crashes, fires, injuries, deaths), plus the number of recalls.
// No complaint text or VINs are stored. Writes data/studies/suv-complaints.json, which the study page
// at /studies/suv-owner-complaints reads at build time.
import fs from 'node:fs/promises';

const MODELS = [
  ['Toyota', 'RAV4'],
  ['Honda', 'CR-V'],
  ['Nissan', 'Rogue'],
  ['Chevrolet', 'Equinox'],
  ['Ford', 'Escape'],
  ['Jeep', 'Grand Cherokee'],
  ['Ford', 'Explorer'],
  ['Jeep', 'Cherokee'],
  ['Subaru', 'Forester'],
  ['Toyota', 'Highlander'],
  ['Hyundai', 'Tucson'],
  ['Mazda', 'CX-5'],
  ['Jeep', 'Compass'],
  ['Kia', 'Sorento'],
  ['Subaru', 'Outback'],
  ['Honda', 'Pilot'],
  ['GMC', 'Terrain'],
  ['Chevrolet', 'Traverse'],
  ['Hyundai', 'Santa Fe'],
  ['Volkswagen', 'Tiguan'],
];
const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
const NHTSA = 'https://api.nhtsa.gov';
const out = new URL('../../data/studies/suv-complaints.json', import.meta.url);

async function getJson(url, tries = 5) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.status === 400 || res.status === 404) return { results: [], Count: 0 };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

const rows = [];
for (const [make, model] of MODELS) {
  for (const year of YEARS) {
    const q = `make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    const complaints = (await getJson(`${NHTSA}/complaints/complaintsByVehicle?${q}`)).results ?? [];
    const recalls = (await getJson(`${NHTSA}/recalls/recallsByVehicle?${q}`)).results ?? [];
    const byComponent = {};
    const byFiledYear = {};
    let crashes = 0, fires = 0, injuries = 0, deaths = 0;
    for (const c of complaints) {
      for (const comp of String(c.components || 'UNKNOWN OR OTHER').split(',')) {
        const k = comp.trim() || 'UNKNOWN OR OTHER';
        byComponent[k] = (byComponent[k] || 0) + 1;
      }
      const y = (/(\d{4})$/.exec(c.dateComplaintFiled || '') || [])[1];
      if (y) byFiledYear[y] = (byFiledYear[y] || 0) + 1;
      if (c.crash) crashes++;
      if (c.fire) fires++;
      injuries += Number(c.numberOfInjuries) || 0;
      deaths += Number(c.numberOfDeaths) || 0;
    }
    rows.push({
      make,
      model,
      year,
      complaints: complaints.length,
      recalls: recalls.length,
      crashes,
      fires,
      injuries,
      deaths,
      byComponent: Object.fromEntries(Object.entries(byComponent).sort((a, b) => b[1] - a[1])),
      byFiledYear: Object.fromEntries(Object.entries(byFiledYear).sort()),
      source: `${NHTSA}/complaints/complaintsByVehicle?${q}`,
    });
    console.log(`${year} ${make} ${model}: ${complaints.length} complaints, ${recalls.length} recalls`);
  }
}

await fs.mkdir(new URL('.', out), { recursive: true });
await fs.writeFile(
  out,
  `${JSON.stringify({ asOf: new Date().toISOString().slice(0, 10), years: YEARS, models: MODELS.map(([make, model]) => ({ make, model })), rows }, null, 1)}\n`,
);
console.log(`wrote ${rows.length} model-years`);
