// /studies/suv-owner-complaints — data study: NHTSA owner complaints for 20 popular SUVs, model-years 2015-2022.
// Every number and sentence is computed from data/studies/suv-complaints.json; charts are drawn in code (docs/DATA-VIZ.md).
import React from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SITE_URL } from '../seo/site';
import { findVehicle, num, vehiclePath } from '../data/vehicles';
import {
  STUDY_AS_OF,
  STUDY_MODELS,
  STUDY_ROWS,
  STUDY_YEARS,
  SUV_STUDY_CSV,
  SUV_STUDY_DESCRIPTION,
  SUV_STUDY_TITLE,
  modelName,
  rowName,
  studyFacts,
} from '../data/studies';
import SEO from './SEO';
import { SignMarker } from './brand';
import { Notice, Panel, PanelTitle, focusRing } from './tool/kit';
import { BarList, ColumnChart, Heatmap, MeterList, StatTile } from './tool/charts';

const linkClass = cn('font-semibold underline underline-offset-4', focusRing);
const longDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '';
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

function Source({ children = 'NHTSA complaints API' }: { children?: React.ReactNode }) {
  return (
    <a href="https://www.nhtsa.gov/nhtsa-datasets-and-apis" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
      {children}
      <ExternalLink aria-hidden="true" className="size-3.5" />
    </a>
  );
}

