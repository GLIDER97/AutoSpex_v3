// /cars/:make/:model/:year — a vehicle report built from the weekly NHTSA and EPA snapshot (data/vehicles/).
// Every number on the page is computed from that snapshot and links to its official source.
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SITE_URL } from '../seo/site';
import { codePage } from '../data/codePages';
import {
  COMPONENT_CODE_GUIDES,
  componentName,
  num,
  findVehicle,
  otherYears,
  uniqueMpg,
  vehicleCsvPath,
  vehicleDescription,
  vehicleSeoTitle,
  vehicleName,
  vehiclePath,
  type VehicleData,
} from '../data/vehicles';
import NotFound from './NotFound';
import SEO from './SEO';
import { SignMarker } from './brand';
import { Notice, Panel, PanelTitle, focusRing } from './tool/kit';

const linkClass = cn('font-semibold underline underline-offset-4', focusRing);
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1 underline underline-offset-4', focusRing)}>
      {children}
      <ExternalLink aria-hidden="true" className="size-3.5" />
    </a>
  );
}

function KeyNumber({ value, label, source }: { value: string; label: React.ReactNode; source: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-3">
      <dt className="text-[0.9375rem]">{label}</dt>
      <dd className="mt-0.5 font-heading text-3xl font-extrabold tracking-tight">{value}</dd>
      <dd className="mt-1 text-sm text-muted-foreground">{source}</dd>
    </div>
  );
}

const starText = (r: string) => (/^\d$/.test(r) ? `${r} stars` : r || 'Not rated');

