// /car-insurance/average-cost: silo 1 supporting page 4 (docs/SILOS.md). What US households actually spend on car
// insurance, from the BLS Consumer Expenditure Surveys, by year, region, age and income; why it keeps rising (BLS CPI,
// linked to the pillar); and how to check your own price. Charts drawn in code (docs/DATA-VIZ.md).
import React from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SITE_URL } from '../seo/site';
import { AVERAGE_COST_CSV, AVERAGE_COST_PATH, AVERAGE_COST_TITLE, CE_TABLES_URL, SPENDING_AS_OF, fredSeriesUrl, spendingFacts } from '../data/insurance/spending';
import { INSURANCE_PATH, insuranceFacts, monthName } from '../data/insurance';
import SEO from './SEO';
import { SignMarker } from './brand';
import { Notice, Panel, PanelTitle, focusRing, money } from './tool/kit';
import { EmbedThisChart, FlowDiagram, StatTile } from './tool/charts';
import { EMBEDS } from './EmbedChart';
import type { EmbedId } from '../data/embedIds';
import { SpendingByAgeChart, SpendingByIncomeChart, SpendingByRegionChart, SpendingByYearChart } from './InsuranceCharts';

export const AVERAGE_COST_DESCRIPTION =
  'The average US household spent $2,153 on car insurance in 2025, about $179 a month (BLS). By region, age and income, and why prices keep rising.';

const CREDIT_URL = `${SITE_URL}${AVERAGE_COST_PATH}`;
const CREDIT_TEXT = 'MyAutoSpex analysis of BLS consumer spending data';
const longDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '';
const linkClass = cn('font-semibold underline underline-offset-4', focusRing);