const SuvComplaintsStudy: React.FC = () => {
  const f = studyFacts();
  const asOf = longDate(STUDY_AS_OF);
  const top = f.byModelYear[0];
  const topModel = f.byModel[0];
  const topArea = f.topComponents[0];
  const old = f.oldStill[0];
  const report = (r: { make: string; model: string; year: number }) => {
    const v = findVehicle(r.make, r.model, r.year);
    return v ? vehiclePath(v) : undefined;
  };
  const steps = [100, 250, 500, 1000];

  return (
    <div className="w-full max-w-6xl">
      <SEO title={SUV_STUDY_TITLE} description={SUV_STUDY_DESCRIPTION} />
      <nav aria-label="Breadcrumb" className="text-[0.9375rem] text-muted-foreground">
        <Link to="/cars" className={cn('font-semibold text-foreground underline-offset-4 hover:underline', focusRing)}>
          Vehicle reports
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span>Data study</span>
      </nav>

      <header className="mt-4 mb-8 max-w-3xl">
        <p className="text-sm font-bold tracking-wide text-muted-foreground uppercase">MyAutoSpex data study</p>
        <h1 className="mt-2 flex items-start gap-3 font-heading text-[2.1rem] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl">
          <SignMarker category="warnings" className="mt-2 size-7 sm:mt-3 sm:size-8" />
          <span>Which used SUVs get the most owner complaints?</span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed">
          We counted every complaint owners have filed with the federal safety regulator, NHTSA, about {STUDY_MODELS.length} of America&apos;s most popular
          SUVs, model-years {STUDY_YEARS[0]} to {STUDY_YEARS[STUDY_YEARS.length - 1]}: {num(f.total)} complaints across {f.rows.length} model-years.
          {top && (
            <>
              {' '}
              The {rowName(top)} tops the list with {num(top.complaints)}.
            </>
          )}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Data as of {asOf}
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          Analysis by the{' '}
          <Link to="/editorial-policy" className="underline underline-offset-4">
            MyAutoSpex Editorial Team
          </Link>
        </p>
      </header>

      <Panel aria-labelledby="study-key-numbers">
        <PanelTitle>
          <span id="study-key-numbers">Key numbers</span>
        </PanelTitle>
        <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile value={num(f.total)} label={`Owner complaints, ${f.rows.length} model-years`}>
            <Source>NHTSA, to {asOf}</Source>
          </StatTile>
          {top && (
            <StatTile value={num(top.complaints)} label={<>Most for one model-year: the {rowName(top)}</>}>
              <Source />
            </StatTile>
          )}
          {topArea && (
            <StatTile value={`${pct(topArea.count, f.total)}%`} label={<>of complaints name the {topArea.name.toLowerCase()}, the top problem area</>}>
              <Source />
            </StatTile>
          )}
          <StatTile value={num(f.fires)} label="Complaints reporting a fire">
            <Source />
          </StatTile>
        </dl>
      </Panel>

      <Notice tone="info" className="mt-6" title="Read this first">
        These are raw counts, not adjusted for how many of each SUV were sold, so best-sellers collect more complaints. A complaint is what an owner reported to
        NHTSA, not a confirmed defect. Use the numbers to see where problems cluster, then check a specific car by its VIN.
      </Notice>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle>Which model-years have the most complaints?</PanelTitle>
          {top && f.byModelYear[1] && (
            <p className="mt-3 text-[0.9375rem]">
              The {rowName(top)} ({num(top.complaints)}), then the {rowName(f.byModelYear[1])} ({num(f.byModelYear[1].complaints)})
              {f.byModelYear[2] && (
                <>
                  {' '}
                  and the {rowName(f.byModelYear[2])} ({num(f.byModelYear[2].complaints)})
                </>
              )}
              .
            </p>
          )}
          <figure className="mt-4">
            <figcaption className="sr-only">The 12 model-years with the most owner complaints</figcaption>
            <BarList items={f.byModelYear.slice(0, 12).map((r) => ({ label: rowName(r), value: r.complaints }))} format={num} />
          </figure>
          <p className="mt-3 text-sm text-muted-foreground">
            Top 12 of {f.rows.length}. Source: <Source />, to {asOf}.
          </p>
        </Panel>

        <Panel>
          <PanelTitle>Which models have the most complaints across all eight years?</PanelTitle>
          {topModel && (
            <p className="mt-3 text-[0.9375rem]">
              The {topModel.name}: {num(topModel.complaints)} complaints over {topModel.years} model-years, most for the {topModel.worst.year}.
            </p>
          )}
          <figure className="mt-4">
            <figcaption className="sr-only">Owner complaints per model, {STUDY_YEARS[0]} to {STUDY_YEARS[STUDY_YEARS.length - 1]} combined</figcaption>
            <BarList items={f.byModel.map((m) => ({ label: m.name, value: m.complaints }))} format={num} />
          </figure>
          <p className="mt-3 text-sm text-muted-foreground">
            Model-years {STUDY_YEARS[0]}–{STUDY_YEARS[STUDY_YEARS.length - 1]} combined. Source: <Source />.
          </p>
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelTitle>How do complaints compare by model and year?</PanelTitle>
        <p className="mt-3 text-[0.9375rem]">
          Darker cells have more complaints. Problem years stand out against the same model&apos;s other years; cells with a link open our full report for that
          model-year.
        </p>
        <div className="mt-4">
          <Heatmap
            title={`Owner complaints per model and model-year, ${STUDY_YEARS[0]} to ${STUDY_YEARS[STUDY_YEARS.length - 1]}`}
            rows={f.byModel.map((m) => m.name)}
            columns={STUDY_YEARS}
            steps={steps}
            value={(row, col) => {
              const r = STUDY_ROWS.find((x) => modelName(x) === row && x.year === col);
              return r ? r.complaints : null;
            }}
            href={(row, col) => {
              const r = STUDY_ROWS.find((x) => modelName(x) === row && x.year === col);
              return r ? report(r) : undefined;
            }}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          A blank cell means NHTSA lists no complaints for that model-year (often because it wasn&apos;t sold that year). Source: <Source />, to {asOf}.
        </p>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle>What do SUV owners complain about most?</PanelTitle>
          {topArea && f.topComponents[1] && (
            <p className="mt-3 text-[0.9375rem]">
              The {topArea.name.toLowerCase()}: {pct(topArea.count, f.total)}% of all complaints name it, followed by the {f.topComponents[1].name.toLowerCase()} (
              {pct(f.topComponents[1].count, f.total)}%).
            </p>
          )}
          <figure className="mt-4">
            <figcaption className="sr-only">Share of complaints naming each problem area</figcaption>
            <MeterList items={f.topComponents.slice(0, 8).map((c) => ({ label: c.name, value: c.count }))} total={f.total} />
          </figure>
          <p className="mt-3 text-sm text-muted-foreground">
            One complaint can name several areas, so shares add up to more than 100%. Source: <Source />.
          </p>
        </Panel>

        <Panel>
          <PanelTitle>Which model-years report the most fires?</PanelTitle>
          {f.byFires[0] && (
            <p className="mt-3 text-[0.9375rem]">
              The {rowName(f.byFires[0])}, with {num(f.byFires[0].fires)} complaints reporting a fire. Across all {f.rows.length} model-years, {num(f.fires)} complaints
              report a fire and {num(f.crashes)} a crash.
            </p>
          )}
          <figure className="mt-4">
            <figcaption className="sr-only">Model-years with the most complaints reporting a fire</figcaption>
            <BarList items={f.byFires.slice(0, 8).map((r) => ({ label: rowName(r), value: r.fires }))} format={num} />
          </figure>
          <p className="mt-3 text-sm text-muted-foreground">
            Fires as owners reported them, not confirmed causes. Check open recalls by VIN. Source: <Source />.
          </p>
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelTitle>Are owners still filing complaints about older SUVs?</PanelTitle>
        {old && old.n > 0 && (
          <p className="mt-3 text-[0.9375rem]">
            Yes. In {f.lastFull}, owners filed {num(old.n)} complaints about the {rowName(old.r)} alone, a vehicle at least {f.lastFull - old.r.year} years old by then.
            Problems that appear with age keep the counts climbing long after a model-year is sold.
          </p>
        )}
        <div className="mt-5">
          <ColumnChart
            title="Complaints about these SUVs by the year they were filed"
            valueName="complaints"
            periods={f.filedYears.map((y) => ({ label: String(y.year), value: y.count, partial: y.year === f.currentYear }))}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          All {f.rows.length} model-years together, by filing date. {f.currentYear} is a partial year (to {asOf}). Source: <Source />.
        </p>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <Panel>
          <PanelTitle>How was this study made?</PanelTitle>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem]">
            <li>
              We picked {STUDY_MODELS.length} of the best-selling SUVs in the US and, for each model-year from {STUDY_YEARS[0]} to {STUDY_YEARS[STUDY_YEARS.length - 1]},
              downloaded every complaint NHTSA holds through its public complaints API on {asOf}.
            </li>
            <li>
              We counted complaints by the problem areas owners selected (NHTSA&apos;s component categories) and by the year each was filed, and summed the crashes,
              fires, injuries and deaths owners reported. We kept only counts, never complaint text or VINs.
            </li>
            <li>Recall counts come from NHTSA&apos;s recalls API. Model-years with no complaints listed are left out.</li>
            <li>
              Limits: counts aren&apos;t adjusted for sales, complaints are unverified owner reports, and NHTSA lists some versions under other names (for
              example Rogue Sport), which aren&apos;t included.
            </li>
          </ul>
          <p className="mt-4">
            <a
              href={SUV_STUDY_CSV}
              download
              className={cn('inline-flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-4 font-semibold hover:bg-muted', focusRing)}
            >
              <Download aria-hidden="true" className="size-4" />
              Download the data (CSV, {f.rows.length} model-years)
            </a>
          </p>
          <div className="mt-5 rounded-lg bg-muted p-4 text-[0.9375rem]">
            <p className="font-semibold">How to cite this</p>
            <p className="mt-1">
              Source: MyAutoSpex analysis of NHTSA owner complaint data, {STUDY_YEARS[0]}–{STUDY_YEARS[STUDY_YEARS.length - 1]} SUVs, updated {asOf},{' '}
              {SITE_URL}/studies/suv-owner-complaints
            </p>
          </div>
        </Panel>

        <aside className="space-y-6">
          <Panel>
            <PanelTitle>Shopping for a used SUV?</PanelTitle>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">
              Check the exact car by its VIN: open recalls, owner complaints, crash ratings and fuel economy in one report.
            </p>
            <Link
              to="/vin-lookup"
              className={cn('mt-4 flex h-11 items-center justify-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong', focusRing)}
            >
              Check a VIN
            </Link>
          </Panel>
          <Panel>
            <PanelTitle>Full reports by model-year</PanelTitle>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">Complaints by area, every recall, crash ratings and EPA MPG.</p>
            <Link to="/cars" className={cn('mt-3 inline-block', linkClass)}>
              See the vehicle reports
            </Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
};

export default SuvComplaintsStudy;
