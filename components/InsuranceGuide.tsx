// The guide under the car insurance calculator (/insurance-estimator): the content-rule piece for silo 1's pillar
// (docs/CONTENT-RULE.md, docs/SILOS.md). Official price data from the BLS consumer price index, charts drawn in
// code (docs/DATA-VIZ.md), a coverage breakdown sourced to the NAIC, how the estimate is worked out, method, CSV
// and "How to cite this". Every number is computed in data/insurance.
import React from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SITE_URL } from '../seo/site';
import { ALL_ITEMS_ID, CPI_AS_OF, INSURANCE_CSV, INSURANCE_ID, INSURANCE_PATH, blsSeriesUrl, insuranceFacts, monthName } from '../data/insurance';
import { EMBEDS } from './EmbedChart';
import { AVERAGE_COST_PATH } from '../data/insurance/spending';
import type { EmbedId } from '../data/embedIds';
import { Panel, PanelTitle, focusRing } from './tool/kit';
import { BreakdownDiagram, EmbedThisChart, FlowDiagram, StatTile } from './tool/charts';
import { DrivingCostsChart, InsuranceTrendChart, InsuranceYearlyChart } from './InsuranceCharts';

const NAIC_AUTO = 'https://content.naic.org/consumer/auto-insurance.htm';
const NAIC_CHECKED = '2026-11-26';
const CREDIT_URL = `${SITE_URL}${INSURANCE_PATH}`;
const CREDIT_TEXT = 'MyAutoSpex analysis of BLS car insurance price data';

const longDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '';
const pct = (v: number) => `${Math.abs(v).toFixed(1)}%`;
const linkClass = cn('font-semibold underline underline-offset-4', focusRing);

const Embed = ({ id }: { id: EmbedId }) => (
  <EmbedThisChart id={id} title={EMBEDS[id].title} height={EMBEDS[id].height} creditUrl={CREDIT_URL} creditText={CREDIT_TEXT} />
);

