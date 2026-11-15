// Resale value: what a car is worth now and how fast it is losing value.
// The AI supplies what only model knowledge can (original price, how well this
// model holds value, why); every number after that is calculated here.
import { generateContent, Type } from './ai';

export type Retention = 'Strong' | 'Above average' | 'Average' | 'Below average' | 'Weak';
export const RETENTIONS: Retention[] = ['Strong', 'Above average', 'Average', 'Below average', 'Weak'];
export type Condition = 'excellent' | 'good' | 'fair' | 'poor';

export const CONDITIONS: { id: Condition; label: string; detail: string; factor: number }[] = [
  { id: 'excellent', label: 'Excellent', detail: 'Looks nearly new, no mechanical issues, full service records', factor: 1.06 },
  { id: 'good', label: 'Good', detail: 'Minor wear, everything works', factor: 1 },
  { id: 'fair', label: 'Fair', detail: 'Visible wear or dents, needs some repairs', factor: 0.88 },
  { id: 'poor', label: 'Poor', detail: 'Major damage, warning lights or big repairs due', factor: 0.72 },
];

/** Share of the original price an average car keeps at 0-5 years old. */
const AVERAGE_CURVE = [1, 0.8, 0.7, 0.62, 0.55, 0.49];
/** Multiplier on the loss (1 - kept) by how well the model holds value. */
const LOSS_FACTOR: Record<Retention, number> = { Strong: 0.7, 'Above average': 0.85, Average: 1, 'Below average': 1.15, Weak: 1.3 };

export const MILES_PER_YEAR = 12000;

/** Share of the original price kept at a (fractional) age, for this retention class. */
export function keptShare(age: number, retention: Retention): number {
  const a = Math.max(0, age);
  let average: number;
  if (a <= 5) {
    const i = Math.floor(a);
    average = i >= 5 ? AVERAGE_CURVE[5] : AVERAGE_CURVE[i] + (AVERAGE_CURVE[i + 1] - AVERAGE_CURVE[i]) * (a - i);
  } else {
    average = AVERAGE_CURVE[5] * Math.pow(0.92, a - 5);
  }
  return Math.max(0.06, 1 - (1 - average) * LOSS_FACTOR[retention]);
}

/** Value change for miles above or below average for the car's age. */
export function mileageFactor(miles: number, age: number): number {
  const expected = MILES_PER_YEAR * Math.max(age, 0.5);
  const diffK = (miles - expected) / 1000;
  return diffK > 0 ? Math.max(0.8, 1 - 0.006 * diffK) : Math.min(1.12, 1 - 0.005 * diffK);
}

export interface ModelFacts {
  msrp: number;
  retention: Retention;
  segment: string;
  reasons: string[];
  watchOut: string;
}

export async function modelFacts(vehicle: string, trim: string): Promise<ModelFacts> {
  const res = await generateContent({
    model: 'text',
    contents: `You are a US used-car market analyst. For the ${vehicle}${trim ? ` ${trim}` : ''}:
- msrp: its original US MSRP in USD when new (for this trim if given, otherwise the most common trim), as a number.
- retention: how well this model holds its value compared with the average US car of the same age.
- segment: a short vehicle class, e.g. "Compact SUV" or "Full-size pickup".
- reasons: 2 to 4 short reasons for that retention (reliability reputation, demand, incentives on new ones, EV battery worries, and so on).
- watchOut: one well-known issue with this model year that hurts resale value, or an empty string if none.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          msrp: { type: Type.NUMBER },
          retention: { type: Type.STRING, enum: RETENTIONS },
          segment: { type: Type.STRING },
          reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
          watchOut: { type: Type.STRING },
        },
        required: ['msrp', 'retention', 'segment', 'reasons', 'watchOut'],
      },
    },
  });
  const raw = JSON.parse(res.text ?? '{}');
  const msrp = Number(raw.msrp);
  if (!Number.isFinite(msrp) || msrp < 8000 || msrp > 500000) throw new Error('No original price found for this car.');
  const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
  return {
    msrp: Math.round(msrp),
    retention: RETENTIONS.includes(raw.retention) ? raw.retention : 'Average',
    segment: text(raw.segment, 40),
    reasons: (Array.isArray(raw.reasons) ? raw.reasons : []).map((r: unknown) => text(r, 160)).filter(Boolean).slice(0, 4),
    watchOut: text(raw.watchOut, 220),
  };
}

export interface ValueInput {
  modelYear: number;
  msrp: number;
  retention: Retention;
  miles: number;
  milesPerYear: number;
  condition: Condition;
  /** Today's date, for the car's age (passed in for testability). */
  now?: Date;
}

export interface ValuePoint {
  label: string;
  age: number;
  miles: number;
  privateParty: number;
}

export function valueReport(input: ValueInput) {
  const now = input.now ?? new Date();
  // A model year sells from about October of the year before to September, so
  // count from the middle of that window (about April of the model year).
  const age = Math.max(0, now.getFullYear() - input.modelYear + (now.getMonth() - 3) / 12);
  const condition = CONDITIONS.find((c) => c.id === input.condition)!.factor;
  const valueAt = (a: number, m: number) => input.msrp * keptShare(a, input.retention) * mileageFactor(m, a) * condition;

  const privateParty = valueAt(age, input.miles);
  const points: ValuePoint[] = Array.from({ length: 6 }, (_, i) => ({
    label: i === 0 ? 'Now' : `In ${i} ${i === 1 ? 'year' : 'years'}`,
    age: age + i,
    miles: input.miles + input.milesPerYear * i,
    privateParty: valueAt(age + i, input.miles + input.milesPerYear * i),
  }));
  const nextYearLoss = privateParty - points[1].privateParty;
  const yearlyLosses = points.slice(1).map((p, i) => points[i].privateParty - p.privateParty);
  const milesTo100k = 100000 - input.miles;

  return {
    age,
    privateParty,
    tradeIn: privateParty * 0.85,
    dealerRetail: privateParty * 1.13,
    keptOfMsrp: privateParty / input.msrp,
    nextYearLoss,
    perDay: nextYearLoss / 365,
    perMonth: nextYearLoss / 12,
    points,
    yearlyLosses,
    /** Years until it passes 100,000 miles, if that happens within 5 years. */
    yearsTo100k: milesTo100k > 0 && input.milesPerYear > 0 && milesTo100k / input.milesPerYear <= 5 ? milesTo100k / input.milesPerYear : null,
  };
}
