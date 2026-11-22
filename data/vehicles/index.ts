// Vehicle report pages (/cars/<make>/<model>/<year>) read the weekly snapshots written by
// scripts/vehicles/snapshot.mjs from NHTSA and EPA data. Counts only: no complaint text or VINs.
// A model-year is published only with at least 25 complaints or at least 1 recall, so no page is thin
// (docs/GROWTH-PLAN.md section 0).

export interface VehicleRecall {
  campaign: string;
  /** YYYY-MM-DD the manufacturer's report reached NHTSA. */
  date: string | null;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  parkIt: boolean;
  parkOutside: boolean;
}

export interface VehicleRating {
  vehicle: string;
  overall: string;
  frontal: string;
  side: string;
  rollover: string;
  rolloverRisk: number | null;
  url: string;
}

export interface VehicleMpg {
  epaId: number;
  model: string;
  engine: string;
  drive: string;
  fuel: string;
  city: number;
  highway: number;
  combined: number;
  url: string;
}

export interface VehicleData {
  make: string;
  model: string;
  year: number;
  /** Date the snapshot was taken, YYYY-MM-DD. */
  asOf: string;
  complaints: {
    total: number;
    crashes: number;
    fires: number;
    injuries: number;
    deaths: number;
    byComponent: { component: string; count: number }[];
    byFiledYear: { year: number; count: number }[];
  };
  recalls: VehicleRecall[];
  ratings: VehicleRating[];
  mpg: VehicleMpg[];
  sources: { complaints: string; recalls: string; ratings: string; nhtsaPage: string; epa: string };
}

const files = import.meta.glob<VehicleData>('./*.json', { eager: true, import: 'default' });

const slugPart = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const vehicleName = (v: Pick<VehicleData, 'make' | 'model' | 'year'>) => `${v.year} ${v.make} ${v.model}`;
export const vehiclePath = (v: Pick<VehicleData, 'make' | 'model' | 'year'>) =>
  `/cars/${slugPart(v.make)}/${slugPart(v.model)}/${v.year}`;
/** The CSV the prerender writes for each vehicle (scripts/prerender.mjs). */
export const vehicleCsvPath = (v: Pick<VehicleData, 'make' | 'model' | 'year'>) =>
  `/data/cars/${slugPart(v.make)}-${slugPart(v.model)}-${v.year}.csv`;

export const VEHICLES: VehicleData[] = Object.values(files)
  .filter((v) => v && typeof v === 'object' && 'complaints' in v)
  .filter((v) => v.complaints.total >= 25 || v.recalls.length >= 1)
  .sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || b.year - a.year);

export const findVehicle = (make: string, model: string, year: string | number) =>
  VEHICLES.find((v) => slugPart(v.make) === slugPart(make) && slugPart(v.model) === slugPart(model) && String(v.year) === String(year));

/** Other published years of the same make and model, newest first. */
export const otherYears = (v: VehicleData) => VEHICLES.filter((o) => o.make === v.make && o.model === v.model && o.year !== v.year);

// Plain-English names for NHTSA's component categories.
const COMPONENT_NAMES: Record<string, string> = {
  ENGINE: 'Engine',
  'ENGINE AND ENGINE COOLING': 'Engine and cooling',
  'POWER TRAIN': 'Transmission and drivetrain',
  'ELECTRICAL SYSTEM': 'Electrical system',
  'UNKNOWN OR OTHER': 'Unknown or other',
  'FUEL/PROPULSION SYSTEM': 'Fuel and propulsion',
  'FUEL SYSTEM, GASOLINE': 'Fuel system (gasoline)',
  'SERVICE BRAKES': 'Brakes',
  'SERVICE BRAKES, HYDRAULIC': 'Brakes (hydraulic)',
  STEERING: 'Steering',
  'VEHICLE SPEED CONTROL': 'Speed control',
  WHEELS: 'Wheels',
  STRUCTURE: 'Body structure',
  'EXTERIOR LIGHTING': 'Exterior lighting',
  'AIR BAGS': 'Air bags',
  'SEAT BELTS': 'Seat belts',
  SUSPENSION: 'Suspension',
  'VISIBILITY/WIPER': 'Visibility and wipers',
  VISIBILITY: 'Visibility',
  'FORWARD COLLISION AVOIDANCE': 'Forward collision avoidance',
  'BACK OVER PREVENTION': 'Backover prevention',
  'LANE DEPARTURE': 'Lane departure',
  'ELECTRONIC STABILITY CONTROL (ESC)': 'Stability control',
  SEATS: 'Seats',
  LATCHES: 'Latches',
  'LATCHES/LOCKS/LINKAGES': 'Latches, locks and linkages',
  TIRES: 'Tires',
  EQUIPMENT: 'Equipment',
  'PARKING BRAKE': 'Parking brake',
  'HYBRID PROPULSION SYSTEM': 'Hybrid system',
};
export const componentName = (c: string) =>
  COMPONENT_NAMES[c] ?? c.charAt(0) + c.slice(1).toLowerCase();

