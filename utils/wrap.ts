// Wrap visualizer data: film colors and finishes, coverage, typical US prices
// (premium cast film, professional install, 2026) and the AI prompts that put
// the chosen wrap on the owner's photo.

export type FinishId = 'gloss' | 'satin' | 'matte' | 'metallic' | 'colorShift' | 'chrome' | 'carbon';
export type CoverageId = 'full' | 'roof' | 'hood' | 'stripes' | 'chromeDelete';
export type SizeId = 'compact' | 'sedan' | 'suvSmall' | 'suvLarge' | 'van';

export interface WrapColor {
  name: string;
  /** One color, or two for color-shift film (the colors it flips between). */
  hex: [string] | [string, string];
}

const solid = (name: string, hex: string): WrapColor => ({ name, hex: [hex] });

const STANDARD: WrapColor[] = [
  solid('Black', '#111214'),
  solid('White', '#f2f2ef'),
  solid('Light grey', '#a9adb0'),
  solid('Battleship grey', '#6b6f72'),
  solid('Dark grey', '#3a3d41'),
  solid('Midnight blue', '#1b2a4a'),
  solid('Royal blue', '#1f4fb4'),
  solid('Sky blue', '#6fb3e0'),
  solid('Teal', '#127c80'),
  solid('Racing green', '#1d4a32'),
  solid('Olive', '#5b6340'),
  solid('Sage', '#8fa88a'),
  solid('Lime', '#9bd12a'),
  solid('Yellow', '#f4c400'),
  solid('Orange', '#f26a1b'),
  solid('Red', '#b3141e'),
  solid('Burgundy', '#5e1424'),
  solid('Pink', '#f08bb0'),
  solid('Purple', '#4b2a7b'),
  solid('Sand', '#c9b38f'),
  solid('Brown', '#5a3d2b'),
];

export const FINISHES: { id: FinishId; label: string; describe: string; colors: WrapColor[] }[] = [
  { id: 'gloss', label: 'Gloss', describe: 'high-gloss', colors: STANDARD },
  { id: 'satin', label: 'Satin', describe: 'satin, with a soft low sheen', colors: STANDARD },
  { id: 'matte', label: 'Matte', describe: 'flat matte, with no shine', colors: STANDARD },
  { id: 'metallic', label: 'Metallic', describe: 'gloss metallic, with fine metal flake', colors: STANDARD },
  {
    id: 'colorShift',
    label: 'Color shift',
    describe: 'pearlescent color-shift',
    colors: [
      { name: 'Purple to green', hex: ['#5b2a86', '#2e8b57'] },
      { name: 'Blue to purple', hex: ['#1f4fb4', '#6b2fa0'] },
      { name: 'Teal to purple', hex: ['#127c80', '#6b2fa0'] },
      { name: 'Green to gold', hex: ['#2e7d32', '#c9a227'] },
      { name: 'Red to gold', hex: ['#a3121c', '#d4a017'] },
      { name: 'Silver to blue', hex: ['#b8bec4', '#3a6fc4'] },
    ],
  },
  {
    id: 'chrome',
    label: 'Chrome',
    describe: 'mirror-like chrome',
    colors: [
      solid('Silver chrome', '#c8ccd0'),
      solid('Black chrome', '#2a2c30'),
      solid('Gold chrome', '#d4af37'),
      solid('Rose gold chrome', '#b76e79'),
      solid('Blue chrome', '#2a5fb0'),
      solid('Red chrome', '#a3121c'),
    ],
  },
  {
    id: 'carbon',
    label: 'Carbon fiber',
    describe: 'carbon fiber weave texture',
    colors: [solid('Black carbon fiber', '#1b1b1d'), solid('Grey carbon fiber', '#4a4c50')],
  },
];

export const COVERAGE: { id: CoverageId; label: string; detail: string; target: string }[] = [
  { id: 'full', label: 'Full wrap', detail: 'Every painted panel', target: "all of the car's painted body panels" },
  {
    id: 'roof',
    label: 'Roof and mirrors',
    detail: 'The popular two-tone look',
    target: 'only the roof and the side mirror caps (leave the rest of the paint exactly as it is)',
  },
  { id: 'hood', label: 'Hood', detail: 'Hood only', target: 'only the hood (leave the rest of the paint exactly as it is)' },
  {
    id: 'stripes',
    label: 'Racing stripes',
    detail: 'Over hood, roof and trunk',
    target: 'two parallel racing stripes running front to back over the hood, roof and trunk (leave the rest of the paint exactly as it is)',
  },
  {
    id: 'chromeDelete',
    label: 'Chrome delete',
    detail: 'Window trim, grille, badges',
    target: 'only the chrome window trim, the chrome grille surround and the chrome badges (leave the body paint exactly as it is)',
  },
];