const VehiclePage: React.FC = () => {
  const { make = '', model = '', year = '' } = useParams<{ make: string; model: string; year: string }>();
  const v = findVehicle(make, model, year);
  if (!v) return <NotFound />;

  const name = vehicleName(v);
  const shortName = `${v.make} ${v.model}`;
  const asOf = longDate(v.asOf);
  const c = v.complaints;
  const components = c.byComponent.filter((x) => x.component !== 'UNKNOWN OR OTHER');
  const top = components[0];
  const chart = c.byComponent.slice(0, 10);
  const chartMax = Math.max(1, ...chart.map((x) => x.count));
  const years = c.byFiledYear;
  const yearsMax = Math.max(1, ...years.map((x) => x.count));
  const currentYear = Number(v.asOf.slice(0, 4));
  const fullYears = years.filter((y) => y.year < currentYear);
  const lastFull = fullYears[fullYears.length - 1];
  const peak = years.reduce((a, b) => (b.count > a.count ? b : a), years[0] ?? { year: 0, count: 0 });
  const mpg = uniqueMpg(v.mpg);
  const mpgLow = mpg.length ? Math.min(...mpg.map((m) => m.combined)) : 0;
  const mpgHigh = mpg.length ? Math.max(...mpg.map((m) => m.combined)) : 0;
  const overall = [...new Set(v.ratings.map((r) => r.overall))];
  const guides = [...new Set(components.slice(0, 4).flatMap((x) => COMPONENT_CODE_GUIDES[x.component] ?? []))]
    .map((code) => codePage(code))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const siblings = otherYears(v);
  const url = `${SITE_URL}${vehiclePath(v)}`;

  return (
    <div className="w-full max-w-6xl">
      <SEO title={vehicleSeoTitle(v)} description={vehicleDescription(v)} />

      <nav aria-label="Breadcrumb" className="text-[0.9375rem] text-muted-foreground">
        <Link to="/recalls" className={cn('font-semibold text-foreground underline-offset-4 hover:underline', focusRing)}>
          Recalls and vehicle reports
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span>{name}</span>
      </nav>

      <header className="mt-4 mb-8 max-w-3xl">
        <h1 className="flex items-start gap-3 font-heading text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl">
          <SignMarker category="warnings" className="mt-2 size-7 sm:mt-3 sm:size-8" />
          <span>{name}: problems, recalls and safety ratings</span>
        </h1>
        <p className="mt-4 max-w-[62ch] text-lg leading-relaxed">
          What owners report to the federal safety regulator (NHTSA), every recall, the government crash-test ratings and
          the EPA fuel economy for the {name}, counted from the official data.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Data as of {asOf}
          {' · '}
          Analysis by the{' '}
          <Link to="/editorial-policy" className={cn('underline underline-offset-4', focusRing)}>
            MyAutoSpex Editorial Team
          </Link>
        </p>
      </header>

      <Panel aria-labelledby="key-numbers">
        <PanelTitle>
          <span id="key-numbers">Key numbers</span>
        </PanelTitle>
        <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <KeyNumber
            value={num(c.total)}
            label="Owner complaints filed with NHTSA"
            source={<Source href={v.sources.complaints}>NHTSA complaints, {asOf}</Source>}
          />
          {top && (
            <KeyNumber
              value={`${pct(top.count, c.total)}%`}
              label={<>Share of complaints involving the {componentName(top.component).toLowerCase()} ({num(top.count)})</>}
              source={<Source href={v.sources.complaints}>NHTSA complaints, {asOf}</Source>}
            />
          )}
          {lastFull && (
            <KeyNumber
              value={num(lastFull.count)}
              label={<>Complaints filed in {lastFull.year} alone</>}
              source={<Source href={v.sources.complaints}>NHTSA complaints by filing date</Source>}
            />
          )}
          <KeyNumber
            value={num(v.recalls.length)}
            label={`Safety recall${v.recalls.length === 1 ? '' : 's'}`}
            source={<Source href={v.sources.recalls}>NHTSA recalls, {asOf}</Source>}
          />
          {overall.length > 0 && (
            <KeyNumber
              value={overall.map(starText).join(' / ')}
              label="NHTSA overall crash rating"
              source={<Source href={v.sources.nhtsaPage}>NHTSA 5-Star Safety Ratings</Source>}
            />
          )}
          {mpg.length > 0 && (
            <KeyNumber
              value={mpgLow === mpgHigh ? `${mpgLow} mpg` : `${mpgLow}–${mpgHigh} mpg`}
              label="EPA combined fuel economy, by version"
              source={<Source href={v.sources.epa}>fueleconomy.gov</Source>}
            />
          )}
        </dl>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="min-w-0 space-y-6">
          <Panel>
            <PanelTitle>What do {name} owners complain about most?</PanelTitle>
            <p className="mt-3 text-[0.9375rem]">
              {top ? (
                <>
                  The {componentName(top.component).toLowerCase()}: {num(top.count)} of the {num(c.total)} complaints owners filed with
                  NHTSA ({pct(top.count, c.total)}%) name it.
                  {components[1] && (
                    <>
                      {' '}
                      Next are the {componentName(components[1].component).toLowerCase()} ({num(components[1].count)})
                      {components[2] && (
                        <>
                          {' '}
                          and the {componentName(components[2].component).toLowerCase()} ({num(components[2].count)})
                        </>
                      )}
                      .
                    </>
                  )}
                </>
              ) : (
                <>Owners have filed {num(c.total)} complaints with NHTSA.</>
              )}
            </p>
            <figure className="mt-5">
              <figcaption className="text-sm font-semibold">Complaints by area of the car (top {chart.length})</figcaption>
              <ul className="mt-3 space-y-2.5">
                {chart.map((x) => (
                  <li key={x.component} className="grid grid-cols-[minmax(0,10rem)_1fr] sm:grid-cols-[minmax(0,14rem)_1fr] items-center gap-3 text-[0.9375rem]">
                    <span title={x.component}>
                      {componentName(x.component)}
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-4 rounded-sm bg-sign-yellow"
                        style={{ width: `${Math.max(2, (x.count / chartMax) * 100)}%` }}
                      />
                      <span className="shrink-0 tabular-nums">{num(x.count)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                One complaint can name more than one area, so the counts add up to more than {num(c.total)}. Source:{' '}
                <Source href={v.sources.complaints}>NHTSA complaints API</Source>, {asOf}.
              </p>
            </figure>
            <p className="mt-4 text-[0.9375rem]">
              Complaints also report {num(c.crashes)} crash{c.crashes === 1 ? '' : 'es'}, {num(c.fires)} fire{c.fires === 1 ? '' : 's'},{' '}
              {num(c.injuries)} injur{c.injuries === 1 ? 'y' : 'ies'} and {num(c.deaths)} death{c.deaths === 1 ? '' : 's'}. These are what owners
              reported to NHTSA, not confirmed defects.
            </p>
          </Panel>

          {years.length > 1 && (
            <Panel>
              <PanelTitle>Are complaints about the {name} still coming in?</PanelTitle>
              <p className="mt-3 text-[0.9375rem]">
                {lastFull ? (
                  <>
                    Yes: owners filed {num(lastFull.count)} complaints in {lastFull.year}
                    {peak && peak.year !== lastFull.year ? <>, with the most in {peak.year} ({num(peak.count)})</> : <>, the most of any year</>}.
                    {years[years.length - 1].year === currentYear && (
                      <>
                        {' '}
                        {num(years[years.length - 1].count)} more were filed in {currentYear} up to {asOf}.
                      </>
                    )}
                  </>
                ) : (
                  <>Complaints by the year they were filed are below.</>
                )}
              </p>
              <figure className="mt-5">
                <figcaption className="text-sm font-semibold">Complaints filed per year</figcaption>
                <div className="mt-3 flex h-44 items-end gap-1.5 border-b border-border" role="list">
                  {years.map((y) => (
                    <div key={y.year} role="listitem" className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-xs tabular-nums">{num(y.count)}</span>
                      <span
                        aria-hidden="true"
                        className={cn('w-full rounded-t-sm', y.year === currentYear ? 'bg-sign-yellow/50' : 'bg-sign-yellow')}
                        style={{ height: `${Math.max(2, (y.count / yearsMax) * 100)}%` }}
                      />
                      <span className="sr-only">filed in {y.year}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex gap-1.5" aria-hidden="true">
                  {years.map((y) => (
                    <span key={y.year} className="min-w-0 flex-1 text-center text-xs text-muted-foreground">
                      {`'${String(y.year).slice(2)}`}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {currentYear} is a partial year (to {asOf}). Source: <Source href={v.sources.complaints}>NHTSA complaints API</Source>.
                </p>
              </figure>
            </Panel>
          )}

          <Panel>
            <PanelTitle>What recalls does the {name} have?</PanelTitle>
            <p className="mt-3 text-[0.9375rem]">
              {v.recalls.length === 0 ? (
                <>NHTSA lists no recalls for the {name}.</>
              ) : (
                <>
                  NHTSA lists {v.recalls.length} recall{v.recalls.length === 1 ? '' : 's'} for the {name}. Not every recall covers every car, so
                  check your own vehicle by its VIN.
                </>
              )}
            </p>
            {v.recalls.some((r) => r.parkIt || r.parkOutside) && (
              <Notice tone="error" className="mt-4" title="Safety warning">
                At least one recall tells owners to {v.recalls.some((r) => r.parkIt) ? 'stop driving the car' : 'park outside'} until it is repaired.
              </Notice>
            )}
            <ol className="mt-4 space-y-5">
              {v.recalls.map((r) => (
                <li key={r.campaign} className="border-t border-border pt-4">
                  <p className="font-semibold">
                    {r.component.split(':').map((part) => componentName(part.trim())).join(' › ')}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    NHTSA campaign {r.campaign}
                    {r.date && <>{' · '}reported {longDate(r.date)}</>}
                  </p>
                  <p className="mt-2 text-[0.9375rem]">{r.summary}</p>
                  {r.consequence && (
                    <p className="mt-2 text-[0.9375rem]">
                      <strong>Risk:</strong> {r.consequence}
                    </p>
                  )}
                  {r.remedy && (
                    <p className="mt-2 text-[0.9375rem]">
                      <strong>Fix:</strong> {r.remedy}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              Source: <Source href={v.sources.recalls}>NHTSA recalls API</Source>, {asOf}.
            </p>
          </Panel>

          {v.ratings.length > 0 && (
            <Panel>
              <PanelTitle>How safe is the {name} in crash tests?</PanelTitle>
              <p className="mt-3 text-[0.9375rem]">
                {overall.length === 1 && /^\d$/.test(overall[0]) ? (
                  <>
                    NHTSA gives the {name} {overall[0]} out of 5 stars overall
                    {v.ratings.length > 1 ? <> in every version it tested ({v.ratings.length})</> : null}.
                  </>
                ) : (
                  <>NHTSA's ratings for each version it tested are below.</>
                )}
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-[0.9375rem]">
                  <thead className="text-sm text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Version</th>
                      <th className="py-2 pr-4 font-semibold">Overall</th>
                      <th className="py-2 pr-4 font-semibold">Frontal</th>
                      <th className="py-2 pr-4 font-semibold">Side</th>
                      <th className="py-2 pr-4 font-semibold">Rollover</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.ratings.map((r) => (
                      <tr key={r.vehicle} className="border-t border-border">
                        <td className="py-2 pr-4">{r.vehicle.replace(`${name} `, '')}</td>
                        <td className="py-2 pr-4">{starText(r.overall)}</td>
                        <td className="py-2 pr-4">{starText(r.frontal)}</td>
                        <td className="py-2 pr-4">{starText(r.side)}</td>
                        <td className="py-2 pr-4">
                          {starText(r.rollover)}
                          {r.rolloverRisk ? <> ({Math.round(r.rolloverRisk * 1000) / 10}% risk)</> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Rollover risk is NHTSA's estimated chance of a rollover in a single-vehicle crash. Source:{' '}
                <Source href={v.sources.nhtsaPage}>NHTSA 5-Star Safety Ratings</Source>.
              </p>
            </Panel>
          )}

          {mpg.length > 0 && (
            <Panel>
              <PanelTitle>What gas mileage does the {name} get?</PanelTitle>
              <p className="mt-3 text-[0.9375rem]">
                {mpgLow === mpgHigh ? (
                  <>The EPA rates the {name} at {mpgLow} mpg combined.</>
                ) : (
                  <>
                    Between {mpgLow} and {mpgHigh} mpg combined, depending on the engine and drive: the{' '}
                    {mpg[0].engine.split(', ').slice(1).join(', ')} {mpg[0].drive.toLowerCase()} version is the most efficient.
                  </>
                )}
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-[0.9375rem]">
                  <thead className="text-sm text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Engine and transmission</th>
                      <th className="py-2 pr-4 font-semibold">Drive</th>
                      <th className="py-2 pr-4 font-semibold">City</th>
                      <th className="py-2 pr-4 font-semibold">Highway</th>
                      <th className="py-2 pr-4 font-semibold">Combined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mpg.map((m) => (
                      <tr key={m.epaId} className="border-t border-border">
                        <td className="py-2 pr-4">{m.engine}</td>
                        <td className="py-2 pr-4">{m.drive}</td>
                        <td className="py-2 pr-4 tabular-nums">{m.city}</td>
                        <td className="py-2 pr-4 tabular-nums">{m.highway}</td>
                        <td className="py-2 pr-4 font-semibold tabular-nums">{m.combined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Miles per gallon. Source: <Source href={v.sources.epa}>EPA, fueleconomy.gov</Source>. Work out your own fuel costs with the{' '}
                <Link to="/mpg-calculator" className="underline underline-offset-4">
                  MPG calculator
                </Link>
                .
              </p>
            </Panel>
          )}

          <Panel>
            <PanelTitle>How was this report made?</PanelTitle>
            <p className="mt-3 text-[0.9375rem]">
              We downloaded every complaint NHTSA holds for the {name} through its public API on {asOf}, then counted them by the
              components owners selected and by the year each complaint was filed. We kept only the counts, never the complaint text
              or VINs. Recalls and crash ratings come from NHTSA's recall and 5-Star Safety Ratings APIs, and fuel economy from the
              EPA's fueleconomy.gov web service. The data is refreshed weekly.
            </p>
            <p className="mt-4">
              <a
                href={vehicleCsvPath(v)}
                download
                className={cn('inline-flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-4 font-semibold hover:bg-muted', focusRing)}
              >
                <Download aria-hidden="true" className="size-4" />
                Download the data (CSV)
              </a>
            </p>
            <div className="mt-5 rounded-lg bg-muted p-4 text-[0.9375rem]">
              <p className="font-semibold">How to cite this</p>
              <p className="mt-1">
                Source: MyAutoSpex analysis of NHTSA complaint, recall and crash-rating data and EPA fuel economy data, updated {asOf},{' '}
                {url}
              </p>
            </div>
          </Panel>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Panel>
            <PanelTitle>Is there an open recall on your {shortName}?</PanelTitle>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">
              Recalls apply to specific cars. Check yours by its 17-character VIN for open recalls, specs and owner complaints.
            </p>
            <Link
              to="/vin-lookup"
              className={cn('mt-4 flex h-11 items-center justify-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong', focusRing)}
            >
              Check my VIN
            </Link>
            <Link to="/recalls" className={cn('mt-3 block text-center text-[0.9375rem]', linkClass)}>
              Or check recalls by year, make and model
            </Link>
          </Panel>

          {guides.length > 0 && (
            <Panel>
              <PanelTitle>Check engine light on?</PanelTitle>
              <p className="mt-1 text-[0.9375rem] text-muted-foreground">Guides to codes in the areas owners report most:</p>
              <ul className="mt-3 space-y-2 text-[0.9375rem]">
                {guides.map((g) => (
                  <li key={g.code}>
                    <Link to={`/codes/${g.code.toLowerCase()}`} className={linkClass}>
                      {g.code}: {g.shortName}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/fault-code-decoder" className={cn('mt-3 block text-[0.9375rem]', linkClass)}>
                Look up any code
              </Link>
            </Panel>
          )}

          <Panel>
            <PanelTitle>Facing a repair bill?</PanelTitle>
            <ul className="mt-3 space-y-2 text-[0.9375rem]">
              <li>
                <Link to="/maintenance-validator" className={linkClass}>
                  Check a repair quote
                </Link>
              </li>
              <li>
                <Link to="/ownership-calculator" className={linkClass}>
                  Total cost of owning a car
                </Link>
              </li>
              <li>
                <Link to="/value-shock-calculator" className={linkClass}>
                  How much value a car loses
                </Link>
              </li>
            </ul>
          </Panel>

          {siblings.length > 0 && (
            <Panel>
              <PanelTitle>Other {shortName} years</PanelTitle>
              <ul className="mt-3 space-y-2 text-[0.9375rem]">
                {siblings.map((s) => (
                  <li key={s.year}>
                    <Link to={vehiclePath(s)} className={linkClass}>
                      {vehicleName(s)}: {num(s.complaints.total)} complaints, {s.recalls.length} recall{s.recalls.length === 1 ? '' : 's'}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
};

export default VehiclePage;
