// /cars — every vehicle report (data/vehicles/), compared side by side, with charts drawn in code (docs/DATA-VIZ.md).
import React from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SITE_URL } from '../seo/site';
import { VEHICLES, componentName, num, uniqueMpg, vehicleName, vehiclePath, type VehicleData } from '../data/vehicles';
import SEO from './SEO';
import { Panel, PanelTitle, ToolPage, focusRing } from './tool/kit';
import { BarList, StatTile } from './tool/charts';

export const CARS_DESCRIPTION =
  'Owner complaints, recalls, crash ratings and fuel economy for popular cars by model-year, counted from NHTSA and EPA data and compared side by side.';
export const CARS_CSV = '/data/cars/all-vehicle-reports.csv';

const linkClass = cn('font-semibold underline underline-offset-4', focusRing);
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

const topArea = (v: VehicleData) => v.complaints.byComponent.find((c) => c.component !== 'UNKNOWN OR OTHER');
/** Share of complaints filed under NHTSA's "Engine" category. */
const engineShare = (v: VehicleData) => {
  const engine = v.complaints.byComponent.find((c) => c.component === 'ENGINE')?.count ?? 0;
  return v.complaints.total ? Math.round((engine / v.complaints.total) * 100) : 0;
};

/** One CSV row per vehicle report, for the hub's download (written by scripts/prerender.mjs). */
export function carsCsv() {
  const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const rows: (string | number)[][] = [
    ['vehicle', 'owner_complaints', 'top_complaint_area', 'top_area_complaints', 'recalls', 'nhtsa_overall_rating', 'epa_combined_mpg_low', 'epa_combined_mpg_high', 'report_url', 'data_as_of'],
  ];
  for (const v of VEHICLES) {
    const top = topArea(v);
    const mpg = uniqueMpg(v.mpg).map((m) => m.combined);
    rows.push([
      vehicleName(v),
      v.complaints.total,
      top ? componentName(top.component) : '',
      top?.count ?? '',
      v.recalls.length,
      [...new Set(v.ratings.map((r) => r.overall))].join(' / '),
      mpg.length ? Math.min(...mpg) : '',
      mpg.length ? Math.max(...mpg) : '',
      `${SITE_URL}${vehiclePath(v)}`,
      v.asOf,
    ]);
  }
  return `${rows.map((r) => r.map(q).join(',')).join('\n')}\n`;
}

