// Shared access to NHTSA's public API (api.nhtsa.gov): free, no key, and it
// accepts requests from the browser. Recalls, complaints and crash ratings
// all key on NHTSA's exact make/model names, which this module resolves.
import { matchMake, matchNames } from './vehicleNames';

export const NHTSA_API = 'https://api.nhtsa.gov';

/** Fetches a list endpoint; NHTSA answers 400 with an empty list for names it does not know. */
export async function nhtsaResults<T>(path: string, key: 'results' | 'Results' = 'results'): Promise<T[]> {
  const res = await fetch(`${NHTSA_API}${path}`);
  if (!res.ok && res.status !== 400) throw new Error(`NHTSA request failed (HTTP ${res.status})`);
  const body = await res.json().catch(() => null);
  const list = body?.[key];
  return Array.isArray(list) ? list : [];
}

export interface ResolvedVehicle {
  /** NHTSA's name for the make, or null if NHTSA has no records for it that year. */
  make: string | null;
  /** NHTSA model names that match what the user typed ("civic" -> CIVIC, CIVIC SI ...). */
  models: string[];
}

/**
 * Turns a typed year/make/model into NHTSA's names, using NHTSA's own lists
 * of vehicles that have recalls ('r') or complaints ('c') for that year.
 */
export async function resolveVehicle(
  year: number,
  make: string,
  model: string,
  issueType: 'r' | 'c',
  maxModels = 6,
): Promise<ResolvedVehicle> {
  // These lists are paged; `max` returns them in full.
  const makes = await nhtsaResults<{ make: string }>(
    `/products/vehicle/makes?modelYear=${year}&issueType=${issueType}&max=5000`,
  );
  const nhtsaMake = matchMake(make, makes.map((m) => m.make));
  if (!nhtsaMake) return { make: null, models: [] };
  const q = new URLSearchParams({ modelYear: String(year), make: nhtsaMake, issueType, max: '5000' });
  const models = await nhtsaResults<{ model: string }>(`/products/vehicle/models?${q}`);
  return { make: nhtsaMake, models: matchNames(model, models.map((m) => m.model), maxModels) };
}

/** NHTSA dates come as DD/MM/YYYY (recalls) or MM/DD/YYYY (complaints); returns YYYY-MM-DD. */
export function nhtsaDate(value: string | undefined, order: 'dmy' | 'mdy'): string {
  const parts = (value ?? '').split('/');
  if (parts.length !== 3) return '';
  const [a, b, year] = parts;
  const [month, day] = order === 'dmy' ? [b, a] : [a, b];
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Friendlier names for NHTSA's component categories.
const COMPONENT_NAMES: Record<string, string> = {
  'POWER TRAIN': 'Transmission and drivetrain',
  'FUEL/PROPULSION SYSTEM': 'Fuel and propulsion',
  'ENGINE AND ENGINE COOLING': 'Engine and cooling',
  'UNKNOWN OR OTHER': 'Other or unknown',
  'ELECTRONIC STABILITY CONTROL (ESC)': 'Stability control',
  'VISIBILITY/WIPER': 'Visibility and wipers',
  'LATCHES/LOCKS/LINKAGES': 'Latches and locks',
  'VEHICLE SPEED CONTROL': 'Speed control and throttle',
  'FORWARD COLLISION AVOIDANCE': 'Forward collision avoidance',
};

export function componentName(component: string): string {
  const top = component.split(':')[0].trim();
  if (COMPONENT_NAMES[top]) return COMPONENT_NAMES[top];
  const lower = top.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Splits a complaint's component list. Names can contain commas themselves
 * ("FUEL SYSTEM, GASOLINE"), and child-seat entries add mixed-case sub-items.
 */
export function splitComponents(components: string): string[] {
  return String(components ?? '')
    .replace(/,\s*(GASOLINE|DIESEL|HYDRAULIC|ELECTRIC|AIR|OTHER)\b/g, '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c && c === c.toUpperCase());
}

/**
 * The NHTSA component categories an OBD-II code points at, used to pick out
 * related owner complaints and recalls. Based on the SAE J2012 code groups.
 */
export function componentsForCode(code: string): string[] {
  const c = code.toUpperCase();
  const engine = ['ENGINE', 'ENGINE AND ENGINE COOLING'];
  const fuel = ['FUEL/PROPULSION SYSTEM', 'FUEL SYSTEM'];
  if (c.startsWith('B')) return ['AIR BAGS', 'ELECTRICAL SYSTEM', 'SEAT BELTS'];
  if (c.startsWith('C')) return ['SERVICE BRAKES', 'STEERING', 'SUSPENSION', 'ELECTRONIC STABILITY CONTROL (ESC)', 'WHEELS', 'TIRES'];
  if (c.startsWith('U')) return ['ELECTRICAL SYSTEM'];
  const group = c.slice(1, 3); // e.g. "03" for P03xx
  if (c[1] !== '0' && c[1] !== '2') return [...engine, ...fuel, 'POWER TRAIN', 'ELECTRICAL SYSTEM']; // maker-specific
  if (group === '0A' || group === '2A') return ['ELECTRICAL SYSTEM', 'POWER TRAIN', ...fuel];
  const n = Number.parseInt(c[2], 16);
  if (c[1] === '2' && n <= 2) return [...fuel, ...engine];
  if (n <= 2) return [...fuel, ...engine];
  if (n === 3) return [...engine, ...fuel];
  if (n === 4) return [...engine, ...fuel];
  if (n === 5) return [...engine, 'VEHICLE SPEED CONTROL', 'ELECTRICAL SYSTEM'];
  if (n === 6) return ['ELECTRICAL SYSTEM', ...engine];
  if (n >= 7 && n <= 9) return ['POWER TRAIN'];
  return [...engine, ...fuel];
}

/** "AIR BAGS:SENSOR:FRONT PASSENGER" -> "Air bags › Sensor › Front passenger". */
export function formatComponent(component: string): string {
  return component
    .split(':')
    .map((part) => {
      const lower = part.trim().toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' › ');
}

/** True if a recall/complaint component belongs to one of the given categories. */
export function matchesComponents(component: string, categories: string[]): boolean {
  const upper = component.toUpperCase();
  return categories.some((cat) => upper === cat || upper.startsWith(`${cat}:`) || upper.startsWith(`${cat},`));
}
