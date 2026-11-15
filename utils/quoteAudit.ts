// Repair quote checking: reads a photo of an estimate into line items, then
// checks each line against typical US prices with the AI (via /api/ai).
// Arithmetic (totals, labor rate, shop-fee share) is done here, not by the AI.
import { generateContent, Type } from './ai';

export type LineType = 'Labor' | 'Part' | 'Fee' | 'Job';
export const LINE_TYPES: LineType[] = ['Job', 'Labor', 'Part', 'Fee'];

export interface QuoteLine {
  description: string;
  type: LineType;
  /** Hours for labor lines, quantity for parts. */
  quantity: number;
  amount: number;
}

export interface QuoteInput {
  vehicle: string;
  zip: string;
  shopType: 'Independent shop' | 'Dealer' | 'Chain shop' | 'Not sure';
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
  const response = await generateContent({
    model: 'text',
    contents: [
      { inlineData: { mimeType: 'image/jpeg', data: base64Jpeg } },
      {
        text: `This is a photo of a US auto repair estimate or invoice. Extract it exactly as written.
Return the vehicle (year, make, model) if shown, the shop name, the shop or customer ZIP code if shown, and every priced line.
For each line: description, type (Labor for labor charges, Part for parts, Fee for shop supplies/disposal/diagnostic/other fees, Job when one price covers parts and labor together), quantity (labor hours for Labor lines, part quantity for Part lines, otherwise 1) and the line's total amount in USD.
Skip tax, subtotal and total lines. If something is unreadable, leave it out rather than guessing. If this is not a repair estimate, return no lines.`,
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vehicle: {
            type: Type.OBJECT,
            properties: { year: { type: Type.STRING }, make: { type: Type.STRING }, model: { type: Type.STRING } },
          },
          shopName: { type: Type.STRING },
          zip: { type: Type.STRING },
          lines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: LINE_TYPES },
                quantity: { type: Type.NUMBER },
                amount: { type: Type.NUMBER },
              },
              required: ['description', 'type', 'quantity', 'amount'],
            },
          },
        },
        required: ['vehicle', 'lines'],
      },
    },
  });
  if (!response.text) throw new Error('The photo could not be read.');
  const raw = JSON.parse(response.text);
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
// Exact arithmetic
// ---------------------------------------------------------------------------

export function quoteMath(lines: QuoteLine[]) {
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const labor = lines.filter((l) => l.type === 'Labor');
  const laborCost = labor.reduce((s, l) => s + l.amount, 0);
  const laborHours = labor.reduce((s, l) => s + (l.quantity || 0), 0);
  const fees = lines.filter((l) => l.type === 'Fee').reduce((s, l) => s + l.amount, 0);
  return {
    total,
    laborCost,
    laborHours,
    /** Effective hourly rate, when labor lines list hours. */
    laborRate: laborHours > 0 ? laborCost / laborHours : null,
    fees,
    feeShare: total > 0 ? fees / total : 0,
  };
}

// ---------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------

const LINE_VERDICTS = ['Fair', 'High', 'Too high', 'Low', 'Question it'] as const;
const VERDICTS: Verdict[] = ['Fair', 'A bit high', 'Too high', 'Low'];

export async function auditQuote(input: QuoteInput): Promise<QuoteAudit> {
  const math = quoteMath(input.lines);
  const lines = input.lines
    .map((l, i) => `${i + 1}. [${l.type}] ${l.description}${l.type === 'Labor' ? `, ${l.quantity} h` : l.type === 'Part' && l.quantity > 1 ? `, qty ${l.quantity}` : ''}: $${l.amount.toFixed(2)}`)
    .join('\n');

  const prompt = `You are an independent auto repair cost auditor helping a US car owner decide whether a quote is fair.

Vehicle: ${input.vehicle || 'not given'}
Location ZIP: ${input.zip || 'not given'}
Shop type: ${input.shopType}
Quote lines:
${lines}
Quote total (before tax): $${math.total.toFixed(2)}
${math.laborRate ? `Effective labor rate: $${math.laborRate.toFixed(0)} per hour over ${math.laborHours} hours.` : ''}

Judge each line against typical prices in that area for that shop type: book labor time (standard labor guide hours) at local shop rates, and typical aftermarket-to-OEM parts prices. Return one entry in "lines" per quote line, in the same order, with a fair price range for that line and a short note (for example "book time is 1.2 h, quote bills 2.5 h").
Give the overall verdict and fair total range. "canWait" lists items that are often unnecessary, premature or upsold (with why). "missing" lists things a complete quote for this job normally includes but this one doesn't (only if it matters). "questions" are specific questions to ask the shop. "script" is 2-4 polite sentences the owner can say to negotiate, citing the specific numbers.
Be fair to shops: if the quote is reasonable, say so.`;

  const response = await generateContent({
    model: 'text',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verdict: { type: Type.STRING, enum: VERDICTS },
          headline: { type: Type.STRING },
          fairLow: { type: Type.NUMBER },
          fairHigh: { type: Type.NUMBER },
          lines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                verdict: { type: Type.STRING, enum: [...LINE_VERDICTS] },
                fairLow: { type: Type.NUMBER },
                fairHigh: { type: Type.NUMBER },
                note: { type: Type.STRING },
              },
              required: ['verdict', 'fairLow', 'fairHigh', 'note'],
            },
          },
          canWait: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, why: { type: Type.STRING } }, required: ['item', 'why'] },
          },
          missing: { type: Type.ARRAY, items: { type: Type.STRING } },
          questions: { type: Type.ARRAY, items: { type: Type.STRING } },
          script: { type: Type.STRING },
        },
        required: ['verdict', 'headline', 'fairLow', 'fairHigh', 'lines', 'canWait', 'missing', 'questions', 'script'],
      },
    },
  });
  if (!response.text) throw new Error('The check returned no answer.');
  const raw = JSON.parse(response.text);

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
