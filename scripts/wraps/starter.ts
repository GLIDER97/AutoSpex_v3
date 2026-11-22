// One-off: generate the wrap gallery's starter designs with the same model and prompt builder the
// Wrap Designer uses (api/ai.ts, api/_wrap.ts), so the gallery opens with content. Each one is
// labeled on the site as made by MyAutoSpex, never as a visitor's design. See docs/WRAP-GALLERY.md.
//
//   NODE_USE_ENV_PROXY=1 node scripts/wraps/starter.ts       (needs OpenRouter access)
//
// Writes public/images/wraps/<slug>-1200.webp, -640.webp and -share.jpg, and adds entries to
// data/wraps/gallery.json. Skips designs already there. Logs each cost in docs/openrouter-spend.csv.
import fs from 'node:fs/promises';
import { FINISHES, vehiclePrompt, type CoverageId, type FinishId, type SizeId, type WrapExtraId } from '../../api/_wrap.ts';
import { encodeWrap, shareJpeg } from '../../api/_wrapImage.ts';

const MODEL = 'black-forest-labs/flux-3-image-klein';
const root = new URL('../../', import.meta.url);

interface Starter {
  year: number;
  make: string;
  model: string;
  size: SizeId;
  coverage: CoverageId;
  finish: FinishId;
  color: string;
  extras: WrapExtraId[];
}

const S = (
  year: number,
  make: string,
  model: string,
  size: SizeId,
  coverage: CoverageId,
  finish: FinishId,
  color: string,
  extras: WrapExtraId[] = [],
): Starter => ({ year, make, model, size, coverage, finish, color, extras });

