// Weekly data snapshot for the vehicle report pages (/cars/<make>/<model>/<year>), docs/GROWTH-PLAN.md section 0.
//
//   NODE_USE_ENV_PROXY=1 node scripts/vehicles/snapshot.mjs          every vehicle in data/vehicles/list.json
//   NODE_USE_ENV_PROXY=1 node scripts/vehicles/snapshot.mjs ford-escape-2018
//
// Reads the free official APIs (NHTSA complaints, recalls and NCAP crash ratings; EPA fueleconomy.gov)
// and writes data/vehicles/<make>-<model>-<year>.json with counts only, never complaint text or VINs.
// The build reads these files; it never calls the APIs itself. A model-year is published only with
// at least 25 complaints or at least 1 recall (data/vehicles/index.ts enforces it).
import fs from 'node:fs/promises';

const dir = new URL('../../data/vehicles/', import.meta.url);
const list = JSON.parse(await fs.readFile(new URL('list.json', dir), 'utf8'));
export const slugOf = (v) => `${v.make}-${v.model}-${v.year}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function getJson(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

const NHTSA = 'https://api.nhtsa.gov';
const EPA = 'https://www.fueleconomy.gov/ws/rest';
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const dmy = (s) => {
  // NHTSA recall dates are DD/MM/YYYY.
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
const mdyYear = (s) => (/(\d{4})$/.exec(s || '') || [])[1];

async function snapshot(v) {
  const q = `make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}&modelYear=${v.year}`;
  const complaintsUrl = `${NHTSA}/complaints/complaintsByVehicle?${q}`;
  const recallsUrl = `${NHTSA}/recalls/recallsByVehicle?${q}`;
  const ratingsUrl = `${NHTSA}/SafetyRatings/modelyear/${v.year}/make/${encodeURIComponent(v.make)}/model/${encodeURIComponent(v.model)}`;

  const complaints = (await getJson(complaintsUrl)).results ?? [];
  const byComponent = {};
  const byFiledYear = {};
  let crashes = 0, fires = 0, injuries = 0, deaths = 0;
  for (const c of complaints) {
    for (const comp of String(c.components || 'UNKNOWN OR OTHER').split(',')) {
      const k = comp.trim() || 'UNKNOWN OR OTHER';
      byComponent[k] = (byComponent[k] || 0) + 1;
    }
    const y = mdyYear(c.dateComplaintFiled);
    if (y) byFiledYear[y] = (byFiledYear[y] || 0) + 1;
    if (c.crash) crashes++;
    if (c.fire) fires++;
    injuries += Number(c.numberOfInjuries) || 0;
    deaths += Number(c.numberOfDeaths) || 0;
  }

  const recalls = ((await getJson(recallsUrl)).results ?? [])
    .map((r) => ({
      campaign: r.NHTSACampaignNumber,
      date: dmy(r.ReportReceivedDate),
      component: r.Component,
      summary: r.Summary,
      consequence: r.Consequence,
      remedy: r.Remedy,
      parkIt: Boolean(r.parkIt),
      parkOutside: Boolean(r.parkOutSide),
    }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const variants = (await getJson(ratingsUrl)).Results ?? [];
  const ratings = [];
  for (const variant of variants) {
    const r = ((await getJson(`${NHTSA}/SafetyRatings/VehicleId/${variant.VehicleId}`)).Results ?? [])[0];
    if (!r) continue;
    ratings.push({
      vehicle: r.VehicleDescription,
      overall: r.OverallRating,
      frontal: r.OverallFrontCrashRating,
      side: r.OverallSideCrashRating,
      rollover: r.RolloverRating,
      rolloverRisk: r.RolloverPossibility || null,
      url: `https://www.nhtsa.gov/vehicle/${v.year}/${encodeURIComponent(v.make.toUpperCase())}/${encodeURIComponent(v.model.toUpperCase())}`,
    });
  }

  // EPA lists models with drivetrain suffixes ("Escape FWD", "Escape AWD").
  const models = arr((await getJson(`${EPA}/vehicle/menu/model?year=${v.year}&make=${encodeURIComponent(v.make)}`))?.menuItem)
    .map((m) => m.value)
    .filter((m) => m === v.model || m.startsWith(`${v.model} `));
  const mpg = [];
  for (const model of models) {
    const opts = arr((await getJson(`${EPA}/vehicle/menu/options?year=${v.year}&make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(model)}`))?.menuItem);
    for (const o of opts) {
      const d = await getJson(`${EPA}/vehicle/${o.value}`);
      mpg.push({
        epaId: Number(o.value),
        model: d.model,
        engine: o.text,
        drive: d.drive,
        fuel: d.fuelType1,
        city: Number(d.city08),
        highway: Number(d.highway08),
        combined: Number(d.comb08),
        url: `https://www.fueleconomy.gov/feg/PowerSearch.do?action=noform&path=1&year1=${v.year}&year2=${v.year}&make=${encodeURIComponent(v.make)}&baseModel=${encodeURIComponent(v.model)}&srchtyp=ymm`,
      });
    }
  }
  mpg.sort((a, b) => b.combined - a.combined);

  return {
    make: v.make,
    model: v.model,
    year: v.year,
    asOf: new Date().toISOString().slice(0, 10),
    complaints: {
      total: complaints.length,
      crashes,
      fires,
      injuries,
      deaths,
      byComponent: Object.entries(byComponent).sort((a, b) => b[1] - a[1]).map(([component, count]) => ({ component, count })),
      byFiledYear: Object.entries(byFiledYear).sort().map(([year, count]) => ({ year: Number(year), count })),
    },
    recalls,
    ratings,
    mpg,
    sources: {
      complaints: complaintsUrl,
      recalls: recallsUrl,
      ratings: ratingsUrl,
      nhtsaPage: `https://www.nhtsa.gov/vehicle/${v.year}/${encodeURIComponent(v.make.toUpperCase())}/${encodeURIComponent(v.model.toUpperCase())}`,
      epa: `https://www.fueleconomy.gov/feg/PowerSearch.do?action=noform&path=1&year1=${v.year}&year2=${v.year}&make=${encodeURIComponent(v.make)}&baseModel=${encodeURIComponent(v.model)}&srchtyp=ymm`,
    },
  };
}

const only = process.argv.slice(2);
for (const v of list) {
  const slug = slugOf(v);
  if (only.length && !only.includes(slug)) continue;
  const data = await snapshot(v);
  await fs.writeFile(new URL(`${slug}.json`, dir), `${JSON.stringify(data, null, 1)}\n`);
  console.log(`${slug}: ${data.complaints.total} complaints, ${data.recalls.length} recalls, ${data.ratings.length} rated variants, ${data.mpg.length} EPA versions`);
}
