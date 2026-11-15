// Car insurance estimate: a transparent multiplicative model calibrated to
// typical 2026 US premiums. Every factor is shown on the page, so visitors can
// see why their price is what it is and what would lower it.

export interface StateInfo {
  code: string;
  name: string;
  /** Average full-coverage premium relative to the US average (1 = average). */
  index: number;
}

// Approximate state averages relative to the national average, from published
// 2025 full-coverage premium surveys.
export const STATES: StateInfo[] = [
  ['AL', 'Alabama', 0.92], ['AK', 'Alaska', 0.85], ['AZ', 'Arizona', 1.05], ['AR', 'Arkansas', 0.98], ['CA', 'California', 1.15],
  ['CO', 'Colorado', 1.18], ['CT', 'Connecticut', 1.05], ['DE', 'Delaware', 1.12], ['DC', 'District of Columbia', 1.15], ['FL', 'Florida', 1.45],
  ['GA', 'Georgia', 1.12], ['HI', 'Hawaii', 0.72], ['ID', 'Idaho', 0.68], ['IL', 'Illinois', 0.95], ['IN', 'Indiana', 0.72],
  ['IA', 'Iowa', 0.75], ['KS', 'Kansas', 0.95], ['KY', 'Kentucky', 1.15], ['LA', 'Louisiana', 1.5], ['ME', 'Maine', 0.62],
  ['MD', 'Maryland', 1.15], ['MA', 'Massachusetts', 0.9], ['MI', 'Michigan', 1.3], ['MN', 'Minnesota', 0.98], ['MS', 'Mississippi', 0.98],
  ['MO', 'Missouri', 1.02], ['MT', 'Montana', 1.0], ['NE', 'Nebraska', 0.98], ['NV', 'Nevada', 1.32], ['NH', 'New Hampshire', 0.68],
  ['NJ', 'New Jersey', 1.2], ['NM', 'New Mexico', 0.92], ['NY', 'New York', 1.4], ['NC', 'North Carolina', 0.82], ['ND', 'North Dakota', 0.85],
  ['OH', 'Ohio', 0.72], ['OK', 'Oklahoma', 1.02], ['OR', 'Oregon', 0.9], ['PA', 'Pennsylvania', 1.0], ['RI', 'Rhode Island', 1.12],
  ['SC', 'South Carolina', 1.05], ['SD', 'South Dakota', 0.95], ['TN', 'Tennessee', 0.85], ['TX', 'Texas', 1.15], ['UT', 'Utah', 0.95],
  ['VT', 'Vermont', 0.65], ['VA', 'Virginia', 0.85], ['WA', 'Washington', 0.98], ['WV', 'West Virginia', 0.9], ['WI', 'Wisconsin', 0.72],
  ['WY', 'Wyoming', 0.75],
].map(([code, name, index]) => ({ code: code as string, name: name as string, index: index as number }));

/** States where insurers may not use credit to price car insurance (Michigan limits it heavily). */
export const NO_CREDIT_STATES = ['CA', 'HI', 'MA', 'MI'];

/** Typical monthly premium: a 35-year-old, clean record, good credit, 12,000 miles, average car, full coverage, $1,000 deductible. */
export const NATIONAL_BASE = 210;

type Option<T extends string> = { id: T; label: string; factor: number };
const opts = <T extends string>(list: [T, string, number][]): Option<T>[] => list.map(([id, label, factor]) => ({ id, label, factor }));

export const AGES = opts([
  ['16-19', '16 to 19', 2.9],
  ['20-24', '20 to 24', 1.6],
  ['25-29', '25 to 29', 1.15],
  ['30-64', '30 to 64', 1],
  ['65-74', '65 to 74', 1.05],
  ['75+', '75 or older', 1.25],
]);
export const RECORDS = opts([
  ['clean', 'Clean record', 1],
  ['ticket', 'One speeding ticket', 1.25],
  ['tickets', 'Two or more tickets', 1.55],
  ['accident', 'An at-fault accident', 1.45],
  ['dui', 'A DUI', 1.9],
]);
export const CREDITS = opts([
  ['excellent', 'Excellent (740+)', 0.8],
  ['good', 'Good (670 to 739)', 1],
  ['fair', 'Fair (580 to 669)', 1.25],
  ['poor', 'Poor (under 580)', 1.75],
]);
export const MILES = opts([
  ['low', 'Under 7,500 miles a year', 0.92],
  ['average', '7,500 to 15,000', 1],
  ['high', '15,000 to 20,000', 1.06],
  ['veryHigh', 'Over 20,000', 1.12],
]);
export const COVERAGES = opts([
  ['minimum', 'State minimum liability', 0.3],
  ['liability', 'Liability only, 100/300/100', 0.45],
  ['full', 'Full coverage', 1],
  ['fullPlus', 'Full coverage with higher limits and extras', 1.25],
]);
export const DEDUCTIBLES = opts([
  ['250', '$250', 1.12],
  ['500', '$500', 1.06],
  ['1000', '$1,000', 1],
  ['2000', '$2,000', 0.9],
]);
/** How costly the car is to insure (from the AI vehicle check). */
export const VEHICLE_CLASSES = opts([
  ['low', 'Cheap to insure', 0.88],
  ['average', 'Average to insure', 1],
  ['high', 'Costly to insure', 1.2],
  ['veryHigh', 'Very costly to insure', 1.45],
]);