const STARTERS: Starter[] = [
  S(2023, 'Tesla', 'Model 3', 'sedan', 'full', 'matte', 'Black', ['blackWheels']),
  S(2024, 'Tesla', 'Model Y', 'suvSmall', 'full', 'satin', 'Battleship grey', ['blackWheels']),
  S(2022, 'Ford', 'Mustang GT', 'compact', 'stripes', 'gloss', 'White'),
  S(2023, 'Ford', 'F-150', 'suvLarge', 'full', 'matte', 'Olive', ['blackWheels', 'tintedWindows']),
  S(2021, 'Jeep', 'Wrangler Unlimited', 'suvLarge', 'full', 'matte', 'Sand', ['blackWheels']),
  S(2023, 'BMW', 'M3', 'sedan', 'full', 'colorShift', 'Purple to green'),
  S(2022, 'Toyota', 'GR Supra', 'compact', 'full', 'gloss', 'Orange', ['blackRoof']),
  S(2023, 'Honda', 'Civic Type R', 'compact', 'full', 'satin', 'Light grey', ['redCalipers']),
  S(2024, 'Toyota', 'Camry', 'sedan', 'roof', 'gloss', 'Black'),
  S(2023, 'Dodge', 'Charger', 'sedan', 'chromeDelete', 'gloss', 'Black'),
  S(2022, 'Chevrolet', 'Corvette Stingray', 'compact', 'full', 'metallic', 'Red'),
  S(2023, 'Porsche', '911 Carrera', 'compact', 'full', 'gloss', 'Racing green', ['bronzeWheels']),
  S(2023, 'Ram', '1500', 'suvLarge', 'full', 'matte', 'Dark grey', ['blackBadges', 'blackTrim']),
  S(2022, 'Subaru', 'WRX', 'sedan', 'full', 'gloss', 'Royal blue', ['bronzeWheels']),
  S(2022, 'Nissan', 'GT-R', 'compact', 'full', 'chrome', 'Blue chrome'),
  S(2023, 'Toyota', 'Tacoma', 'suvLarge', 'hood', 'matte', 'Black'),
  S(2023, 'Hyundai', 'Elantra N', 'sedan', 'hood', 'carbon', 'Black carbon fiber'),
  S(2023, 'Mazda', 'MX-5 Miata', 'compact', 'full', 'satin', 'Purple'),
  S(2023, 'Kia', 'Telluride', 'suvLarge', 'full', 'satin', 'Sage', ['blackWheels']),
  S(2024, 'Ford', 'Bronco', 'suvLarge', 'full', 'gloss', 'Yellow', ['blackWheels']),
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const COVERAGE_WORDS: Record<CoverageId, string> = {
  full: 'full wrap',
  roof: 'roof wrap',
  hood: 'hood wrap',
  stripes: 'racing stripes',
  chromeDelete: 'chrome delete',
};
const finishWord = (f: FinishId) => (f === 'chrome' || f === 'carbon' ? '' : f === 'colorShift' ? 'color shift' : f);
const starterSlug = (d: Starter) => slugify(`${d.year} ${d.make} ${d.model} ${finishWord(d.finish)} ${d.color} ${COVERAGE_WORDS[d.coverage]}`);

const galleryFile = new URL('data/wraps/gallery.json', root);
const gallery: { designs: Record<string, unknown>[] } = JSON.parse(await fs.readFile(galleryFile, 'utf8').catch(() => '{"designs":[]}'));
const spendFile = new URL('docs/openrouter-spend.csv', root);
const imageDir = new URL('public/images/wraps/', root);
const today = new Date().toISOString().slice(0, 10);
const only = process.argv.slice(2);
let total = 0;

for (const d of STARTERS) {
  const slug = starterSlug(d);
  if (only.length && !only.includes(slug)) continue;
  if (gallery.designs.some((g) => g.slug === slug)) continue;
  const finish = FINISHES.find((f) => f.id === d.finish)!;
  const color = finish.colors.find((c) => c.name === d.color);
  if (!color) throw new Error(`${slug}: no color ${d.color} for ${d.finish}`);
  const choice = { coverage: d.coverage, finish: d.finish, color, extras: d.extras };
  const vehicle = `${d.year} ${d.make} ${d.model}`;

  const res = await fetch('https://openrouter.ai/api/v1/images', {
    method: 'POST',
    // The sandbox proxy replaces this placeholder with the real key.
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sk-or-v1-proxy-injected' },
    body: JSON.stringify({ model: MODEL, prompt: vehiclePrompt(choice, vehicle, d.size), n: 1, resolution: '1K', aspect_ratio: '3:2' }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  const item = body?.data?.[0];
  const b64: string | undefined =
    item?.b64_json ?? (typeof item?.url === 'string' && item.url.startsWith('data:') ? item.url.split(',')[1] : undefined);
  if (!b64) throw new Error(`${slug}: no image in ${JSON.stringify(body).slice(0, 300)}`);
  const cost = Number(body?.usage?.cost ?? 0);
  total += cost;

  const look = `${finishWord(d.finish) && d.finish !== 'colorShift' ? `${d.finish} ` : ''}${d.color.toLowerCase()}${d.finish === 'colorShift' ? ' color-shift' : ''}`;
  const title = `${vehicle} with a ${look} ${COVERAGE_WORDS[d.coverage]} (AI wrap preview)`;
  const caption = `AI-generated preview of a ${vehicle} with a ${look} ${COVERAGE_WORDS[d.coverage]}. Made with the MyAutoSpex Wrap Designer.`;
  const img = await encodeWrap(Buffer.from(b64, 'base64'), { title, caption, pageUrl: `https://www.myautospex.com/wrap-gallery/${slug}` });
  await fs.writeFile(new URL(`${slug}-1200.webp`, imageDir), img.large);
  await fs.writeFile(new URL(`${slug}-640.webp`, imageDir), img.small);
  await fs.writeFile(new URL(`${slug}-share.jpg`, imageDir), await shareJpeg(img.large));

  gallery.designs.push({
    slug,
    source: 'starter',
    created: today,
    year: d.year,
    make: d.make,
    model: d.model,
    size: d.size,
    coverage: d.coverage,
    finish: d.finish,
    color: { name: color.name, hex: color.hex },
    extras: d.extras,
    width: img.width,
    height: img.height,
  });
  await fs.writeFile(galleryFile, `${JSON.stringify(gallery, null, 1)}\n`);
  await fs.appendFile(spendFile, `${today},${MODEL},wrap gallery starter: ${slug},1,${cost.toFixed(4)},\n`);
  console.log(`${slug}: ${(img.large.length / 1024).toFixed(0)} KB / ${(img.small.length / 1024).toFixed(0)} KB, $${cost.toFixed(4)}`);
}
console.log(`total $${total.toFixed(4)}`);
