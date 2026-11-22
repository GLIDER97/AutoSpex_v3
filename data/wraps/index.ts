// The wrap gallery (/wrap-gallery): published wrap previews from the Wrap Designer, in data/wraps/gallery.json.
// "starter" designs were made by MyAutoSpex to open the gallery; "visitor" designs are previews visitors made
// without a photo, reviewed and published by the daily growth run (docs/WRAP-GALLERY.md). Every title, alt text,
// caption and file name is built here from the design's details, so they always match the picture.
import { COVERAGE, FINISHES, WRAP_EXTRAS, type CoverageId, type FinishId, type SizeId, type WrapExtraId } from '../../utils/wrap';

export interface WrapDesign {
  /** URL and file name: /wrap-gallery/<slug>, /images/wraps/<slug>-1200.webp */
  slug: string;
  source: 'starter' | 'visitor';
  /** Database id of a visitor design (its images are served from /images/wraps/v/<id>/...). */
  id?: number;
  /** YYYY-MM-DD */
  created: string;
  year?: number;
  make: string;
  model: string;
  size: SizeId;
  coverage: CoverageId;
  finish: FinishId;
  color: { name: string; hex: string[] };
  extras: WrapExtraId[];
  width: number;
  height: number;
}

export interface WrapStats {
  /** YYYY-MM-DD the counts were taken */
  asOf: string;
  days: number;
  /** Previews made in the period (with and without a photo). */
  total: number;
  finish: Record<string, number>;
  color: Record<string, number>;
  coverage: Record<string, number>;
  extra: Record<string, number>;
}

const files = import.meta.glob<{ designs: WrapDesign[] }>('./gallery.json', { eager: true, import: 'default' });
const statsFiles = import.meta.glob<WrapStats>('./stats.json', { eager: true, import: 'default' });

/** Newest first. */
export const WRAP_DESIGNS: WrapDesign[] = [...(Object.values(files)[0]?.designs ?? [])].sort(
  (a, b) => b.created.localeCompare(a.created),
);

/** Anonymous counts of the options people chose; shown only once there are enough to mean something. */
export const WRAP_STATS: WrapStats | null = Object.values(statsFiles)[0] ?? null;
export const STATS_MIN_PREVIEWS = 50;

export const findDesign = (slug: string) => WRAP_DESIGNS.find((d) => d.slug === slug);
export const designPath = (d: WrapDesign) => `/wrap-gallery/${d.slug}`;

const imageBase = (d: WrapDesign) => (d.source === 'visitor' && d.id ? `/images/wraps/v/${d.id}/${d.slug}` : `/images/wraps/${d.slug}`);
export const designImage = (d: WrapDesign, size: 'large' | 'small' | 'share') =>
  `${imageBase(d)}-${size === 'large' ? '1200.webp' : size === 'small' ? '640.webp' : 'share.jpg'}`;
/** srcset for responsive images: 640 and 1200 px WebP. */
export const designSrcSet = (d: WrapDesign) => `${designImage(d, 'small')} 640w, ${designImage(d, 'large')} 1200w`;

export const vehicleOf = (d: WrapDesign) => [d.year, d.make, d.model].filter(Boolean).join(' ');
export const finishLabel = (f: FinishId) => FINISHES.find((x) => x.id === f)?.label ?? f;
export const coverageLabel = (c: CoverageId) => COVERAGE.find((x) => x.id === c)?.label ?? c;
export const extraLabels = (d: WrapDesign) => WRAP_EXTRAS.filter((x) => d.extras.includes(x.id)).map((x) => x.label);

const COVERAGE_WORDS: Record<CoverageId, string> = {
  full: 'full wrap',
  roof: 'roof and mirror wrap',
  hood: 'hood wrap',
  stripes: 'racing stripes',
  chromeDelete: 'chrome delete',
};
export const coverageWords = (c: CoverageId) => COVERAGE_WORDS[c];