const SourceLink = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <a href={blsSeriesUrl(id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
    {children}
    <ExternalLink aria-hidden="true" className="size-3.5" />
  </a>
);

const TOC: [string, string][] = [
  ['insurance-key-findings', 'Key findings'],
  ['insurance-price-trend', 'How much have car insurance prices gone up?'],
  ['insurance-yearly-change', 'Are prices still going up in 2026?'],
  ['insurance-vs-driving-costs', 'Car insurance vs other driving costs'],
  ['what-a-policy-pays-for', 'What does a policy pay for?'],
  ['how-the-estimate-works', 'How this calculator works it out'],
  ['insurance-method', 'Method, data and how to cite'],
];

const InsuranceGuide: React.FC = () => {
  const f = insuranceFacts();
  const latest = monthName(f.latest);
  const fiveBack = monthName(f.fiveYearsBack);
  const peak = monthName(f.peakKey);
  const updated = longDate(CPI_AS_OF);
  const repair = f.fiveYear.find((c) => c.id === 'CUUR0000SETD');
  const gas = f.fiveYear.find((c) => c.id === 'CUUR0000SETB01');
  const newCars = f.fiveYear.find((c) => c.id === 'CUUR0000SETA01');
  const usedCars = f.fiveYear.find((c) => c.id === 'CUUR0000SETA02');
  const missing = f.missing.map((k) => monthName(k)).join(' and ');
  const ytd = f.years[f.years.length - 1];
  const fromFive = f.months.indexOf(f.fiveYearsBack);
  const quarterly = f.insuranceIndexed.filter((v, i) => v !== null && i >= fromFive && (i - fromFive) % 3 === 0) as number[];

  return (
    <section aria-labelledby="insurance-guide" className="mt-16">
      <div className="max-w-3xl">
        <p className="text-sm font-bold tracking-wide text-muted-foreground uppercase">Guide and data</p>
        <h2 id="insurance-guide" className="mt-2 font-heading text-3xl font-extrabold tracking-[-0.01em] text-balance">
          How much has car insurance gone up? The official numbers, {f.first.slice(0, 4)}–{f.latest.slice(0, 4)}
        </h2>
        <p className="mt-4 text-lg leading-relaxed">
          US car insurance prices rose {pct(f.fiveYearInsurance)} in the five years to {latest}, more than twice the rise in overall consumer prices (
          {pct(f.fiveYearAllItems)}), according to the Bureau of Labor Statistics consumer price index. They peaked in {peak} and have eased since: {latest}{' '}
          was {pct(f.fromPeak)} below that peak. The charts below show the climb, the yearly changes, and how insurance compares with the other costs of
          running a car.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          BLS data to {latest}
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          Updated {updated}
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          Reviewed by the{' '}
          <Link to="/editorial-policy" className="underline underline-offset-4">
            MyAutoSpex Editorial Team
          </Link>
        </p>
      </div>

      <Panel aria-labelledby="insurance-key-numbers" className="mt-6">
        <PanelTitle>
          <span id="insurance-key-numbers">Key numbers</span>
        </PanelTitle>
        <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-3">
          <StatTile value={`+${pct(f.fiveYearInsurance)}`} label={`Car insurance prices, ${fiveBack} to ${latest}`} trend={quarterly} trendLabel="Car insurance price index, quarterly">
            <SourceLink id={INSURANCE_ID}>BLS CPI, motor vehicle insurance</SourceLink>
          </StatTile>
          <StatTile value={`−${pct(f.fromPeak)}`} label={`Change from the ${peak} peak to ${latest}`}>
            <SourceLink id={INSURANCE_ID}>BLS CPI</SourceLink>
          </StatTile>
          {f.biggestYear && (
            <StatTile value={`+${pct(f.biggestYear.value)}`} label={`Rise in ${f.biggestYear.label} alone, the largest yearly rise of ${f.years[0]?.label}–${f.years.filter((y) => !y.partial).pop()?.label}`}>
              <SourceLink id={INSURANCE_ID}>BLS CPI, December to December</SourceLink>
            </StatTile>
          )}
        </dl>
      </Panel>

      <Panel id="insurance-key-findings" className="mt-6 scroll-mt-24">
        <PanelTitle>Key findings</PanelTitle>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem]">
          <li>
            US car insurance prices rose {pct(f.fiveYearInsurance)} from {fiveBack} to {latest}, while overall consumer prices rose {pct(f.fiveYearAllItems)}.
          </li>
          <li>
            Prices peaked in {peak}. By {latest} they were {pct(f.fromPeak)} lower, and over the 12 months to {monthName(f.yoyEnd)} they fell {pct(f.yoy)}.
          </li>
          {f.surge !== null && f.biggestYear && (
            <li>
              The steepest climb came in 2022–2024: prices rose {pct(f.surge)} from December 2021 to December 2024, including {pct(f.biggestYear.value)} in{' '}
              {f.biggestYear.label} alone.
            </li>
          )}
          {repair && gas && newCars && usedCars && (
            <li>
              Over the same five years, car repair and maintenance prices rose {pct(repair.value)}, gasoline {pct(gas.value)} and new vehicles{' '}
              {pct(newCars.value)}, while used-vehicle prices {usedCars.value < 0 ? `fell ${pct(usedCars.value)}` : `rose ${pct(usedCars.value)}`}.
            </li>
          )}
          <li>
            Since {monthName(f.first)}, car insurance prices are up {pct(f.sinceFirst)}, against {pct(f.allItemsSinceFirst)} for all consumer prices.
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Source: MyAutoSpex analysis of the BLS consumer price index (CPI-U, US city average, not seasonally adjusted), data to {latest}.
        </p>
      </Panel>

      <nav aria-label="On this page" className="mt-6 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-bold">On this page</p>
        <ol className="mt-2 grid gap-x-6 gap-y-1 text-[0.9375rem] sm:grid-cols-2">
          {TOC.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="underline-offset-4 hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Panel id="insurance-price-trend" className="mt-6 scroll-mt-24">
        <PanelTitle>How much have car insurance prices gone up?</PanelTitle>
        <p className="mt-3 text-[0.9375rem]">
          By {pct(f.sinceFirst)} since {monthName(f.first)}, against {pct(f.allItemsSinceFirst)} for everything consumers buy. The two lines moved together until
          2022; then insurance pulled away.
        </p>
        <p className="mt-4 font-semibold">{EMBEDS['car-insurance-price-trend'].title}</p>
        <div className="mt-2">
          <InsuranceTrendChart />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Source: BLS CPI-U, <SourceLink id={INSURANCE_ID}>motor vehicle insurance</SourceLink> and <SourceLink id={ALL_ITEMS_ID}>all items</SourceLink>, US
          city average, not seasonally adjusted, {monthName(f.first)} = 100.{missing && ` BLS published no car insurance value for ${missing}.`}
        </p>
        <Embed id="car-insurance-price-trend" />
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel id="insurance-yearly-change" className="scroll-mt-24">
          <PanelTitle>Are car insurance prices still going up in {f.latest.slice(0, 4)}?</PanelTitle>
          <p className="mt-3 text-[0.9375rem]">
            {ytd && ytd.partial
              ? ytd.value < 0
                ? `No: they are down ${pct(ytd.value)} so far this year, after the steep rises of 2022 to 2024.`
                : `Yes: they are up ${pct(ytd.value)} so far this year.`
              : `Prices changed ${ytd ? pct(ytd.value) : ''} over ${ytd?.label}.`}
          </p>
          <p className="mt-4 font-semibold">{EMBEDS['car-insurance-yearly-change'].title}</p>
          <div className="mt-2">
            <InsuranceYearlyChart />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Source: <SourceLink id={INSURANCE_ID}>BLS CPI, motor vehicle insurance</SourceLink>. Each year is December to December;{' '}
            {f.latest.slice(0, 4)} is December {Number(f.latest.slice(0, 4)) - 1} to {latest}.
          </p>
          <Embed id="car-insurance-yearly-change" />
        </Panel>

        <Panel id="insurance-vs-driving-costs" className="scroll-mt-24">
          <PanelTitle>How does car insurance compare with other driving costs?</PanelTitle>
          <p className="mt-3 text-[0.9375rem]">
            Over the last five years it rose the most of the costs shown here, with repair prices close behind. When insurers pay more in claims, they pass
            the cost on to customers in higher premiums, the NAIC notes.
          </p>
          <p className="mt-4 font-semibold">{EMBEDS['driving-costs-5-years'].title}</p>
          <div className="mt-4">
            <DrivingCostsChart />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Price change, {fiveBack} to {latest}. Source: BLS CPI-U, US city average, not seasonally adjusted (series in the CSV below).
          </p>
          <Embed id="driving-costs-5-years" />
        </Panel>
      </div>

      <Panel id="what-a-policy-pays-for" className="mt-6 scroll-mt-24">
        <PanelTitle>What does a car insurance policy pay for?</PanelTitle>
        <p className="mt-3 max-w-3xl text-[0.9375rem]">
          Liability pays other people when you cause a crash; collision and comprehensive pay for your own car. &ldquo;Full coverage&rdquo; isn&apos;t a legal
          term: it usually means all three, and it&apos;s what the calculator above prices unless you pick state minimum.
        </p>
        <div className="mt-5">
          <BreakdownDiagram
            title="The parts of a car insurance policy and what each pays for"
            groups={[
              {
                label: 'Pays other people',
                note: 'Liability, when a crash is your fault',
                items: [
                  { title: 'Bodily injury liability', text: 'Claims from people you injure: medical expenses, lost wages, pain and suffering.' },
                  { title: 'Property damage liability', text: "Damage you cause to other people's property: their cars, and things like walls and fences." },
                ],
              },
              {
                label: "Pays you when they can't",
                tone: 1,
                items: [
                  { title: 'Uninsured / underinsured motorist', text: 'Pays if you are injured by a hit-and-run driver or a driver with no insurance.' },
                ],
              },
              {
                label: 'Pays for your own car',
                tone: 1,
                items: [
                  {
                    title: 'Collision',
                    text: 'Damage when your car hits an object, such as a tree, or another car. Not required by law, but a lender or leasing company may require it.',
                  },
                  { title: 'Comprehensive', text: 'Damage from almost anything else: fire, severe weather, floods, vandalism, theft and broken glass. Not required by law.' },
                ],
              },
            ]}
            packages={[
              { label: 'State minimum', text: 'only the cover your state requires', span: [0, 0] },
              { label: 'Full coverage', text: 'liability plus collision and comprehensive; not a legal term', span: [0, 2] },
            ]}
          />
        </div>
        <p className="mt-5 max-w-3xl text-[0.9375rem]">
          <strong>Is collision worth it on an older car?</strong> When repairs would cost more than the car is worth, the insurer &ldquo;totals&rdquo; it and pays
          what the car was worth, not the repair bill. That makes collision cover worth less as a car ages.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Source:{' '}
          <a href={NAIC_AUTO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
            NAIC consumer guide to auto insurance <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>{' '}
          (National Association of Insurance Commissioners), checked {longDate(NAIC_CHECKED)}. What your state requires: your state&apos;s insurance department.
        </p>
      </Panel>

      <Panel id="how-the-estimate-works" className="mt-6 scroll-mt-24">
        <PanelTitle>How does this calculator work out your estimate?</PanelTitle>
        <p className="mt-3 max-w-3xl text-[0.9375rem]">
          It starts from a typical driver&apos;s monthly rate and multiplies it up or down for each answer you give, the same way the &ldquo;Ways to lower
          it&rdquo; savings are worked out. Insurers do something similar with their own data: the NAIC says the biggest influence on a rate is how often drivers
          like you make claims.
        </p>
        <div className="mt-5">
          <FlowDiagram
            title="How the car insurance estimate is worked out, in four steps"
            steps={[
              {
                title: 'Start from a typical driver',
                text: 'A monthly rate for a driver aged 25–64 with a clean record, good credit and full coverage, set near published 2026 national averages.',
              },
              {
                title: 'Adjust for the driver',
                text: 'Age, tickets or accidents in the last 3 years, and credit tier each raise or lower the rate. Young drivers and at-fault accidents raise it most.',
              },
              {
                title: 'Adjust for the car and cover',
                text: 'Sports models cost more and pickups a little less. State minimum costs less than full coverage; premium cover costs more.',
              },
              {
                title: 'Deductible, then a range',
                text: "A higher deductible lowers the rate. The result is a range of ±15%, because every insurer prices differently and your state and ZIP aren't modeled.",
              },
            ]}
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          The estimate is a ballpark, not a quote: real prices also depend on your state, ZIP, exact car, claims history and each insurer&apos;s own pricing.
        </p>
      </Panel>

      <Panel id="insurance-method" className="mt-6 scroll-mt-24">
        <PanelTitle>How were these numbers worked out?</PanelTitle>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem]">
          <li>
            We downloaded monthly values of the consumer price index (CPI-U, US city average, not seasonally adjusted) from the Bureau of Labor Statistics&apos;
            public API on {updated}: motor vehicle insurance, all items, motor vehicle maintenance and repair, new vehicles, used cars and trucks, and gasoline,
            from {monthName(f.first)} to {latest}.
          </li>
          <li>
            Every change on this page is computed from those index values: five-year changes compare {fiveBack} with {latest}; yearly changes compare each
            December with the one before; the trend chart sets {monthName(f.first)} to 100.
          </li>
          <li>
            Limits: a price index shows how much prices changed, not what any driver pays in dollars. It is a national average, so your state can differ a lot.
            {missing && ` BLS has no car insurance value for ${missing} (October's data were not collected during the 2025 federal funding lapse).`}
          </li>
          <li>We refresh the data each month after BLS publishes the new CPI.</li>
        </ul>
        <p className="mt-4">
          <a href={INSURANCE_CSV} download className={cn('inline-flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-4 font-semibold hover:bg-muted', focusRing)}>
            <Download aria-hidden="true" className="size-4" />
            Download the data (CSV, {f.months.length} months)
          </a>
        </p>
        <div className="mt-5 rounded-lg bg-muted p-4 text-[0.9375rem]">
          <p className="font-semibold">How to cite this</p>
          <p className="mt-1">
            Source: MyAutoSpex analysis of BLS consumer price index data for motor vehicle insurance, updated {updated}, {SITE_URL}
            {INSURANCE_PATH}
          </p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          This page is general information, not insurance or financial advice. Get quotes from licensed insurers for your own price. More tools for the cost of
          owning a car:{' '}
          <Link to="/ownership-calculator" className={linkClass}>
            true cost of ownership
          </Link>
          ,{' '}
          <Link to="/affordability-predictor" className={linkClass}>
            how much car you can afford
          </Link>
          .
        </p>
      </Panel>
      <Panel aria-labelledby="insurance-guides" className="mt-6">
        <PanelTitle>
          <span id="insurance-guides">Car insurance guides</span>
        </PanelTitle>
        <ul className="mt-3 space-y-3 text-[0.9375rem]">
          <li>
            <Link to={AVERAGE_COST_PATH} className={linkClass}>
              Average car insurance cost: what US households spend a year and a month
            </Link>
            <span className="block text-muted-foreground">BLS household spending by region, age and income, and why prices keep rising.</span>
          </li>
        </ul>
      </Panel>
    </section>
  );
};

export default InsuranceGuide;
