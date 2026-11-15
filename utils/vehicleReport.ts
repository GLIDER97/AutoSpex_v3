// VIN decoding (NHTSA vPIC) and NHTSA 5-Star crash ratings. Both are free,
// need no key and accept requests from the browser.
import { NHTSA_API } from './nhtsa';
import { matchNames } from './vehicleNames';

// ---------------------------------------------------------------------------
// VIN validation (ISO 3779 / 49 CFR 565 check digit)
// ---------------------------------------------------------------------------

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5,
  P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export type VinProblem = null | 'length' | 'characters' | 'check-digit';

/** Checks a VIN's length, characters and 9th-position check digit. */
export function checkVin(raw: string): { vin: string; problem: VinProblem } {
  const vin = raw.replace(/[\s-]/g, '').toUpperCase();
  if (vin.length !== 17) return { vin, problem: 'length' };
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return { vin, problem: 'characters' };
  const sum = [...vin].reduce((total, ch, i) => total + (/\d/.test(ch) ? Number(ch) : TRANSLITERATION[ch]) * WEIGHTS[i], 0);
  const remainder = sum % 11;
  const expected = remainder === 10 ? 'X' : String(remainder);
  return { vin, problem: vin[8] === expected ? null : 'check-digit' };
}

// ---------------------------------------------------------------------------
// vPIC decode
// ---------------------------------------------------------------------------

/** Every non-empty field vPIC returns, keyed by its vPIC name (Make, ModelYear, EngineHP ...). */
export type VinFields = Record<string, string>;

export interface DecodedVin {
  fields: VinFields;
  /** vPIC's own warnings (e.g. "check digit does not calculate properly"). */
  warnings: string[];
}

export async function decodeVin(vin: string): Promise<DecodedVin> {
  const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`);
  if (!res.ok) throw new Error(`vPIC request failed (HTTP ${res.status})`);
  const row = (await res.json())?.Results?.[0] ?? {};
  const fields: VinFields = {};
  for (const [key, value] of Object.entries(row)) {
    const text = String(value ?? '').trim();
    if (text && text !== 'Not Applicable' && text !== '0' && key !== 'ErrorCode' && key !== 'ErrorText') fields[key] = text;
  }
  const codes = String(row.ErrorCode ?? '0').split(',').map((c) => c.trim());
  const warnings = codes[0] === '0' ? [] : String(row.ErrorText ?? '').split(/;\s*/).filter(Boolean);
  return { fields, warnings };
}

// ---------------------------------------------------------------------------
// NHTSA 5-Star Safety Ratings (NCAP)
// ---------------------------------------------------------------------------

export interface CrashRating {
  description: string;
  overall: string;
  frontal: string;
  side: string;
  rollover: string;
  rolloverRisk: number | null;
  complaintsCount: number | null;
  recallsCount: number | null;
  investigationCount: number | null;
  frontCrashPicture?: string;
}

async function ncap<T>(path: string): Promise<T[]> {
  const res = await fetch(`${NHTSA_API}/SafetyRatings${path}`);
  if (!res.ok) return [];
  const body = await res.json().catch(() => null);
  return Array.isArray(body?.Results) ? body.Results : [];
}

/** Crash ratings for each tested version of a year/make/model ("4 DR FWD", "2 DR FWD" ...). */
export async function getCrashRatings(year: number, make: string, model: string): Promise<CrashRating[]> {
  const models = await ncap<{ Model: string }>(`/modelyear/${year}/make/${encodeURIComponent(make)}`);
  const [ncapModel] = matchNames(model, models.map((m) => m.Model), 1);
  if (!ncapModel) return [];
  const variants = await ncap<{ VehicleId: number; VehicleDescription: string }>(
    `/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(ncapModel)}`,
  );
  const rated = await Promise.all(
    variants.slice(0, 6).map(async (v) => {
      const [r] = await ncap<Record<string, unknown>>(`/VehicleId/${v.VehicleId}`);
      if (!r) return null as CrashRating | null;
      const num = (x: unknown) => (typeof x === 'number' ? x : x == null || x === '' ? null : Number(x));
      return {
        description: v.VehicleDescription,
        overall: String(r.OverallRating ?? 'Not Rated'),
        frontal: String(r.OverallFrontCrashRating ?? 'Not Rated'),
        side: String(r.OverallSideCrashRating ?? 'Not Rated'),
        rollover: String(r.RolloverRating ?? 'Not Rated'),
        rolloverRisk: num(r.RolloverPossibility),
        complaintsCount: num(r.ComplaintsCount),
        recallsCount: num(r.RecallsCount),
        investigationCount: num(r.InvestigationCount),
        frontCrashPicture: typeof r.FrontCrashPicture === 'string' ? r.FrontCrashPicture : undefined,
      } as CrashRating;
    }),
  );
  return rated.filter((r): r is CrashRating => r !== null);
}