export type AgeId = (typeof AGES)[number]['id'];
export type RecordId = (typeof RECORDS)[number]['id'];
export type CreditId = (typeof CREDITS)[number]['id'];
export type MilesId = (typeof MILES)[number]['id'];
export type CoverageId = (typeof COVERAGES)[number]['id'];
export type DeductibleId = (typeof DEDUCTIBLES)[number]['id'];
export type VehicleClassId = (typeof VEHICLE_CLASSES)[number]['id'];

export interface Profile {
  state: string;
  age: AgeId;
  record: RecordId;
  credit: CreditId;
  miles: MilesId;
  coverage: CoverageId;
  deductible: DeductibleId;
  /** Model year, for the age-of-car factor. Empty when unknown. */
  year: string;
  vehicleClass: VehicleClassId;
  bundle: boolean;
  goodStudent: boolean;
  telematics: boolean;
}

export interface Factor {
  label: string;
  value: string;
  factor: number;
}

const find = <T extends { id: string }>(list: T[], id: string) => list.find((o) => o.id === id)!;
const isFull = (c: CoverageId) => c === 'full' || c === 'fullPlus';

/** Older cars cost less to cover for damage (only matters with full coverage). */
function carAgeFactor(year: string): number {
  const age = new Date().getFullYear() - Number(year);
  if (!year || !Number.isFinite(age)) return 1;
  if (age <= 3) return 1.05;
  if (age <= 8) return 1;
  if (age <= 14) return 0.88;
  return 0.78;
}

export function estimate(p: Profile) {
  const state = STATES.find((s) => s.code === p.state);
  const creditBanned = NO_CREDIT_STATES.includes(p.state);
  const factors: Factor[] = [];
  const add = (label: string, value: string, factor: number) => factors.push({ label, value, factor });

  add('State', state ? state.name : 'US average', state?.index ?? 1);
  add('Age', find(AGES, p.age).label, find(AGES, p.age).factor);
  add('Driving record', find(RECORDS, p.record).label, find(RECORDS, p.record).factor);
  add('Credit', creditBanned ? 'Not used in this state' : find(CREDITS, p.credit).label, creditBanned ? 1 : find(CREDITS, p.credit).factor);
  add('Miles a year', find(MILES, p.miles).label, find(MILES, p.miles).factor);
  add('Car', find(VEHICLE_CLASSES, p.vehicleClass).label, find(VEHICLE_CLASSES, p.vehicleClass).factor);
  add('Coverage', find(COVERAGES, p.coverage).label, find(COVERAGES, p.coverage).factor);
  if (isFull(p.coverage)) {
    add('Deductible', find(DEDUCTIBLES, p.deductible).label, find(DEDUCTIBLES, p.deductible).factor);
    if (p.year) add('Age of car', `${p.year} model`, carAgeFactor(p.year));
  }
  if (p.bundle) add('Discount', 'Home or renters bundle', 0.9);
  if (p.goodStudent && (p.age === '16-19' || p.age === '20-24')) add('Discount', 'Good student', 0.9);
  if (p.telematics) add('Discount', 'Safe-driving app or plug-in', 0.88);

  const monthly = factors.reduce((m, f) => m * f.factor, NATIONAL_BASE);
  return {
    monthly,
    low: Math.round(monthly * 0.82),
    high: Math.round(monthly * 1.18),
    yearly: Math.round(monthly * 12),
    factors,
    vsAverage: monthly / NATIONAL_BASE,
  };
}

export interface Saving {
  label: string;
  detail: string;
  monthly: number;
}

/** What-if changes the visitor controls, each with its monthly saving. */
export function savings(p: Profile): Saving[] {
  const now = estimate(p).monthly;
  const list: { label: string; detail: string; change: Partial<Profile>; when: boolean }[] = [
    {
      label: 'Raise your deductible to $1,000',
      detail: 'Only worth it if you could pay $1,000 out of pocket after a crash.',
      change: { deductible: '1000' },
      when: isFull(p.coverage) && (p.deductible === '250' || p.deductible === '500'),
    },
    {
      label: 'Bundle with home or renters insurance',
      detail: 'Most large insurers take 5 to 15% off for two policies.',
      change: { bundle: true },
      when: !p.bundle,
    },
    {
      label: 'Try a safe-driving program',
      detail: 'An app or plug-in that tracks braking, speed and phone use. Careful drivers often save 10 to 30%.',
      change: { telematics: true },
      when: !p.telematics,
    },
    {
      label: 'Good student discount',
      detail: 'Usually for full-time students under 25 with a B average or better.',
      change: { goodStudent: true },
      when: !p.goodStudent && (p.age === '16-19' || p.age === '20-24'),
    },
    {
      label: 'Drop collision and comprehensive',
      detail: 'Consider it once the car is worth less than about 10 times the yearly cost of that coverage.',
      change: { coverage: 'liability' },
      when: isFull(p.coverage) && !!p.year && new Date().getFullYear() - Number(p.year) >= 10,
    },
    {
      label: 'Improve your credit one step',
      detail: 'Insurers re-price at renewal. Paying bills on time and lowering card balances helps.',
      change: { credit: p.credit === 'poor' ? 'fair' : p.credit === 'fair' ? 'good' : 'excellent' },
      when: !NO_CREDIT_STATES.includes(p.state) && p.credit !== 'excellent',
    },
  ];
  return list
    .filter((s) => s.when)
    .map((s) => ({ label: s.label, detail: s.detail, monthly: Math.round(now - estimate({ ...p, ...s.change }).monthly) }))
    .filter((s) => s.monthly >= 1)
    .sort((a, b) => b.monthly - a.monthly);
}