/** Code guides that cover a complaint area, when one exists. */
export const COMPONENT_CODE_GUIDES: Record<string, string[]> = {
  ENGINE: ['P0300', 'P0128'],
  'ENGINE AND ENGINE COOLING': ['P0128', 'P0300'],
  'FUEL/PROPULSION SYSTEM': ['P0171', 'P0455'],
  'FUEL SYSTEM, GASOLINE': ['P0455', 'P0442', 'P0171'],
};

/** EPA versions with identical figures (same engine, drive and MPG) shown once. */
export const uniqueMpg = (rows: VehicleMpg[]) => {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = [r.engine, r.drive, r.fuel, r.city, r.highway, r.combined].join('|');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export const num = (n: number) => n.toLocaleString('en-US');

/** Search result title, 47 characters or fewer for the usual make and model names (the site name is added). */
export const vehicleSeoTitle = (v: VehicleData) => `${vehicleName(v)} Problems, Recalls and Ratings`;

export function vehicleDescription(v: VehicleData) {
  const top = v.complaints.byComponent.find((c) => c.component !== 'UNKNOWN OR OTHER');
  return (
    `${vehicleName(v)}: ${num(v.complaints.total)} owner complaints to NHTSA` +
    (top ? `, most about the ${componentName(top.component).toLowerCase()}` : '') +
    `; ${v.recalls.length} recall${v.recalls.length === 1 ? '' : 's'}, crash ratings and EPA MPG.`
  );
}

/** The downloadable CSV: one row per figure, so it opens cleanly in any spreadsheet. */
export function vehicleCsv(v: VehicleData) {
  const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const rows: (string | number)[][] = [['section', 'item', 'value', 'source', 'data_as_of']];
  const add = (section: string, item: string | number, value: string | number, source: string) => rows.push([section, item, value, source, v.asOf]);
  add('complaints', 'total', v.complaints.total, v.sources.complaints);
  add('complaints', 'reported_crashes', v.complaints.crashes, v.sources.complaints);
  add('complaints', 'reported_fires', v.complaints.fires, v.sources.complaints);
  add('complaints', 'reported_injuries', v.complaints.injuries, v.sources.complaints);
  add('complaints', 'reported_deaths', v.complaints.deaths, v.sources.complaints);
  for (const c of v.complaints.byComponent) add('complaints_by_component', c.component, c.count, v.sources.complaints);
  for (const y of v.complaints.byFiledYear) add('complaints_by_year_filed', y.year, y.count, v.sources.complaints);
  for (const r of v.recalls) add('recalls', r.campaign, `${r.date ?? ''} ${r.component}`.trim(), v.sources.recalls);
  for (const r of v.ratings) {
    add('crash_rating_overall', r.vehicle, r.overall, v.sources.nhtsaPage);
    add('crash_rating_frontal', r.vehicle, r.frontal, v.sources.nhtsaPage);
    add('crash_rating_side', r.vehicle, r.side, v.sources.nhtsaPage);
    add('crash_rating_rollover', r.vehicle, r.rollover, v.sources.nhtsaPage);
  }
  for (const m of uniqueMpg(v.mpg)) {
    const item = `${m.engine}, ${m.drive}`;
    add('epa_mpg_city', item, m.city, v.sources.epa);
    add('epa_mpg_highway', item, m.highway, v.sources.epa);
    add('epa_mpg_combined', item, m.combined, v.sources.epa);
  }
  return `${rows.map((r) => r.map(q).join(',')).join('\n')}\n`;
}