const Embed = ({ id }: { id: EmbedId }) => (
  <EmbedThisChart id={id} title={EMBEDS[id].title} height={EMBEDS[id].height} creditUrl={CREDIT_URL} creditText={CREDIT_TEXT} />
);
const Fred = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <a href={fredSeriesUrl(id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
    {children}
    <ExternalLink aria-hidden="true" className="size-3.5" />
  </a>
);

const TOC: [string, string][] = [
  ['average-key-findings', 'Key findings'],
  ['average-by-year', 'How much has it gone up?'],
  ['average-by-region', 'By region'],
  ['average-by-age', 'By age'],
  ['average-by-income', 'By income'],
  ['why-so-expensive', 'Why is car insurance so expensive?'],
  ['paying-too-much', 'Are you paying too much?'],
  ['average-method', 'Method, data and how to cite'],
];

const CarInsuranceAverageCost: React.FC = () => {
  const f = spendingFacts();
  const p = insuranceFacts();
  const asOf = longDate(SPENDING_AS_OF);
  const top = f.region[0];
  const low = f.region[f.region.length - 1];
  const under25 = f.age[0];
  const repair = p.fiveYear.find((c) => c.id === 'CUUR0000SETD');

  return (
    <div className="w-full max-w-6xl">
      <SEO title={AVERAGE_COST_TITLE} description={AVERAGE_COST_DESCRIPTION} />
      <nav aria-label="Breadcrumb" className="text-[0.9375rem] text-muted-foreground">
        <Link to={INSURANCE_PATH} className={cn('font-semibold text-foreground underline-offset-4 hover:underline', focusRing)}>
          Car insurance calculator
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span>Average cost</span>
      </nav>

      <header className="mt-4 mb-8 max-w-3xl">
        <p className="text-sm font-bold tracking-wide text-muted-foreground uppercase">Car insurance guide</p>
        <h1 className="mt-2 flex items-start gap-3 font-heading text-[2.1rem] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl">
          <SignMarker category="money" className="mt-2 size-7 sm:mt-3 sm:size-8" />
          <span>What is the average car insurance cost?</span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed">
          The average US household spent <strong>{money(f.latest)}</strong> on car insurance in {f.year}, about {money(f.monthly)} a month, according to the
          Bureau of Labor Statistics&apos; Consumer Expenditure Surveys. That average cost of car insurance is up {f.sinceFirst}% since {f.first}. It is a
          household total, so it covers every car a household insures; for your own price, use the{' '}
          <Link to={INSURANCE_PATH} className={linkClass}>
            car insurance calculator
          </Link>
          .
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          BLS data for {f.year}
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          Updated {asOf}
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          Reviewed by the{' '}
          <Link to="/editorial-policy" className="underline underline-offset-4">
            MyAutoSpex Editorial Team
          </Link>
        </p>
      </header>

      <Panel aria-labelledby="average-key-numbers">
        <PanelTitle>
          <span id="average-key-numbers">Key numbers</span>
        </PanelTitle>
        <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile value={money(f.latest)} label={`Average household spending on car insurance, ${f.year}`} trend={f.byYear.map((b) => b.value)} trendLabel="Household spending per year">
            <Fred id={f.allId}>BLS Consumer Expenditure Surveys</Fred>
          </StatTile>
          <StatTile value={money(f.monthly)} label="The same, per month">
            {money(f.latest)} ÷ 12
          </StatTile>
          <StatTile value={`+${f.change1y}%`} label={`Change from ${f.year - 1}`}>
            {f.sinceFirst}% since {f.first}
          </StatTile>
          <StatTile value={`${f.shareOfSpending}%`} label="Share of all household spending">
            {money(f.totalSpending)} spent on everything
          </StatTile>
        </dl>
      </Panel>

      <Panel id="average-key-findings" className="mt-6 scroll-mt-24">
        <PanelTitle>Key findings</PanelTitle>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem]">
          <li>
            US households spent an average of {money(f.latest)} on vehicle insurance in {f.year} ({money(f.monthly)} a month), up {f.change1y}% from{' '}
            {f.year - 1} and {f.sinceFirst}% from {f.first}.
          </li>
          {top && low && (
            <li>
              Households in the {top.label} spent the most ({money(top.value)}) and those in the {low.label} the least ({money(low.value)}), a gap of{' '}
              {f.regionGap}%.
            </li>
          )}
          {f.ageTop && (
            <li>
              Households headed by someone aged {f.ageTop.label} spent the most of any age group: {money(f.ageTop.value)}.
            </li>
          )}
          <li>The highest-income fifth of households spent {f.incomeRatio} times as much as the lowest-income fifth.</li>
          <li>
            Car insurance took {f.shareOfSpending}% of everything the average household spent in {f.year}.
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Source: MyAutoSpex analysis of the BLS Consumer Expenditure Surveys ({f.year} data), mean per household (consumer unit).
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

      <Notice tone="info" className="mt-6" title="Read this first">
        These are averages per household, not the price for one driver or one car. They include households with no car and households insuring several,
        so a single driver&apos;s premium can be well above or below them.
      </Notice>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel id="average-by-year" className="scroll-mt-24">
          <PanelTitle>How much has the average cost of car insurance gone up?</PanelTitle>
          <p className="mt-3 text-[0.9375rem]">
            By {f.sinceFirst}% from {f.first} to {f.year}: from {money(f.firstValue)} to {money(f.latest)} a household. Most of the rise came after 2022.
          </p>
          <p className="mt-4 font-semibold">{EMBEDS['car-insurance-spending-by-year'].title}</p>
          <div className="mt-2">
            <SpendingByYearChart />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Source: <Fred id={f.allId}>BLS Consumer Expenditure Surveys, vehicle insurance, all consumer units</Fred>, mean per year.
          </p>
          <Embed id="car-insurance-spending-by-year" />
        </Panel>

        <Panel id="average-by-region" className="scroll-mt-24">
          <PanelTitle>Where is car insurance most expensive?</PanelTitle>
          <p className="mt-3 text-[0.9375rem]">
            In the {top?.label}: households there spent {money(top?.value ?? 0)} in {f.year}, against {money(low?.value ?? 0)} in the {low?.label}.
          </p>
          <p className="mt-4 font-semibold">{EMBEDS['car-insurance-spending-by-region'].title}</p>
          <div className="mt-4">
            <SpendingByRegionChart />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Census regions. Source: BLS Consumer Expenditure Surveys, {f.year}, mean per household (series in the CSV below).
          </p>
          <Embed id="car-insurance-spending-by-region" />
        </Panel>

        <Panel id="average-by-age" className="scroll-mt-24">
          <PanelTitle>How does the average cost change with age?</PanelTitle>
          <p className="mt-3 text-[0.9375rem]">
            Household spending peaks when the household head is {f.ageTop?.label} ({money(f.ageTop?.value ?? 0)}). Households headed by someone under 25
            spent {money(under25?.value ?? 0)}. These are totals per household, so they reflect how many cars a household insures as well as the price per
            driver.
          </p>
          <div className="mt-4">
            <SpendingByAgeChart />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Age of the household&apos;s reference person. Source: BLS Consumer Expenditure Surveys, {f.year}.</p>
        </Panel>

        <Panel id="average-by-income" className="scroll-mt-24">
          <PanelTitle>Do higher-income households pay more for car insurance?</PanelTitle>
          <p className="mt-3 text-[0.9375rem]">
            In total, yes: the top fifth by income spent {f.incomeRatio} times as much as the bottom fifth in {f.year}. More cars and higher coverage
            limits both add to a household&apos;s bill.
          </p>
          <div className="mt-4">
            <SpendingByIncomeChart />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Households ranked by income before taxes, in fifths. Source: BLS Consumer Expenditure Surveys, {f.year}.</p>
        </Panel>
      </div>

      <Panel id="why-so-expensive" className="mt-6 scroll-mt-24">
        <PanelTitle>Why is car insurance so expensive?</PanelTitle>
        <p className="mt-3 max-w-3xl text-[0.9375rem]">
          Mostly because the price of the same cover has risen fast: the BLS price index for car insurance rose {p.fiveYearInsurance}% in the five years to{' '}
          {monthName(p.latest)}, more than twice overall inflation ({p.fiveYearAllItems}%). Over the same years, car repair and maintenance prices rose{' '}
          {repair?.value ?? 0}%. When insurers pay more in claims, they pass the cost on in premiums, the{' '}
          <a href="https://content.naic.org/consumer/auto-insurance.htm" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            NAIC
          </a>{' '}
          notes. Prices peaked in {monthName(p.peakKey)} and have eased {Math.abs(p.fromPeak)}% since.
        </p>
        <p className="mt-3 text-[0.9375rem]">
          <Link to={`${INSURANCE_PATH}#insurance-price-trend`} className={linkClass}>
            See the price charts, 2017 to {p.latest.slice(0, 4)}
          </Link>
        </p>
      </Panel>

      <Panel id="paying-too-much" className="mt-6 scroll-mt-24">
        <PanelTitle>Are you paying too much for car insurance?</PanelTitle>
        <p className="mt-3 max-w-3xl text-[0.9375rem]">
          The averages above are a rough yardstick for a whole household. To judge your own price, compare like with like: the same drivers, cars,
          coverage and deductible.
        </p>
        <div className="mt-5">
          <FlowDiagram
            title="Check whether you're paying too much for car insurance, in four steps"
            steps={[
              {
                title: 'Compare with your region',
                text: `Households in the ${top?.label ?? 'South'} average ${money(top?.value ?? 0)} a year; in the ${low?.label ?? 'Midwest'}, ${money(low?.value ?? 0)}. Divide by the cars you insure.`,
                href: '#average-by-region',
                linkLabel: 'See every region',
              },
              {
                title: 'Estimate your own profile',
                text: 'Your age, record, credit, car, coverage and deductible give a monthly range, and show which change saves the most.',
                href: INSURANCE_PATH,
                linkLabel: 'Open the calculator',
              },
              {
                title: 'Get three quotes',
                text: 'Ask a large national insurer, a regional one and an independent agent for the same coverage and deductible. Quotes are free.',
              },
              {
                title: 'Re-check at renewal',
                text: 'Prices change every term. Compare again before each renewal, and after a ticket or accident drops off your record.',
              },
            ]}
          />
        </div>
      </Panel>

      <Panel id="average-method" className="mt-6 scroll-mt-24">
        <PanelTitle>How were these numbers worked out?</PanelTitle>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem]">
          <li>
            We downloaded the BLS Consumer Expenditure Surveys&apos; mean annual spending on vehicle insurance per consumer unit (roughly, a household), for all
            households and by region, age of the reference person and income fifth, from the BLS public API on {asOf}.
          </li>
          <li>
            Monthly figures are the yearly mean divided by 12. Changes and the regional gap are computed from those means; the share of spending divides
            vehicle insurance by total household spending.
          </li>
          <li>
            Limits: these are averages per household, including households with no car, so they are not the price of one policy. They are national or
            regional, not by state. We start in {f.first}: earlier years in the series are on a much lower level, and we haven&apos;t confirmed they are
            comparable.
          </li>
          <li>We refresh the data each September, when BLS publishes a new year.</li>
        </ul>
        <p className="mt-4">
          <a
            href={AVERAGE_COST_CSV}
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
            Source: MyAutoSpex analysis of BLS Consumer Expenditure Surveys data on vehicle insurance spending, updated {asOf}, {SITE_URL}
            {AVERAGE_COST_PATH}
          </p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Official sources:{' '}
          <a href={CE_TABLES_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
            BLS Consumer Expenditure Surveys tables <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
          ; every series is also on <Fred id={f.allId}>FRED</Fred>. This page is general information, not insurance or financial advice.
        </p>
      </Panel>

      <Panel className="mt-6">
        <PanelTitle>Estimate your own premium</PanelTitle>
        <p className="mt-1 text-[0.9375rem] text-muted-foreground">
          A monthly and yearly range for your age, record, credit, car and coverage, with what each change would save. No contact details needed.
        </p>
        <Link
          to={INSURANCE_PATH}
          className={cn('mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong', focusRing)}
        >
          Open the car insurance calculator
        </Link>
      </Panel>
    </div>
  );
};

export default CarInsuranceAverageCost;
