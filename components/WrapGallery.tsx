// /wrap-gallery — published wrap previews from the Wrap Designer (data/wraps/), filterable by finish and coverage.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { COVERAGE, FINISHES, type CoverageId, type FinishId } from '../utils/wrap';
import {
  STATS_MIN_PREVIEWS,
  WRAP_DESIGNS,
  WRAP_STATS,
  coverageLabel,
  designAlt,
  designImage,
  designPath,
  designSrcSet,
  designTitle,
  finishLabel,
  type WrapDesign,
} from '../data/wraps';
import SEO from './SEO';
import { Faq, Panel, PanelTitle, ToolPage, focusRing } from './tool/kit';
import { MeterList } from './tool/charts';

export const GALLERY_DESCRIPTION =
  'Car wrap ideas on real models: matte, satin, gloss, chrome and color-shift wraps, stripes and roof wraps, as AI previews you can try on your own car.';

const chip = (active: boolean) =>
  cn(
    'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors',
    focusRing,
    active ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-muted',
  );

function Swatch({ hex }: { hex: string[] }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3.5 shrink-0 rounded-full border border-black/15"
      style={{ background: hex.length === 2 ? `linear-gradient(135deg, ${hex[0]} 45%, ${hex[1]} 55%)` : hex[0] }}
    />
  );
}

export function DesignCard({ d, eager = false }: { d: WrapDesign; eager?: boolean }) {
  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card">
      <Link to={designPath(d)} className={cn('group block', focusRing)}>
        <img
          src={designImage(d, 'small')}
          srcSet={designSrcSet(d)}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          width={640}
          height={Math.round((640 * d.height) / d.width)}
          alt={designAlt(d)}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="aspect-[3/2] w-full bg-muted object-cover transition-opacity group-hover:opacity-90"
        />
        <div className="p-4">
          <p className="font-semibold leading-snug underline-offset-4 group-hover:underline">{designTitle(d)}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Swatch hex={d.color.hex} />
              {d.color.name}
            </span>
            <span>{finishLabel(d.finish)}</span>
            <span>{coverageLabel(d.coverage)}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

const FAQS: [string, React.ReactNode][] = [
  [
    'Are these real cars?',
    'No. Every picture is an AI-generated preview made with the MyAutoSpex Wrap Designer, so you can see a color and finish on a model before you pay for a wrap. Body details can differ slightly from the real car.',
  ],
  [
    'Can I use these images?',
    <>
      Yes, for free, under the{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
        CC BY 4.0
      </a>{' '}
      license: credit MyAutoSpex with a link to the design's page. Each design page has the image files and a ready-made credit line.
    </>,
  ],
  [
    'How do I see a wrap on my own car?',
    <>
      Open the{' '}
      <Link to="/wrap-designer" className="underline underline-offset-4">
        Wrap Designer
      </Link>
      , upload a photo of your car or enter its year, make and model, and pick a finish, color and coverage. It also estimates what the wrap costs and finds
      wrap shops near you.
    </>,
  ],
  [
    'Which designs appear here?',
    'Designs made by MyAutoSpex, and previews visitors made without a photo (from year, make and model alone), checked before they are published. Photos visitors upload of their own cars are never published or kept.',
  ],
];

const WrapGallery: React.FC = () => {
  const [finish, setFinish] = useState<FinishId | 'all'>('all');
  const [coverage, setCoverage] = useState<CoverageId | 'all'>('all');
  const shown = useMemo(
    () => WRAP_DESIGNS.filter((d) => (finish === 'all' || d.finish === finish) && (coverage === 'all' || d.coverage === coverage)),
    [finish, coverage],
  );
  const finishes = FINISHES.filter((f) => WRAP_DESIGNS.some((d) => d.finish === f.id));
  const coverages = COVERAGE.filter((c) => WRAP_DESIGNS.some((d) => d.coverage === c.id));
  const stats = WRAP_STATS && WRAP_STATS.total >= STATS_MIN_PREVIEWS ? WRAP_STATS : null;
  const top = (counts: Record<string, number>, name: (k: string) => string, n = 6) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => ({ label: name(k), value: v }));

  return (
    <>
      <SEO title="Car Wrap Gallery: Colors and Finishes" description={GALLERY_DESCRIPTION} />
      <ToolPage
        category="fun"
        title="Car wrap gallery"
        intro="Wrap ideas on real models: matte, satin, gloss, metallic, chrome and color-shift films, full wraps, roof wraps, stripes and chrome deletes. Every picture is an AI preview from the Wrap Designer, and you can try any of them on your own car."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/wrap-designer"
            className={cn('inline-flex h-11 items-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong', focusRing)}
          >
            Try a wrap on your car
          </Link>
          <p className="text-[0.9375rem] text-muted-foreground">
            {WRAP_DESIGNS.length} design{WRAP_DESIGNS.length === 1 ? '' : 's'}
            <span aria-hidden="true" className="mx-1.5">
              ·
            </span>
            free to reuse with credit
          </p>
        </div>

        <div className="mt-8 space-y-3" role="group" aria-label="Filter designs">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Finish">
            <button type="button" className={chip(finish === 'all')} aria-pressed={finish === 'all'} onClick={() => setFinish('all')}>
              All finishes
            </button>
            {finishes.map((f) => (
              <button key={f.id} type="button" className={chip(finish === f.id)} aria-pressed={finish === f.id} onClick={() => setFinish(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Coverage">
            <button type="button" className={chip(coverage === 'all')} aria-pressed={coverage === 'all'} onClick={() => setCoverage('all')}>
              Any coverage
            </button>
            {coverages.map((c) => (
              <button key={c.id} type="button" className={chip(coverage === c.id)} aria-pressed={coverage === c.id} onClick={() => setCoverage(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
          Showing {shown.length} of {WRAP_DESIGNS.length}
        </p>
        <ul className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((d, i) => (
            <DesignCard key={d.slug} d={d} eager={i < 3} />
          ))}
        </ul>
        {shown.length === 0 && <p className="mt-6 text-muted-foreground">No designs match both filters yet.</p>}

        {stats && (
          <Panel className="mt-10 max-w-3xl">
            <PanelTitle>Which wraps are people trying?</PanelTitle>
            <p className="mt-3 text-[0.9375rem]">
              Counts of the options chosen in {stats.total.toLocaleString('en-US')} Wrap Designer previews over the last {stats.days} days, to{' '}
              {stats.asOf}.
            </p>
            <div className="mt-5 grid gap-8 sm:grid-cols-2">
              <figure>
                <figcaption className="mb-3 text-sm font-semibold">Finish</figcaption>
                <MeterList items={top(stats.finish, (k) => finishLabel(k as FinishId))} total={stats.total} />
              </figure>
              <figure>
                <figcaption className="mb-3 text-sm font-semibold">Color</figcaption>
                <MeterList items={top(stats.color, (k) => k.split(':')[1] ?? k)} total={stats.total} />
              </figure>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Source: MyAutoSpex Wrap Designer, anonymous counts (no photos or personal data).</p>
          </Panel>
        )}

        <Faq id="gallery-faq" title="About the wrap gallery" items={FAQS} className="mt-10" />
      </ToolPage>
    </>
  );
};

export default WrapGallery;
