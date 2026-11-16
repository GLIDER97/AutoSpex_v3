// Check engine code diagnosis: parses codes, asks the AI (through /api/ai)
// for a structured answer and checks every number before it reaches the page.
// The prompt and answer schema are built on the server (api/_aiTools.ts, "diagnose").
import { runTool } from './ai';
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

export async function diagnose(codes: string[], vehicle: string): Promise<Diagnosis> {
  const response = await runTool('diagnose', { codes, vehicle });
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
