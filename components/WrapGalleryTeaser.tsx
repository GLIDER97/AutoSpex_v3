// Wrap gallery promotion on the Wrap Designer: a banner under the title, and gallery images plus a big
// "View the complete wrap gallery" card under the cost estimate (docs/WRAP-GALLERY.md).
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Images } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoverageId, FinishId } from '../utils/wrap';
import { WRAP_DESIGNS, designAlt, designImage, designPath, designSrcSet, designTitle, finishLabel, type WrapDesign } from '../data/wraps';
import { Panel, PanelTitle, focusRing } from './tool/kit';

const count = WRAP_DESIGNS.length;

function Thumb({ d, className, sizes = '120px' }: { d: WrapDesign; className?: string; sizes?: string }) {
  return (
    <img
      src={designImage(d, 'small')}
      srcSet={designSrcSet(d)}
      sizes={sizes}
      width={640}
      height={Math.round((640 * d.height) / d.width)}
      alt={designAlt(d)}
      loading="lazy"
      decoding="async"
      className={cn('aspect-[3/2] bg-muted object-cover', className)}
    />
  );
}

/** How colorful a design's main color is (HSL saturation weighted by mid lightness), to pick eye-catching thumbnails. */
function vividness(d: WrapDesign) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(d.color.hex[0].slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  return s * (1 - Math.abs(l - 0.5)) + (d.color.hex.length === 2 ? 0.3 : 0);
}

/** A highlighted link to the gallery, right under the page title. */
export function GalleryBanner() {
  if (!count) return null;
  const preview = [...WRAP_DESIGNS].sort((a, b) => vividness(b) - vividness(a)).slice(0, 3);
  return (
    <Link
      to="/wrap-gallery"
      className={cn(
        'group mb-6 flex items-center gap-4 rounded-xl border border-border border-l-[6px] border-l-sign-yellow bg-card p-3 pr-4 transition-colors hover:bg-muted sm:p-4',
        focusRing,
      )}
    >
      <span className="hidden shrink-0 -space-x-6 sm:flex" aria-hidden="true">
        {preview.map((d) => (
          <img
            key={d.slug}
            src={designImage(d, 'small')}
            alt=""
            width={96}
            height={64}
            loading="lazy"
            decoding="async"
            className="h-14 w-21 rounded-lg border-2 border-card object-cover shadow-sm"
          />
        ))}
      </span>
      <Images aria-hidden="true" className="size-7 shrink-0 text-muted-foreground sm:hidden" />
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Need ideas? Browse the car wrap gallery</span>
        <span className="block text-sm text-muted-foreground">
          {count} wraps on real models: matte, satin, gloss, chrome, color-shift, stripes and more
        </span>
      </span>
      <ArrowRight aria-hidden="true" className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Designs that match what the visitor has picked come first: same finish, then same coverage, then newest. */
function pick(finish: FinishId, coverage: CoverageId, n: number) {
  const score = (d: WrapDesign) => (d.finish === finish ? 2 : 0) + (d.coverage === coverage ? 1 : 0);
  return [...WRAP_DESIGNS].sort((a, b) => score(b) - score(a)).slice(0, n);
}

/** Gallery images and a big "View the complete wrap gallery" card, under the cost estimate. */
export function GalleryShowcase({ finish, coverage }: { finish: FinishId; coverage: CoverageId }) {
  if (!count) return null;
  const designs = pick(finish, coverage, 4);
  const matching = WRAP_DESIGNS.filter((d) => d.finish === finish).length;
  return (
    <Panel aria-labelledby="gallery-ideas-title">
      <PanelTitle>
        <span id="gallery-ideas-title">Wrap ideas from the gallery</span>
      </PanelTitle>
      <p className="mt-1 text-[0.9375rem] text-muted-foreground">
        {matching > 0
          ? `${finishLabel(finish)} wraps first, since that's the finish you picked.`
          : 'Wraps on real models, to compare colors and finishes.'}
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        {designs.map((d) => (
          <li key={d.slug}>
            <Link to={designPath(d)} className={cn('group block overflow-hidden rounded-lg border border-border bg-card', focusRing)}>
              <Thumb d={d} sizes="(min-width: 1024px) 220px, 50vw" className="w-full transition-opacity group-hover:opacity-90" />
              <span className="block p-2.5 text-sm leading-snug font-semibold underline-offset-4 group-hover:underline">{designTitle(d)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/wrap-gallery"
        className={cn(
          'group relative mt-4 flex flex-col overflow-hidden rounded-xl bg-sign-green p-5 text-white transition-colors hover:bg-sign-green-strong sm:p-6',
          focusRing,
        )}
      >
        <span aria-hidden="true" className="absolute -right-12 -bottom-12 size-28 rotate-45 rounded-3xl bg-sign-yellow sm:size-36" />
        <span className="relative flex items-center gap-2 text-sm font-semibold tracking-wide text-white/85 uppercase">
          <Images aria-hidden="true" className="size-4" />
          Car wrap gallery
        </span>
        <span className="relative mt-2 font-heading text-2xl leading-tight font-extrabold sm:text-[1.75rem]">View the complete wrap gallery</span>
        <span className="relative mt-2 max-w-[34ch] text-[0.9375rem] text-white/90">
          All {count} designs, filterable by finish and coverage. Free to reuse with credit.
        </span>
        <span className="relative mt-4 inline-flex items-center gap-2 self-start rounded-lg bg-white px-4 py-2.5 font-bold text-sign-green">
          Open the gallery
          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </Panel>
  );
}
