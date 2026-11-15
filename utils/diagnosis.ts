// Check engine code diagnosis: parses codes, asks Gemini (through /api/gemini)
// for a structured answer and checks every number before it reaches the page.
import { generateContent, Type } from './gemini';
import type { OBDCodeData } from '../types';

/** P, B, C or U followed by four hex characters (SAE J2012 format). */
export const CODE_PATTERN = /^[PCBU][0-9A-F]{4}$/;
export const MAX_CODES = 5;

/** Splits "p0171, P0174 p0300" into ["P0171", "P0174", "P0300"]; reports anything that is not a code. */
export function parseCodes(input: string): { codes: string[]; invalid: string[] } {
  const tokens = input.toUpperCase().split(/[\s,;/]+/).filter(Boolean);
  const codes: string[] = [];
  const invalid: string[] = [];
  for (const raw of tokens) {
    const t = raw.replace(/[^0-9A-Z]/g, '');
    if (CODE_PATTERN.test(t)) {
      if (!codes.includes(t)) codes.push(t);
    } else invalid.push(raw);
  }
  return { codes: codes.slice(0, MAX_CODES), invalid };
}

export type DriveVerdict = 'Safe to drive' | 'Drive with caution' | 'Stop driving';
export type Likelihood = 'Most likely' | 'Likely' | 'Possible' | 'Less likely';
export type DiyLevel = 'Easy DIY' | 'Moderate DIY' | 'Shop job';

export interface CodeExplanation {
  code: string;
  title: string;
  system: string;
  meaning: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  drive: DriveVerdict;
  driveAdvice: string;
  symptoms: string[];
}

export interface Cause {
  cause: string;
  likelihood: Likelihood;
  howToConfirm: string;
  fix: string;
  diy: DiyLevel;
  partsLow: number;
  partsHigh: number;
  laborHoursLow: number;
  laborHoursHigh: number;
}

export interface Diagnosis {
  codes: CodeExplanation[];
  /** How several codes relate (empty for a single code). */
  combined: string;
  causes: Cause[];
  quickChecks: string[];
  watchOut: string;
}

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
const DRIVE: DriveVerdict[] = ['Safe to drive', 'Drive with caution', 'Stop driving'];
const LIKELIHOOD: Likelihood[] = ['Most likely', 'Likely', 'Possible', 'Less likely'];
const DIY: DiyLevel[] = ['Easy DIY', 'Moderate DIY', 'Shop job'];

const schema = {
  type: Type.OBJECT,
  properties: {
    codes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          title: { type: Type.STRING },
          system: { type: Type.STRING },
          meaning: { type: Type.STRING },
          severity: { type: Type.STRING, enum: [...SEVERITIES] },
          drive: { type: Type.STRING, enum: DRIVE },
          driveAdvice: { type: Type.STRING },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['code', 'title', 'system', 'meaning', 'severity', 'drive', 'driveAdvice', 'symptoms'],
      },
    },
    combined: { type: Type.STRING },
    causes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          cause: { type: Type.STRING },
          likelihood: { type: Type.STRING, enum: LIKELIHOOD },
          howToConfirm: { type: Type.STRING },
          fix: { type: Type.STRING },
          diy: { type: Type.STRING, enum: DIY },
          partsLow: { type: Type.NUMBER },
          partsHigh: { type: Type.NUMBER },
          laborHoursLow: { type: Type.NUMBER },
          laborHoursHigh: { type: Type.NUMBER },
        },
        required: ['cause', 'likelihood', 'howToConfirm', 'fix', 'diy', 'partsLow', 'partsHigh', 'laborHoursLow', 'laborHoursHigh'],
      },
    },
    quickChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
    watchOut: { type: Type.STRING },
  },
  required: ['codes', 'combined', 'causes', 'quickChecks', 'watchOut'],
};

const clamp = (n: unknown, min: number, max: number) => {
  const x = Number(n);
  return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : min;
};
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;
const text = (value: unknown, max = 600) => String(value ?? '').trim().slice(0, max);

