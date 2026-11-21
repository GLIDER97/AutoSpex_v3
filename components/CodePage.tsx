// /codes/:code — a reviewed reference page for one OBD-II code (data/codePages.ts).
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CODE_PAGES, codePage } from '../data/codePages';
import NotFound from './NotFound';
import SEO from './SEO';
import { SignMarker } from './brand';
import { Faq, Notice, Panel, PanelTitle, Verdict, focusRing } from './tool/kit';

const VERDICT_LABEL = { go: 'Safe to drive', caution: 'Drive with caution', stop: 'Get it checked now' } as const;

// Codes with their own guide elsewhere on the site.
const GUIDES: Record<string, string> = { P0420: '/article/p0420-code-catalytic-converter-sensor-guide' };

const linkClass = cn('font-semibold underline underline-offset-4', focusRing);

// The decoder runs a paid AI lookup for ?codes=, so crawlers are asked not to follow these links
// (robots.txt also disallows /fault-code-decoder? URLs).
const decoderHref = (code: string) => `/fault-code-decoder?codes=${code}`;

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

const CodePage: React.FC = () => {
  const { code = '' } = useParams<{ code: string }>();
  const page = codePage(code);
  if (!page) return <NotFound />;

  const others = CODE_PAGES.filter((p) => p.code !== page.code);
  const reviewed = new Date(`${page.reviewed}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

  return (
    <div className="w-full max-w-6xl">
      <SEO title={page.seoTitle} description={page.description} />

      <nav aria-label="Breadcrumb" className="text-[0.9375rem] text-muted-foreground">
        <Link to="/codes" className={cn('font-semibold text-foreground underline-offset-4 hover:underline', focusRing)}>
          Check engine codes
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span>{page.code}</span>
      </nav>

      <header className="mt-4 mb-8 max-w-3xl">
        <h1 className="flex items-start gap-3 font-heading text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl">
          <SignMarker category="warnings" className="mt-2 size-7 sm:mt-3 sm:size-8" />
          <span>
            {page.code} code: {/^[A-Z][a-z]/.test(page.shortName) ? page.shortName.charAt(0).toLowerCase() + page.shortName.slice(1) : page.shortName}
          </span>
        </h1>
        <p className="mt-3 font-semibold text-muted-foreground">Standard definition: {page.title}</p>
        <p className="mt-4 max-w-[62ch] text-lg leading-relaxed">{page.summary}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {page.system} · Reviewed {reviewed} by the{' '}
          <Link to="/editorial-policy" className={cn('underline underline-offset-4', focusRing)}>
            MyAutoSpex Editorial Team
          </Link>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="min-w-0 space-y-6">
          <Panel>
            <div className="flex flex-wrap items-center gap-3">
              <PanelTitle>Can you drive with {page.code}?</PanelTitle>
              <Verdict tone={page.drive.verdict === 'go' ? 'go' : page.drive.verdict}>{VERDICT_LABEL[page.drive.verdict]}</Verdict>
            </div>
            <p className="mt-3 text-[0.9375rem]">{page.drive.text}</p>
          </Panel>

          <Panel>
            <PanelTitle>Symptoms</PanelTitle>
            <List items={page.symptoms} />
          </Panel>

          <Panel>
            <PanelTitle>Common causes</PanelTitle>
            <p className="mt-1 text-sm text-muted-foreground">Most common first.</p>
            <List items={page.causes} />
            {page.misdiagnoses.length > 0 && (
              <Notice tone="warning" className="mt-4" title="Often replaced without fixing it">
                {page.misdiagnoses.join(', ')}.
              </Notice>
            )}
          </Panel>

          <Panel>
            <PanelTitle>What to check first</PanelTitle>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[0.9375rem]">
              {page.checks.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
          </Panel>

          <Panel>
            <PanelTitle>How the computer sets {page.code}</PanelTitle>
            <p className="mt-3 text-[0.9375rem]">{page.howItSets}</p>
          </Panel>

          <Panel>
            <PanelTitle>What the repair costs depend on</PanelTitle>
            <List items={page.costDrivers} />
            <p className="mt-4 text-[0.9375rem]">
              For a cost estimate for your car, look up {page.code} with your year, make and model in the{' '}
              <a href={decoderHref(page.code)} rel="nofollow" className={linkClass}>
                check engine code lookup
              </a>
              , then check any quote you get with the{' '}
              <Link to="/maintenance-validator" className={linkClass}>
                repair quote checker
              </Link>
              .
            </p>
          </Panel>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <PanelTitle>Get answers for your car</PanelTitle>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">
              Causes differ by engine. Add your year, make and model for the likely causes, costs and owner complaints on your model.
            </p>
            <a
              href={decoderHref(page.code)}
              rel="nofollow"
              className={cn('mt-4 flex h-11 items-center justify-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong', focusRing)}
            >
              Look up {page.code} for my car
            </a>
          </Panel>

          <Panel>
            <PanelTitle>Related codes</PanelTitle>
            <ul className="mt-3 space-y-3 text-[0.9375rem]">
              {page.related.map((r) => {
                const own = CODE_PAGES.some((p) => p.code === r.code);
                const href = own ? `/codes/${r.code.toLowerCase()}` : GUIDES[r.code];
                return (
                  <li key={r.code}>
                    {href ? (
                      <Link to={href} className={linkClass}>
                        {r.code}
                      </Link>
                    ) : (
                      <a href={decoderHref(r.code)} rel="nofollow" className={linkClass}>
                        {r.code}
                      </a>
                    )}
                    <span className="text-muted-foreground"> · {r.note}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel>
            <PanelTitle>Sources</PanelTitle>
            <ul className="mt-3 space-y-2 text-[0.9375rem]">
              {page.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className={cn(linkClass, 'inline-flex items-center gap-1')}>
                    {s.label}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">General information, not a diagnosis. Have a qualified mechanic confirm the cause.</p>
          </Panel>
        </aside>
      </div>

      <Faq id="code-faq" title={`Questions about ${page.code}`} items={page.faqs} />

      {others.length > 0 && (
        <section aria-labelledby="more-codes" className="mt-16 max-w-3xl">
          <h2 id="more-codes" className="font-heading text-2xl font-extrabold">
            More code guides
          </h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {others.map((p) => (
              <li key={p.code} className="py-3">
                <Link to={`/codes/${p.code.toLowerCase()}`} className={linkClass}>
                  {p.code}: {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default CodePage;