export const SIZES: { id: SizeId; label: string; yards: [number, number]; full: [number, number]; factor: number }[] = [
  { id: 'compact', label: 'Compact car or coupe', yards: [17, 19], full: [2500, 3800], factor: 0.9 },
  { id: 'sedan', label: 'Midsize sedan', yards: [19, 22], full: [3000, 4500], factor: 1 },
  { id: 'suvSmall', label: 'Small SUV or crossover', yards: [20, 24], full: [3300, 5000], factor: 1.1 },
  { id: 'suvLarge', label: 'Large SUV or pickup', yards: [24, 28], full: [3800, 6000], factor: 1.25 },
  { id: 'van', label: 'Minivan or van', yards: [25, 30], full: [4000, 6500], factor: 1.35 },
];

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

export const colorText = (color: WrapColor) =>
  color.hex.length === 2
    ? `${color.name.toLowerCase()} (${color.hex[0]} flipping to ${color.hex[1]} with the viewing angle)`
    : `${color.name.toLowerCase()} (${color.hex[0]})`;

export interface WrapChoice {
  coverage: CoverageId;
  finish: FinishId;
  color: WrapColor;
  extra: string;
}

export const choiceLabel = (c: WrapChoice) =>
  `${c.color.name}${c.finish === 'chrome' || c.finish === 'carbon' || c.finish === 'colorShift' ? '' : ` ${FINISHES.find((f) => f.id === c.finish)!.label.toLowerCase()}`}, ${COVERAGE.find((x) => x.id === c.coverage)!.label.toLowerCase()}`;

const NO_TEXT = 'Do not add any text, logos or watermarks.';
const cleanExtra = (extra: string) => extra.replace(/\s+/g, ' ').trim().slice(0, 200);

/** Prompt for editing the owner's photo. */
export function photoPrompt(c: WrapChoice): string {
  const finish = FINISHES.find((f) => f.id === c.finish)!;
  const target = COVERAGE.find((x) => x.id === c.coverage)!.target;
  const extra = cleanExtra(c.extra);
  return [
    `Edit this photo. Apply a ${finish.describe} vinyl wrap in ${colorText(c.color)} to ${target}.`,
    extra && `Also: ${extra}.`,
    'Keep everything else exactly as in the photo: the same car, body shape, camera angle and framing, wheels, tires, glass, lights, grille, badges, license plate, background and lighting.',
    'The wrap should look like professionally installed film with realistic reflections for the lighting in the photo.',
    NO_TEXT,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Prompt for drawing the car when there is no photo. */
export function vehiclePrompt(c: WrapChoice, vehicle: string, size: SizeId): string {
  const finish = FINISHES.find((f) => f.id === c.finish)!;
  const car = vehicle || SIZES.find((s) => s.id === size)!.label.toLowerCase();
  const rest = c.color.hex[0].toLowerCase() === '#f2f2ef' ? 'gloss black' : 'gloss white';
  const extra = cleanExtra(c.extra);
  return [
    `A realistic photo of a ${car}.`,
    c.coverage === 'full'
      ? `It has a full ${finish.describe} vinyl wrap in ${colorText(c.color)}.`
      : `The car is painted ${rest}, with a ${finish.describe} vinyl wrap in ${colorText(c.color)} on ${COVERAGE.find((x) => x.id === c.coverage)!.target.replace(/ \(leave.*\)$/, '')}.`,
    extra && `Also: ${extra}.`,
    'Three-quarter front view, parked outdoors in soft daylight, the whole car in frame, accurate factory body shape and wheels for this model.',
    NO_TEXT,
  ]
    .filter(Boolean)
    .join(' ');
}

const RATIOS = ['1:1', '5:4', '4:3', '3:2', '16:9', '21:9', '4:5', '3:4', '2:3', '9:16'];

/** The supported aspect ratio closest to a photo's shape. */
export function nearestAspect(width: number, height: number): string {
  const r = Math.log(width / height);
  return RATIOS.reduce((best, a) => {
    const [w, h] = a.split(':').map(Number);
    const [bw, bh] = best.split(':').map(Number);
    return Math.abs(Math.log(w / h) - r) < Math.abs(Math.log(bw / bh) - r) ? a : best;
  });
}

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
