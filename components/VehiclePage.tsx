// /cars/:make/:model/:year — a vehicle report built from the weekly NHTSA and EPA snapshot (data/vehicles/).
// Every number on the page is computed from that snapshot and links to its official source.
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CarFront, Download, ExternalLink, Flame, HeartPulse, TriangleAlert } from 'lucide-react';
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
import { BarList, ColumnChart, MeterList, StatTile, Stars, Timeline } from './tool/charts';

const DRIVE: Record<string, string> = {
  'Front-Wheel Drive': 'FWD',
  'All-Wheel Drive': 'AWD',
  'Rear-Wheel Drive': 'RWD',
  '4-Wheel Drive': '4WD',
  '4-Wheel or All-Wheel Drive': '4WD/AWD',
  'Part-time 4-Wheel Drive': 'part-time 4WD',
};

const linkClass = cn('font-semibold underline underline-offset-4', focusRing);
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-1 underline underline-offset-4', focusRing)}
    >
      {children}
      <ExternalLink aria-hidden="true" className="size-3.5" />
    </a>
  );
}

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
  const chart = c.byComponent.slice(0, 8);
  const years = c.byFiledYear;
  const currentYear = Number(v.asOf.slice(0, 4));
  const fullYears = years.filter((y) => y.year < currentYear);
  const lastFull = fullYears[fullYears.length - 1];
  const peak = years.reduce((a, b) => (b.count > a.count ? b : a), years[0] ?? { year: 0, count: 0 });
  const mpg = uniqueMpg(v.mpg);
  const mpgLabel = (m: (typeof mpg)[number]) =>
    `${m.engine.split(', ').slice(2).join(' ').replace('Turbo', 'turbo')}, ${DRIVE[m.drive] ?? m.drive}`;
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
          What owners report to the federal safety regulator (NHTSA), every recall, the government crash-test ratings and the EPA fuel
          economy for the {name}, counted from the official data.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Data as of {asOf}
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
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
          <StatTile value={num(c.total)} label="Owner complaints filed with NHTSA">
            <Source href={v.sources.complaints}>NHTSA complaints, {asOf}</Source>
          </StatTile>
          {top && (
            <StatTile
              value={`${pct(top.count, c.total)}%`}
              label={
                <>
                  Share of complaints involving the {componentName(top.component).toLowerCase()} ({num(top.count)})
                </>
              }
            >
              <Source href={v.sources.complaints}>NHTSA complaints, {asOf}</Source>
            </StatTile>
          )}
          {lastFull && (
            <StatTile
              value={num(lastFull.count)}
              label={<>Complaints filed in {lastFull.year} alone</>}
              trend={fullYears.map((y) => y.count)}
              trendLabel={`Complaints filed per year, ${fullYears[0]?.year} to ${lastFull.year}`}
            >
              <Source href={v.sources.complaints}>NHTSA complaints by filing date</Source>
            </StatTile>
          )}
          <StatTile value={num(v.recalls.length)} label={`Safety recall${v.recalls.length === 1 ? '' : 's'}`}>
            <Source href={v.sources.recalls}>NHTSA recalls, {asOf}</Source>
          </StatTile>
          {overall.length > 0 && (
            <StatTile
              value={overall.length === 1 && /^\d$/.test(overall[0]) ? <Stars rating={overall[0]} /> : overall.join(' / ')}
              label="NHTSA overall crash rating"
            >
              <Source href={v.sources.nhtsaPage}>NHTSA 5-Star Safety Ratings</Source>
            </StatTile>
          )}
          {mpg.length > 0 && (
            <StatTile
              value={mpgLow === mpgHigh ? `${mpgLow} mpg` : `${mpgLow}–${mpgHigh} mpg`}
              label="EPA combined fuel economy, by version"
            >
              <Source href={v.sources.epa}>fueleconomy.gov</Source>
            </StatTile>
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
              <figcaption className="text-sm font-semibold">
                Share of all {num(c.total)} complaints that name each area (top {chart.length})
              </figcaption>
              <div className="mt-4">
                <MeterList
                  items={chart.map((x) => ({
                    label: componentName(x.component),
                    value: x.count,
                  }))}
                  total={c.total}
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                One complaint can name more than one area, so the shares add up to more than 100%. Source:{' '}
                <Source href={v.sources.complaints}>NHTSA complaints API</Source>, {asOf}.
              </p>
            </figure>
            <h3 className="mt-6 text-[0.9375rem] font-semibold">What owners reported happening</h3>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  icon: CarFront,
                  label: 'Crashes',
                  value: c.crashes,
                },
                { icon: Flame, label: 'Fires', value: c.fires },
                {
                  icon: HeartPulse,
                  label: 'Injuries',
                  value: c.injuries,
                },
                {
                  icon: TriangleAlert,
                  label: 'Deaths',
                  value: c.deaths,
                },
              ].map((x) => (
                <li key={x.label} className="rounded-lg border border-border p-3">
                  <x.icon aria-hidden="true" className="size-5 text-muted-foreground" />
                  <p className="mt-2 font-heading text-2xl font-extrabold">{num(x.value)}</p>
                  <p className="text-sm text-muted-foreground">{x.label}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">These are what owners reported in their complaints, not confirmed defects.</p>
          </Panel>

          {years.length > 1 && (
            <Panel>
              <PanelTitle>Are complaints about the {name} still coming in?</PanelTitle>
              <p className="mt-3 text-[0.9375rem]">
                {lastFull ? (
                  <>
                    Yes: owners filed {num(lastFull.count)} complaints in {lastFull.year}
                    {peak && peak.year !== lastFull.year ? (
                      <>
                        , with the most in {peak.year} ({num(peak.count)})
                      </>
                    ) : (
                      <>, the most of any year</>
                    )}
                    .
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
              <div className="mt-5">
                <ColumnChart
                  title={`Complaints about the ${name} filed with NHTSA per year`}
                  valueName="complaints"
                  periods={years.map((y) => ({
                    label: String(y.year),
                    value: y.count,
                    partial: y.year === currentYear,
                  }))}
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Source: <Source href={v.sources.complaints}>NHTSA complaints API</Source>, by the date each complaint was filed, to {asOf}.
              </p>
            </Panel>
          )}

          <Panel>
            <PanelTitle>What recalls does the {name} have?</PanelTitle>
            <p className="mt-3 text-[0.9375rem]">
              {v.recalls.length === 0 ? (
                <>NHTSA lists no recalls for the {name}.</>
              ) : (
                <>
                  NHTSA lists {v.recalls.length} recall
                  {v.recalls.length === 1 ? '' : 's'} for the {name}. Not every recall covers every car, so check your own vehicle by its
                  VIN.
                </>
              )}
            </p>
            {v.recalls.some((r) => r.parkIt || r.parkOutside) && (
              <Notice tone="error" className="mt-4" title="Safety warning">
                At least one recall tells owners to {v.recalls.some((r) => r.parkIt) ? 'stop driving the car' : 'park outside'} until it is
                repaired.
              </Notice>
            )}
            {v.recalls.some((r) => r.date) && (
              <div className="mt-6">
                <Timeline
                  title={`${name} recalls by the date NHTSA received them`}
                  from={Math.min(v.year - 1, ...v.recalls.filter((r) => r.date).map((r) => Number(r.date!.slice(0, 4))))}
                  to={currentYear}
                  events={v.recalls
                    .filter((r) => r.date)
                    .map((r) => ({
                      date: r.date!,
                      label: r.component,
                    }))}
                />
              </div>
            )}
            <ol className="mt-4 space-y-5">
              {v.recalls.map((r, i) => (
                <li key={r.campaign} className="border-t border-border pt-4">
                  <p className="flex items-start gap-3 font-semibold">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--chart-1)] text-xs font-bold"
                    >
                      {i + 1}
                    </span>
                    <span>
                      {r.component
                        .split(':')
                        .map((part) => componentName(part.trim()))
                        .join(' › ')}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    NHTSA campaign {r.campaign}
                    {r.date && (
                      <>
                        <span aria-hidden="true" className="mx-1.5">
                          ·
                        </span>
                        reported {longDate(r.date)}
                      </>
                    )}
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
                <table className="w-full min-w-[36rem] text-left text-[0.9375rem]">
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
                        <td className="py-2 pr-4">
                          <Stars rating={r.overall} />
                        </td>
                        <td className="py-2 pr-4">
                          <Stars rating={r.frontal} />
                        </td>
                        <td className="py-2 pr-4">
                          <Stars rating={r.side} />
                        </td>
                        <td className="py-2 pr-4">
                          <Stars rating={r.rollover} />
                          {r.rolloverRisk ? (
                            <span className="block text-sm text-muted-foreground">
                              {Math.round(r.rolloverRisk * 1000) / 10}% rollover risk
                            </span>
                          ) : null}
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
                  <>
                    The EPA rates the {name} at {mpgLow} mpg combined.
                  </>
                ) : (
                  <>
                    Between {mpgLow} and {mpgHigh} mpg combined, depending on the engine and drive: the{' '}
                    {mpgLabel(mpg[0])} version is the most efficient.
                  </>
                )}
              </p>
              <figure className="mt-5">
                <figcaption className="text-sm font-semibold">EPA combined MPG by engine and drive</figcaption>
                <div className="mt-3">
                  <BarList
                    items={mpg.map((m) => ({
                      label: mpgLabel(m),
                      value: m.combined,
                    }))}
                    format={(n) => `${n} mpg`}
                  />
                </div>
              </figure>
              <details className="mt-4">
                <summary
                  className={cn(
                    'cursor-pointer text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground',
                    focusRing,
                  )}
                >
                  City and highway figures
                </summary>
                <div className="mt-3 overflow-x-auto">
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
              </details>
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
              We downloaded every complaint NHTSA holds for the {name} through its public API on {asOf}, then counted them by the components
              owners selected and by the year each complaint was filed. We kept only the counts, never the complaint text or VINs. Recalls
              and crash ratings come from NHTSA's recall and 5-Star Safety Ratings APIs, and fuel economy from the EPA's fueleconomy.gov web
              service. The data is refreshed weekly.
            </p>
            <p className="mt-4">
              <a
                href={vehicleCsvPath(v)}
                download
                className={cn(
                  'inline-flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-4 font-semibold hover:bg-muted',
                  focusRing,
                )}
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
              className={cn(
                'mt-4 flex h-11 items-center justify-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong',
                focusRing,
              )}
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
                      {vehicleName(s)}: {num(s.complaints.total)} complaints, {s.recalls.length} recall
                      {s.recalls.length === 1 ? '' : 's'}
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