/** Keeps only well-formed, plausible values from the model's answer. */
function sanitize(raw: any, codes: string[]): Diagnosis {
  const explanations: CodeExplanation[] = (Array.isArray(raw?.codes) ? raw.codes : [])
    .map((c: any) => ({
      code: text(c?.code, 8).toUpperCase(),
      title: text(c?.title, 160),
      system: text(c?.system, 80),
      meaning: text(c?.meaning, 700),
      severity: pick(c?.severity, SEVERITIES, 'Medium'),
      drive: pick(c?.drive, DRIVE, 'Drive with caution'),
      driveAdvice: text(c?.driveAdvice, 400),
      symptoms: (Array.isArray(c?.symptoms) ? c.symptoms : []).map((s: unknown) => text(s, 120)).filter(Boolean).slice(0, 6),
    }))
    .filter((c: CodeExplanation) => codes.includes(c.code) && c.title);

  const order = (l: Likelihood) => LIKELIHOOD.indexOf(l);
  const causes: Cause[] = (Array.isArray(raw?.causes) ? raw.causes : [])
    .map((c: any) => {
      const partsLow = clamp(c?.partsLow, 0, 15000);
      const partsHigh = Math.max(partsLow, clamp(c?.partsHigh, 0, 15000));
      const laborHoursLow = clamp(c?.laborHoursLow, 0, 40);
      const laborHoursHigh = Math.max(laborHoursLow, clamp(c?.laborHoursHigh, 0, 40));
      return {
        cause: text(c?.cause, 140),
        likelihood: pick(c?.likelihood, LIKELIHOOD, 'Possible'),
        howToConfirm: text(c?.howToConfirm, 400),
        fix: text(c?.fix, 300),
        diy: pick(c?.diy, DIY, 'Shop job'),
        partsLow,
        partsHigh,
        laborHoursLow,
        laborHoursHigh,
      };
    })
    .filter((c: Cause) => c.cause)
    .sort((a: Cause, b: Cause) => order(a.likelihood) - order(b.likelihood))
    .slice(0, 6);

  return {
    codes: explanations,
    combined: codes.length > 1 ? text(raw?.combined, 900) : '',
    causes,
    quickChecks: (Array.isArray(raw?.quickChecks) ? raw.quickChecks : []).map((s: unknown) => text(s, 200)).filter(Boolean).slice(0, 5),
    watchOut: text(raw?.watchOut, 400),
  };
}

export async function diagnose(
  codes: string[],
  vehicle: string,
  known: Record<string, OBDCodeData>,
): Promise<Diagnosis> {
  const reference = codes
    .filter((c) => known[c])
    .map((c) => `${c}: ${known[c].title}`)
    .join('\n');

  const prompt = `You are an ASE-certified master technician helping a US car owner understand check engine codes.

Codes read from the car: ${codes.join(', ')}
Vehicle: ${vehicle || 'not given (answer for a typical US passenger vehicle)'}
${reference ? `Standard definitions for reference:\n${reference}\n` : ''}
Answer in plain English for a non-mechanic.

For each code: the official title, the system it belongs to, what it means, severity, whether the car is safe to drive (Stop driving only for risks like flashing check engine light / severe misfire, overheating, oil pressure, brakes or fire risk), and short advice.
${codes.length > 1 ? 'Explain in "combined" how these codes relate and whether one root cause likely explains several of them.' : 'Leave "combined" empty.'}
Causes: the realistic causes for these codes on this vehicle, most likely first (consider well-known failure patterns for this vehicle if one is given). For each: how a shop or owner can confirm it, the fix, DIY difficulty, typical US aftermarket-to-OEM parts price range in USD, and typical labor hours from standard labor guides (book time).
quickChecks: free or cheap things to check before paying for repairs.
watchOut: the most common misdiagnosis or upsell for these codes.
Do not invent technical service bulletin or recall numbers.`;

  const response = await generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: schema },
  });
  if (!response.text) throw new Error('The AI returned no answer.');
  const result = sanitize(JSON.parse(response.text), codes);
  if (!result.codes.length) throw new Error('The AI answer could not be read.');
  return result;
}

/** Severity and drive advice from the built-in list, mapped to the diagnosis vocabulary. */
export function explanationFromBuiltIn(data: OBDCodeData): CodeExplanation {
  const drive: DriveVerdict =
    data.safetyStatus === 'Stop Immediately' ? 'Stop driving' : data.safetyStatus === 'Safe to Drive' ? 'Safe to drive' : 'Drive with caution';
  return {
    code: data.code,
    title: data.title,
    system: data.category,
    meaning: data.plainEnglish || data.description,
    severity: data.severity as CodeExplanation['severity'],
    drive,
    driveAdvice: '',
    symptoms: data.symptoms ?? [],
  };
}
