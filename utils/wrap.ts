// Wrap visualizer data: film colors and finishes, coverage, typical US prices
// (premium cast film, professional install, 2026) and the AI prompts that put
// the chosen wrap on the owner's photo.
import { SIZES, type CoverageId, type FinishId, type SizeId } from '../api/_wrap';

export * from '../api/_wrap';

/** Install multiplier, film price per yard of 60-inch film, and outdoor life. */
const FINISH_COST: Record<FinishId, { install: number; film: [number, number]; years: [number, number] }> = {
  gloss: { install: 1, film: [32, 45], years: [5, 7] },
  satin: { install: 1, film: [32, 45], years: [5, 7] },
  matte: { install: 1, film: [32, 45], years: [5, 7] },
  metallic: { install: 1.05, film: [36, 50], years: [5, 7] },
  colorShift: { install: 1.35, film: [60, 90], years: [3, 5] },
  carbon: { install: 1.25, film: [35, 55], years: [3, 5] },
  chrome: { install: 1.9, film: [100, 140], years: [1, 3] },
};

const PARTIAL: Record<Exclude<CoverageId, 'full'>, { pro: [number, number]; yards: [number, number] }> = {
  roof: { pro: [350, 700], yards: [3, 4] },
  hood: { pro: [250, 500], yards: [2, 2.5] },
  stripes: { pro: [300, 800], yards: [2, 3] },
  chromeDelete: { pro: [300, 1000], yards: [1, 2] },
};

const round50 = (n: number) => Math.round(n / 50) * 50;

export interface WrapCost {
  pro: [number, number];
  yards: [number, number];
  film: [number, number];
  years: [number, number];
}

export function wrapCost(coverage: CoverageId, finish: FinishId, size: SizeId): WrapCost {
  const s = SIZES.find((x) => x.id === size)!;
  const f = FINISH_COST[finish];
  const base = coverage === 'full' ? { pro: s.full, yards: s.yards } : { pro: PARTIAL[coverage].pro.map((n) => n * s.factor) as [number, number], yards: PARTIAL[coverage].yards.map((n) => Math.ceil(n * s.factor * 2) / 2) as [number, number] };
  return {
    pro: [round50(base.pro[0] * f.install), round50(base.pro[1] * f.install)],
    yards: base.yards,
    film: [Math.round(base.yards[0] * f.film[0]), Math.round(base.yards[1] * f.film[1])],
    years: f.years,
  };
}

export const CARE: Record<FinishId, string> = {
  gloss: 'Hand wash, and use a spray sealant made for vinyl. Avoid brush car washes.',
  satin: 'Hand wash with a pH-neutral soap. No wax or polish: they leave shiny patches.',
  matte: 'Hand wash with a matte-safe soap. Never wax, polish or use brush car washes.',
  metallic: 'Hand wash, and use a spray sealant made for vinyl. Avoid brush car washes.',
  colorShift: 'Hand wash only. Keep pressure washers away from edges and seams.',
  chrome: 'Hand wash only with a soft mitt. It scratches more easily than other films.',
  carbon: 'Hand wash; the texture holds dirt, so use a soft brush on stubborn spots.',
};

export interface PreparedPhoto {
  /** Base64 JPEG without the data: prefix. */
  base64: string;
  dataUrl: string;
  width: number;
  height: number;
}

/** Scales a phone photo to at most 1536 px on the long side and re-encodes it as JPEG. */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (file.size > 30 * 1024 * 1024) throw new Error('That photo is over 30 MB. Use a smaller one.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This photo format can't be opened here. Use a JPEG or PNG (on iPhone, a screenshot of the photo works).");
  }
  const scale = Math.min(1, 1536 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
  return { base64: dataUrl.split(',')[1], dataUrl, width: canvas.width, height: canvas.height };
}