const CarsHub: React.FC = () => {
  const asOf = VEHICLES.map((v) => v.asOf).sort().pop() ?? '';
  const totalComplaints = VEHICLES.reduce((a, v) => a + v.complaints.total, 0);
  const totalRecalls = VEHICLES.reduce((a, v) => a + v.recalls.length, 0);
  const byComplaints = [...VEHICLES].sort((a, b) => b.complaints.total - a.complaints.total);
  const most = byComplaints[0];
  const byRecalls = [...VEHICLES].sort((a, b) => b.recalls.length - a.recalls.length);
  const byEngine = [...VEHICLES].sort((a, b) => engineShare(b) - engineShare(a));
  const makes = [...new Set(VEHICLES.map((v) => v.make))].sort();

  return (
    <>
      <SEO title="Vehicle Reports: Problems, Recalls, Ratings" description={CARS_DESCRIPTION} />
      <ToolPage
        category="warnings"
        title="Vehicle reports"
        intro="What owners report to NHTSA, every recall, government crash ratings and EPA fuel economy for popular cars, one model-year at a time. Every number is counted from the official data and refreshed weekly."
      >
        <Panel aria-labelledby="cars-key-numbers">
          <PanelTitle>
            <span id="cars-key-numbers">Key numbers</span>
          </PanelTitle>
          <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-3">
            <StatTile value={num(VEHICLES.length)} label="Model-years with a full report">
              Data as of {longDate(asOf)}
            </StatTile>
            <StatTile value={num(totalComplaints)} label="Owner complaints counted">
              <a href="https://www.nhtsa.gov/report-a-safety-problem" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                Filed with NHTSA
              </a>
            </StatTile>
            <StatTile value={num(totalRecalls)} label="Recalls listed">
              <a href="https://www.nhtsa.gov/recalls" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                NHTSA recalls
              </a>
            </StatTile>
          </dl>
        </Panel>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelTitle>Which of these model-years have the most owner complaints?</PanelTitle>
            {most && (
              <p className="mt-3 text-[0.9375rem]">
                The {vehicleName(most)}, with {num(most.complaints.total)} complaints filed with NHTSA
                {topArea(most) ? <>, most about the {componentName(topArea(most)!.component).toLowerCase()}</> : null}.
              </p>
            )}
            <figure className="mt-4">
              <figcaption className="sr-only">Owner complaints per model-year</figcaption>
              <BarList items={byComplaints.map((v) => ({ label: vehicleName(v), value: v.complaints.total }))} format={num} />
            </figure>
            <p className="mt-3 text-sm text-muted-foreground">Source: NHTSA complaints API, to {longDate(asOf)}.</p>
          </Panel>

          <Panel>
            <PanelTitle>How many complaints involve the engine?</PanelTitle>
            {byEngine[0] && (
              <p className="mt-3 text-[0.9375rem]">
                {engineShare(byEngine[0])}% for the {vehicleName(byEngine[0])}, the highest share of the model-years here.
              </p>
            )}
            <figure className="mt-4">
              <figcaption className="sr-only">Share of each model-year's complaints that name the engine</figcaption>
              <BarList items={byEngine.map((v) => ({ label: vehicleName(v), value: engineShare(v) }))} format={(n) => `${n}%`} />
            </figure>
            <p className="mt-3 text-sm text-muted-foreground">
              Share of complaints filed under NHTSA&apos;s &quot;Engine&quot; category (engine cooling is a separate category). Source: NHTSA complaints API.
            </p>
          </Panel>

          <Panel>
            <PanelTitle>Which have the most recalls?</PanelTitle>
            {byRecalls[0] && (
              <p className="mt-3 text-[0.9375rem]">
                The {vehicleName(byRecalls[0])}, with {byRecalls[0].recalls.length} recalls. Check your own car by VIN: not every recall covers every car.
              </p>
            )}
            <figure className="mt-4">
              <figcaption className="sr-only">Recalls per model-year</figcaption>
              <BarList items={byRecalls.map((v) => ({ label: vehicleName(v), value: v.recalls.length }))} format={num} />
            </figure>
            <p className="mt-3 text-sm text-muted-foreground">Source: NHTSA recalls API.</p>
          </Panel>

          <Panel>
            <PanelTitle>Is there an open recall on your car?</PanelTitle>
            <p className="mt-3 text-[0.9375rem]">
              Recalls apply to specific cars. Check yours by its 17-character VIN for open recalls, specs, complaints and crash ratings.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/vin-lookup"
                className={cn('inline-flex h-11 items-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong', focusRing)}
              >
                Check my VIN
              </Link>
              <Link to="/recalls" className={cn('inline-flex h-11 items-center', linkClass)}>
                Recalls by year, make and model
              </Link>
            </div>
          </Panel>
        </div>

        <section aria-labelledby="all-reports" className="mt-10">
          <h2 id="all-reports" className="font-heading text-2xl font-extrabold">
            All vehicle reports
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {makes.map((make) => (
              <div key={make}>
                <h3 className="font-bold">{make}</h3>
                <ul className="mt-2 divide-y divide-border border-y border-border">
                  {VEHICLES.filter((v) => v.make === make).map((v) => (
                    <li key={vehiclePath(v)} className="py-2.5">
                      <Link to={vehiclePath(v)} className={linkClass}>
                        {v.year} {v.model}
                      </Link>
                      <span className="block text-sm text-muted-foreground">
                        {num(v.complaints.total)} complaints
                        <span aria-hidden="true" className="mx-1.5">
                          ·
                        </span>
                        {v.recalls.length} recall{v.recalls.length === 1 ? '' : 's'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <Panel className="mt-10">
          <PanelTitle>How are these reports made?</PanelTitle>
          <p className="mt-3 text-[0.9375rem]">
            Each week we download every complaint NHTSA holds for each model-year through its public API and count them by the parts of the car owners
            selected and by the year they were filed. We keep only the counts, never complaint text or VINs. Recalls and crash ratings come from
            NHTSA&apos;s APIs, and fuel economy from the EPA&apos;s fueleconomy.gov. A model-year gets a report only with at least 25 complaints or at
            least one recall.
          </p>
          <p className="mt-4">
            <a
              href={CARS_CSV}
              download
              className={cn('inline-flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-4 font-semibold hover:bg-muted', focusRing)}
            >
              <Download aria-hidden="true" className="size-4" />
              Download the comparison (CSV)
            </a>
          </p>
          <div className="mt-5 rounded-lg bg-muted p-4 text-[0.9375rem]">
            <p className="font-semibold">How to cite this</p>
            <p className="mt-1">
              Source: MyAutoSpex analysis of NHTSA complaint, recall and crash-rating data and EPA fuel economy data, updated {longDate(asOf)},{' '}
              {SITE_URL}/cars
            </p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Official sources:{' '}
            <a href="https://www.nhtsa.gov/nhtsa-datasets-and-apis" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
              NHTSA datasets and APIs <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
            ,{' '}
            <a href="https://www.fueleconomy.gov/feg/ws/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
              fueleconomy.gov web services <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
            .
          </p>
        </Panel>
      </ToolPage>
    </>
  );
};

export default CarsHub;
