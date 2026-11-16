// Repair quote checking: reads a photo of an estimate into line items, then
// checks each line against typical US prices with the AI (via /api/ai, tools
// "quote-read" and "quote-audit"; the prompts are in api/_tools.ts).
// Arithmetic (totals, labor rate, shop-fee share) is done exactly, not by the AI.
import { cleanLine, cleanName, runAiTool } from './ai';
import { LINE_TYPES, QUOTE_LIMITS, quoteMath, type LineType, type QuoteLine, type ShopType } from '../api/_quote';

export { LINE_TYPES, quoteMath, type LineType, type QuoteLine };

export interface QuoteInput {
  vehicle: string;
  zip: string;
  shopType: ShopType;
  lines: QuoteLine[];
}

export type Verdict = 'Fair' | 'A bit high' | 'Too high' | 'Low';

export interface LineCheck {
  verdict: 'Fair' | 'High' | 'Too high' | 'Low' | 'Question it';
  fairLow: number;
  fairHigh: number;
  note: string;
}

export interface QuoteAudit {
  verdict: Verdict;
  headline: string;
  fairLow: number;
  fairHigh: number;
  lines: LineCheck[];
  canWait: { item: string; why: string }[];
  missing: string[];
  questions: string[];
  script: string;
}

const text = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);
const num = (v: unknown, max = 100000) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
};
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T) => (allowed.includes(v as T) ? (v as T) : fallback);

// ---------------------------------------------------------------------------
// Photo -> line items
// ---------------------------------------------------------------------------

/** Shrinks a phone photo to at most 1600 px and returns base64 JPEG (no data: prefix). */
export async function photoToJpegBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
}

export interface ExtractedQuote {
  vehicle: { year: string; make: string; model: string };
  shopName: string;
  zip: string;
  lines: QuoteLine[];
}

export async function readEstimatePhoto(base64Jpeg: string): Promise<ExtractedQuote> {
  const response = await runAiTool('quote-read', { photo: base64Jpeg });
  if (!response.data) throw new Error('The photo could not be read.');
  const raw = response.data;
  return {
    vehicle: {
      year: /^(19|20)\d\d$/.test(text(raw?.vehicle?.year, 4)) ? text(raw.vehicle.year, 4) : '',
      make: text(raw?.vehicle?.make, 40),
      model: text(raw?.vehicle?.model, 60),
    },
    shopName: text(raw?.shopName, 80),
    zip: /^\d{5}$/.test(text(raw?.zip, 5)) ? text(raw.zip, 5) : '',
    lines: (Array.isArray(raw?.lines) ? raw.lines : [])
      .map((l: any) => ({
        description: text(l?.description, 140),
        type: pick(l?.type, LINE_TYPES, 'Job'),
        quantity: num(l?.quantity, 1000) || 1,
        amount: num(l?.amount),
      }))
      .filter((l: QuoteLine) => l.description && l.amount > 0)
      .slice(0, 30),
  };
}

// ---------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------

const LINE_VERDICTS = ['Fair', 'High', 'Too high', 'Low', 'Question it'] as const;
const VERDICTS: Verdict[] = ['Fair', 'A bit high', 'Too high', 'Low'];

export async function auditQuote(input: QuoteInput): Promise<QuoteAudit> {
  // The server writes the prompt; lines are trimmed to what it accepts.
  const response = await runAiTool('quote-audit', {
    vehicle: cleanName(input.vehicle, 110) || undefined,
    zip: /^\d{5}$/.test(input.zip) ? input.zip : undefined,
    shopType: input.shopType,
    lines: input.lines.slice(0, QUOTE_LIMITS.lines).map((l) => ({
      description: cleanLine(l.description, QUOTE_LIMITS.description) || 'Item',
      type: l.type,
      quantity: Math.min(QUOTE_LIMITS.quantity, Math.max(0, l.quantity)),
      amount: Math.min(QUOTE_LIMITS.amount, Math.max(0, l.amount)),
    })),
  });
  if (!response.data) throw new Error('The check returned no answer.');
  const raw = response.data;

  const lineChecks: LineCheck[] = input.lines.map((_, i) => {
    const r = raw?.lines?.[i] ?? {};
    const fairLow = num(r.fairLow);
    return {
      verdict: pick(r.verdict, LINE_VERDICTS, 'Fair'),
      fairLow,
      fairHigh: Math.max(fairLow, num(r.fairHigh)),
      note: text(r.note, 300),
    };
  });
  const fairLow = num(raw?.fairLow);
  return {
    verdict: pick(raw?.verdict, VERDICTS, 'Fair'),
    headline: text(raw?.headline, 300),
    fairLow,
    fairHigh: Math.max(fairLow, num(raw?.fairHigh)),
    lines: lineChecks,
    canWait: (Array.isArray(raw?.canWait) ? raw.canWait : [])
      .map((c: any) => ({ item: text(c?.item, 120), why: text(c?.why, 300) }))
      .filter((c: { item: string }) => c.item)
      .slice(0, 5),
    missing: (Array.isArray(raw?.missing) ? raw.missing : []).map((m: unknown) => text(m, 160)).filter(Boolean).slice(0, 5),
    questions: (Array.isArray(raw?.questions) ? raw.questions : []).map((m: unknown) => text(m, 200)).filter(Boolean).slice(0, 6),
    script: text(raw?.script, 900),
  };
}
