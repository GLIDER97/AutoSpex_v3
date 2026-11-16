// Wrap visualizer data shared by the page (utils/wrap.ts re-exports it) and the
// AI server function (api/ai.ts): film colors, finishes, coverage and the
// prompts that put the chosen wrap on a car. The prompts are built on the
// server from these fixed choices, so visitors can't send their own text to
// the image model. Files in api/ starting with "_" are not endpoints.
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

export const colorText = (color: WrapColor) =>
  color.hex.length === 2
    ? `${color.name.toLowerCase()} (${color.hex[0]} flipping to ${color.hex[1]} with the viewing angle)`
    : `${color.name.toLowerCase()} (${color.hex[0]})`;

export type WrapExtraId =
  | 'blackRoof'
  | 'blackMirrors'
  | 'blackWheels'
  | 'bronzeWheels'
  | 'silverWheels'
  | 'redCalipers'
  | 'yellowCalipers'
  | 'tintedWindows'
  | 'blackTrim'
  | 'blackBadges';

/** Optional add-ons, chosen from a fixed list so no free text ever reaches the image model. */
export const WRAP_EXTRAS: { id: WrapExtraId; label: string; prompt: string }[] = [
  { id: 'blackRoof', label: 'Gloss black roof', prompt: 'a gloss black roof' },
  { id: 'blackMirrors', label: 'Black mirror caps', prompt: 'gloss black side mirror caps' },
  { id: 'blackWheels', label: 'Black wheels', prompt: 'gloss black wheels' },
  { id: 'bronzeWheels', label: 'Bronze wheels', prompt: 'bronze wheels' },
  { id: 'silverWheels', label: 'Silver wheels', prompt: 'bright silver wheels' },
  { id: 'redCalipers', label: 'Red brake calipers', prompt: 'red brake calipers' },
  { id: 'yellowCalipers', label: 'Yellow brake calipers', prompt: 'yellow brake calipers' },
  { id: 'tintedWindows', label: 'Dark window tint', prompt: 'dark tinted side and rear windows' },
  { id: 'blackTrim', label: 'Blacked-out trim', prompt: 'black window trim and grille surround instead of chrome' },
  { id: 'blackBadges', label: 'Black badges', prompt: 'black badges' },
];
export const MAX_WRAP_EXTRAS = 3;

export interface WrapChoice {
  coverage: CoverageId;
  finish: FinishId;
  color: WrapColor;
  extras: WrapExtraId[];
}

export const choiceLabel = (c: WrapChoice) =>
  `${c.color.name}${c.finish === 'chrome' || c.finish === 'carbon' || c.finish === 'colorShift' ? '' : ` ${FINISHES.find((f) => f.id === c.finish)!.label.toLowerCase()}`}, ${COVERAGE.find((x) => x.id === c.coverage)!.label.toLowerCase()}`;

const NO_TEXT = 'Do not add any text, logos or watermarks.';
const extrasText = (extras: WrapExtraId[]) =>
  WRAP_EXTRAS.filter((x) => extras.includes(x.id))
    .slice(0, MAX_WRAP_EXTRAS)
    .map((x) => x.prompt)
    .join(', ');

/** Prompt for editing the owner's photo. */
export function photoPrompt(c: WrapChoice): string {
  const finish = FINISHES.find((f) => f.id === c.finish)!;
  const target = COVERAGE.find((x) => x.id === c.coverage)!.target;
  const extra = extrasText(c.extras);
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
  const extra = extrasText(c.extras);
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