/** "matte black", "purple to green color-shift", "blue chrome", "black carbon fiber" */
export function lookOf(d: Pick<WrapDesign, 'finish' | 'color'>) {
  const color = d.color.name.toLowerCase();
  if (d.finish === 'chrome' || d.finish === 'carbon') return color;
  if (d.finish === 'colorShift') return `${color} color-shift`;
  return `${d.finish} ${color}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SMALL = new Set(['a', 'an', 'and', 'on', 'to', 'of']);
const titleCase = (s: string) => s.replace(/\b[a-z]+/g, (w, i: number) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)));

/** "Matte black full wrap on a 2023 Tesla Model 3" */
export const designTitle = (d: WrapDesign) => `${cap(lookOf(d))} ${coverageWords(d.coverage)} on a ${vehicleOf(d)}`;

/** Search result title, 47 characters or fewer when possible (the site name is added). */
export function designSeoTitle(d: WrapDesign) {
  const look = titleCase(lookOf(d));
  const candidates = [
    `${vehicleOf(d)} ${look} ${titleCase(coverageWords(d.coverage))}`,
    `${vehicleOf(d)} ${look} Wrap`,
    `${d.make} ${d.model} ${look} Wrap`,
    `${d.make} ${d.model} ${titleCase(d.color.name)} Wrap`,
  ];
  return candidates.find((t) => t.length <= 47) ?? candidates[candidates.length - 1];
}

/** Alt text: what the picture shows, including that it is AI-generated. */
export function designAlt(d: WrapDesign) {
  const extras = extraLabels(d).map((x) => x.toLowerCase());
  return `AI-generated preview of a ${vehicleOf(d)} with a ${lookOf(d)} ${coverageWords(d.coverage)}${extras.length ? `, ${extras.join(', ')}` : ''}, seen from the front three-quarter view`;
}

/** Meta description, 160 characters or fewer. */
export function designDescription(d: WrapDesign) {
  const extras = extraLabels(d).map((x) => x.toLowerCase());
  const long = `A ${vehicleOf(d)} with a ${lookOf(d)} ${coverageWords(d.coverage)}${extras.length ? ` and ${extras.join(', ')}` : ''}: an AI wrap preview. See it, then try the same wrap on your own car for free.`;
  if (long.length <= 160) return long;
  const short = `A ${vehicleOf(d)} with a ${lookOf(d)} ${coverageWords(d.coverage)}: an AI wrap preview. Try the same wrap on your own car for free.`;
  return short.length <= 160 ? short : short.slice(0, 157).replace(/\s+\S*$/, '') + '…';
}

/** Who made it, for the caption. */
export const madeBy = (d: WrapDesign) => (d.source === 'visitor' ? 'Designed by a visitor' : 'Made by MyAutoSpex');

/** Opens the Wrap Designer with this design's choices filled in. */
export function tryHref(d: WrapDesign) {
  const p = new URLSearchParams();
  if (d.year) p.set('year', String(d.year));
  p.set('make', d.make);
  p.set('model', d.model);
  p.set('finish', d.finish);
  p.set('color', d.color.name);
  p.set('coverage', d.coverage);
  if (d.extras.length) p.set('extras', d.extras.join(','));
  return `/wrap-designer?${p.toString()}`;
}

/** Other designs of the same model first, then the same finish, then the same coverage. */
export function relatedDesigns(d: WrapDesign, max = 6) {
  const others = WRAP_DESIGNS.filter((o) => o.slug !== d.slug);
  const score = (o: WrapDesign) =>
    (o.make === d.make && o.model === d.model ? 4 : o.make === d.make ? 2 : 0) + (o.finish === d.finish ? 2 : 0) + (o.coverage === d.coverage ? 1 : 0);
  return others
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((x) => x.o);
}

/** The credit line people paste when they reuse an image (CC BY 4.0). */
export const creditHtml = (d: WrapDesign, site: string) =>
  `<a href="${site}${designPath(d)}">${designTitle(d)}</a>: AI preview by <a href="${site}/wrap-designer">MyAutoSpex</a>, CC BY 4.0`;
