// Charts for the car insurance guide (components/InsuranceGuide.tsx), shared with their embed pages
// (components/EmbedChart.tsx). Data: BLS consumer price index (data/insurance).
import React from 'react';
import { INSURANCE_ID, insuranceFacts, monthName } from '../data/insurance';
import { spendingFacts } from '../data/insurance/spending';
import { money } from './tool/kit';
import { BarList, ChangeBars, ChangeColumns, ColumnChart, LineChart } from './tool/charts';

/** The two lines, every January labeled. Shared with the embed page. */
export function InsuranceTrendChart() {
  const f = insuranceFacts();
  const labels = f.months.map((k) => monthName(k, true));
  const januaries = f.months.map((k, i) => (k.endsWith('-01') ? i : -1)).filter((i) => i >= 0);
  return (
    <LineChart
      title={`Car insurance prices vs all consumer prices, ${monthName(f.first)} = 100`}
      labels={labels}
      series={[
        { name: 'Car insurance', values: f.insuranceIndexed },
        { name: 'All consumer prices', values: f.allItemsIndexed },
      ]}
      ticks={januaries.map((i) => ({ index: i, label: f.months[i].slice(0, 4) }))}
      tableRows={[...januaries, f.months.length - 1].filter((i, k, a) => a.indexOf(i) === k)}
      format={(v) => v.toFixed(1)}
      tickFormat={(v) => String(v)}
      baseline={100}
    />
  );
}

export function InsuranceYearlyChart() {
  const f = insuranceFacts();
  return <ChangeColumns title="Yearly change in car insurance prices, December to December" periods={f.years} />;
}

export function DrivingCostsChart() {
  const f = insuranceFacts();
  return (
    <ChangeBars
      items={[...f.fiveYear].sort((a, b) => b.value - a.value).map((c) => ({ label: c.name, value: c.value, highlight: c.id === INSURANCE_ID }))}
    />
  );
}

/** Average household spending on car insurance per year (BLS Consumer Expenditure Surveys). */
export function SpendingByYearChart() {
  const f = spendingFacts();
  return <ColumnChart title="Average household spending on car insurance per year" periods={f.byYear} valueName="a household" format={(v) => money(v)} />;
}

export function SpendingByRegionChart() {
  return <BarList items={spendingFacts().region.map((r) => ({ label: r.label, value: r.value }))} />;
}

/** In age order, youngest first. */
export function SpendingByAgeChart() {
  return <BarList items={spendingFacts().age.map((r) => ({ label: r.label, value: r.value }))} />;
}

/** In income order, lowest fifth first. */
export function SpendingByIncomeChart() {
  return <BarList items={spendingFacts().income.map((r) => ({ label: r.label, value: r.value }))} />;
}
