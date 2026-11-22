// /wrap-gallery/:slug — one published wrap preview with its details, reuse terms and related designs.
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SITE_URL } from '../seo/site';
import { CARE, COVERAGE } from '../utils/wrap';
import {
  coverageLabel,
  creditHtml,
  designAlt,
  designDescription,
  designImage,
  designSeoTitle,
  designSrcSet,
  designTitle,
  extraLabels,
  findDesign,
  finishLabel,
  madeBy,
  relatedDesigns,
  tryHref,
  vehicleOf,
} from '../data/wraps';
import NotFound from './NotFound';
import SEO from './SEO';
import { SignMarker } from './brand';
import { FactList, Panel, PanelTitle, focusRing } from './tool/kit';
import { DesignCard } from './WrapGallery';

const linkClass = cn('font-semibold underline underline-offset-4', focusRing);
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          },
          () => undefined,
        )
      }
      className={cn('inline-flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3.5 text-sm font-semibold hover:bg-muted', focusRing)}
    >
      {done ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
      {done ? 'Copied' : label}
    </button>
  );
}

const WrapDesignPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const d = findDesign(slug);
  if (!d) return <NotFound />;

  const title = designTitle(d);
  const vehicle = vehicleOf(d);
  const pageUrl = `${SITE_URL}/wrap-gallery/${d.slug}`;
  const shareUrl = `${SITE_URL}${designImage(d, 'share')}`;
  const extras = extraLabels(d);
  const related = relatedDesigns(d);
  const credit = creditHtml(d, SITE_URL);
  const pin = `https://www.pinterest.com/pin/create/button/?${new URLSearchParams({ url: pageUrl, media: shareUrl, description: `${title} (AI wrap preview)` })}`;

  return (
    <div className="w-full max-w-6xl">
      <SEO title={designSeoTitle(d)} description={designDescription(d)} />

      <nav aria-label="Breadcrumb" className="text-[0.9375rem] text-muted-foreground">
        <Link to="/wrap-gallery" className={cn('font-semibold text-foreground underline-offset-4 hover:underline', focusRing)}>
          Wrap gallery
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span>{vehicle}</span>
      </nav>

      <header className="mt-4 mb-6 max-w-3xl">
        <h1 className="flex items-start gap-3 font-heading text-[2rem] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance sm:text-[2.75rem]">
          <SignMarker category="fun" className="mt-2 size-7 sm:mt-3 sm:size-8" />
          <span>{title}</span>
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="min-w-0 space-y-6">
          <figure className="overflow-hidden rounded-xl border border-border bg-card">
            <img
              src={designImage(d, 'large')}
              srcSet={designSrcSet(d)}
              sizes="(min-width: 1024px) 760px, 100vw"
              width={d.width}
              height={d.height}
              alt={designAlt(d)}
              fetchPriority="high"
              decoding="async"
              className="w-full bg-muted"
            />
            <figcaption className="px-4 py-3 text-sm text-muted-foreground">
              AI-generated preview made with the MyAutoSpex Wrap Designer, not a photo of a real car. {madeBy(d)}, {longDate(d.created)}.
            </figcaption>
          </figure>

          <Panel>
            <PanelTitle>Wrap details</PanelTitle>
            <FactList
              className="mt-3"
              items={[
                ['Vehicle', vehicle],
                ['Coverage', `${coverageLabel(d.coverage)} (${(COVERAGE.find((c) => c.id === d.coverage)?.detail ?? '').toLowerCase()})`],
                ['Finish', finishLabel(d.finish)],
                [
                  'Color',
                  <span key="color" className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block size-4 rounded-full border border-black/15"
                      style={{ background: d.color.hex.length === 2 ? `linear-gradient(135deg, ${d.color.hex[0]} 45%, ${d.color.hex[1]} 55%)` : d.color.hex[0] }}
                    />
                    {d.color.name} ({d.color.hex.join(' to ')})
                  </span>,
                ],
                ['Extras', extras.length ? extras.join(', ') : 'None'],
              ]}
            />
          </Panel>

          <Panel>
            <PanelTitle>How do you look after a {finishLabel(d.finish).toLowerCase()} wrap?</PanelTitle>
            <p className="mt-3 text-[0.9375rem]">{CARE[d.finish]}</p>
            <p className="mt-3 text-[0.9375rem]">
              For what this wrap would cost on your car, how much film it needs and how long it lasts, use the{' '}
              <Link to="/wrap-designer" className={linkClass}>
                Wrap Designer's cost estimate
              </Link>
              .
            </p>
          </Panel>

          <Panel id="use-this-image">
            <PanelTitle>Use this image</PanelTitle>
            <p className="mt-3 text-[0.9375rem]">
              Free to use on your site, blog or social posts under the{' '}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                CC BY 4.0
              </a>{' '}
              license: keep the credit line with a link to this page, and say it is an AI preview.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
              <code>{credit}</code>
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={credit} label="Copy credit line" />
              <a
                href={designImage(d, 'large')}
                download={`${d.slug}.webp`}
                className={cn('inline-flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3.5 text-sm font-semibold hover:bg-muted', focusRing)}
              >
                <Download aria-hidden="true" className="size-4" />
                WebP, 1200 px
              </a>
              <a
                href={designImage(d, 'share')}
                download={`${d.slug}.jpg`}
                className={cn('inline-flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3.5 text-sm font-semibold hover:bg-muted', focusRing)}
              >
                <Download aria-hidden="true" className="size-4" />
                JPEG, 1200 px
              </a>
            </div>
          </Panel>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <PanelTitle>Try this wrap on your car</PanelTitle>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">
              Opens the Wrap Designer with this finish, color and coverage chosen. Add a photo of your own car, or keep the {vehicle}.
            </p>
            <Link
              to={tryHref(d)}
              rel="nofollow"
              className={cn('mt-4 flex h-11 items-center justify-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong', focusRing)}
            >
              Try this design
            </Link>
          </Panel>
          <Panel>
            <PanelTitle>Share</PanelTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={pin}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={cn('inline-flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3.5 text-sm font-semibold hover:bg-muted', focusRing)}
              >
                Save to Pinterest
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
              <CopyButton text={pageUrl} label="Copy link" />
            </div>
          </Panel>
          <Panel>
            <PanelTitle>More wrap ideas</PanelTitle>
            <ul className="mt-3 space-y-2 text-[0.9375rem]">
              <li>
                <Link to="/wrap-gallery" className={linkClass}>
                  The full wrap gallery
                </Link>
              </li>
              <li>
                <Link to="/wrap-designer" className={linkClass}>
                  Wrap Designer: cost, film and shops near you
                </Link>
              </li>
            </ul>
          </Panel>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-designs" className="mt-10">
          <h2 id="related-designs" className="font-heading text-2xl font-extrabold">
            Similar wraps
          </h2>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <DesignCard key={r.slug} d={r} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default WrapDesignPage;
