// Vanity plate ideas: AI suggestions, checked here for length, allowed
// characters and how easily they can be misread.
import { generateContent, Type } from './ai';

export const VIBES = ['Funny', 'Clever', 'Clean and simple', 'Bold', 'Nerdy', 'Wholesome'] as const;
export type Vibe = (typeof VIBES)[number];

/** Characters people mix up at a distance or in a hurry. */
const LOOKALIKE: Record<string, string> = { '0': 'O', O: '0', '1': 'I', I: '1', '5': 'S', S: '5', '8': 'B', B: '8', '2': 'Z', Z: '2' };

/** Uppercase letters, digits and single spaces only (what every state accepts). */
export const cleanPlate = (text: string) => text.toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

export function readability(plate: string): { easy: boolean; note: string } {
  const hits = [...new Set(plate.replace(/ /g, ''))].filter((c) => LOOKALIKE[c]).map((c) => `${c} (looks like ${LOOKALIKE[c]})`);
  return hits.length === 0 ? { easy: true, note: 'Easy to read at a glance.' } : { easy: false, note: `Can be misread: ${hits.slice(0, 3).join(', ')}.` };
}

export interface PlateIdea {
  plate: string;
  reading: string;
  meaning: string;
  /** The AI's flag for plates a DMV might reject or that read badly. */
  caution: string;
}

export async function plateIdeas(input: { car: string; about: string; vibe: Vibe; state: string; maxChars: number }): Promise<PlateIdea[]> {
  const res = await generateContent({
    model: 'text',
    contents: `Suggest 12 personalized (vanity) license plate ideas for a driver in ${input.state || 'the US'}.
Car: ${input.car || 'not given'}
About the driver: ${input.about || 'not given'}
Style: ${input.vibe}

Rules: each plate is at most ${input.maxChars} characters counting spaces, using only letters A-Z, digits 0-9 and spaces. Make them clever and readable: number-for-letter swaps (4 = for, 2 = to, 8 = ate) and dropped vowels are fine. Mix ideas about the car and about the driver. No profanity, drug, alcohol, violence or sexual references, and nothing that reads that way, because DMVs reject them.
For each: plate, reading (how it sounds read aloud, e.g. "GR8 DAY" = "great day"), meaning (one short line), caution (empty string, or a short note if another reading could get it rejected or confuse people).`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ideas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { plate: { type: Type.STRING }, reading: { type: Type.STRING }, meaning: { type: Type.STRING }, caution: { type: Type.STRING } },
              required: ['plate', 'reading', 'meaning', 'caution'],
            },
          },
        },
        required: ['ideas'],
      },
    },
  });
  const raw = JSON.parse(res.text ?? '{}');
  const seen = new Set<string>();
  const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
  return (Array.isArray(raw.ideas) ? raw.ideas : [])
    .map((i: any) => ({ plate: cleanPlate(String(i?.plate ?? '')), reading: text(i?.reading, 80), meaning: text(i?.meaning, 160), caution: text(i?.caution, 160) }))
    .filter((i: PlateIdea) => i.plate.length >= 2 && i.plate.length <= input.maxChars && !seen.has(i.plate) && seen.add(i.plate));
}
