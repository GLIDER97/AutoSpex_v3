// Small, dependency-free charts for the money tools. Colors are the validated
// --chart-1 / --chart-2 tokens (CVD-safe in light and dark mode). Values and
// labels use text colors, never the series color; every chart has a legend
// (for two series), hover details and a table view.
import React, { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { focusRing, money } from './kit';

const SERIES = ['var(--chart-1)', 'var(--chart-2)'];

function Legend({ names }: { names: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[0.9375rem]">
      {names.map((n, i) => (
        <li key={n} className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-[3px]" style={{ background: SERIES[i] }} aria-hidden="true" />
          {n}
        </li>
      ))}
    </ul>
  );
}

function TableToggle({ open, onToggle, id }: { open: boolean; onToggle: () => void; id: string }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={id}
      onClick={onToggle}
      className={cn('cursor-pointer rounded-sm text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground', focusRing)}
    >
      {open ? 'Hide table' : 'Show as table'}
    </button>
  );
}

/** Horizontal bars for one series, largest first: label, bar, value. */
export function BarList({ items, format = (v) => money(v) }: { items: { label: string; value: number }[]; format?: (v: number) => string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="group grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 text-[0.9375rem]" title={`${item.label}: ${format(item.value)}`}>
          <span className="truncate">{item.label}</span>
          <span className="h-3" aria-hidden="true">
            <span
              className="block h-full rounded-r-[4px] transition-opacity group-hover:opacity-80"
              style={{ width: `${Math.max((item.value / max) * 100, 1.5)}%`, background: SERIES[0] }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums">{format(item.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Columns per period with two stacked parts (e.g. principal and interest per
 * loan year). Hover or focus a column to see its numbers.
 */
export function StackedColumns({
  title,
  periods,
  series,
  format = (v: number) => money(v),
}: {
  title: string;
  periods: { label: string; values: [number, number] }[];
  series: [string, string];
  format?: (v: number) => string;
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(...periods.map((p) => p.values[0] + p.values[1]), 1);
  const H = 180;
  const shown = active ?? periods.length - 1;

  return (
    <figure>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Legend names={series} />
        <TableToggle open={table} onToggle={() => setTable((t) => !t)} id={`${id}-table`} />
      </div>
      <figcaption className="sr-only">{title}</figcaption>
      <p className="mt-3 min-h-6 text-[0.9375rem]" aria-live="polite">
        <strong>{periods[shown]?.label}:</strong> {series[0].toLowerCase()} {format(periods[shown]?.values[0] ?? 0)}, {series[1].toLowerCase()}{' '}
        {format(periods[shown]?.values[1] ?? 0)}
      </p>
      <div className="mt-2 flex h-[180px] items-end gap-1.5 border-b border-border sm:gap-3" role="list" aria-label={title}>
        {periods.map((p, i) => {
          const [a, b] = p.values;
          const ha = (a / max) * H;
          const hb = (b / max) * H;
          return (
            <button
              key={p.label}
              type="button"
              role="listitem"
              aria-label={`${p.label}: ${series[0]} ${format(a)}, ${series[1]} ${format(b)}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className={cn('flex h-full min-w-0 flex-1 cursor-default flex-col justify-end rounded-t-[4px]', focusRing, active === i && 'bg-muted/70')}
            >
              {/* Top segment, 2px surface gap, bottom segment anchored to the baseline. */}
              {hb > 0 && <span className="mx-auto block w-full max-w-12 rounded-t-[4px]" style={{ height: hb, background: SERIES[1] }} />}
              {hb > 0 && ha > 0 && <span className="block h-[2px]" />}
              {ha > 0 && <span className={cn('mx-auto block w-full max-w-12', hb > 0 ? '' : 'rounded-t-[4px]')} style={{ height: ha, background: SERIES[0] }} />}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-3" aria-hidden="true">
        {periods.map((p) => (
          <span key={p.label} className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground">
            {p.label.replace(/^Year /, '')}
          </span>
        ))}
      </div>
      {table && (
        <table id={`${id}-table`} className="mt-4 w-full text-[0.9375rem]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-1.5 font-semibold" />
              <th className="py-1.5 text-right font-semibold">{series[0]}</th>
              <th className="py-1.5 text-right font-semibold">{series[1]}</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.label} className="border-b border-border">
                <td className="py-1.5">{p.label}</td>
                <td className="py-1.5 text-right tabular-nums">{format(p.values[0])}</td>
                <td className="py-1.5 text-right tabular-nums">{format(p.values[1])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}

/** Two series side by side per category (e.g. car A vs car B per cost type). */
export function PairedBars({
  categories,
  series,
  format = (v: number) => money(v),
}: {
  categories: { label: string; values: [number, number] }[];
  series: [string, string];
  format?: (v: number) => string;
}) {
  const max = Math.max(...categories.flatMap((c) => c.values), 1);
  return (
    <div>
      <Legend names={series} />
      <ul className="mt-4 space-y-4">
        {categories.map((c) => (
          <li key={c.label}>
            <p className="mb-1 text-[0.9375rem] font-semibold">{c.label}</p>
            {c.values.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_6rem] items-center gap-3 text-[0.9375rem]" title={`${series[i]}: ${format(v)}`}>
                <span className="h-3" aria-hidden="true">
                  <span className="block h-full rounded-r-[4px]" style={{ width: `${Math.max((v / max) * 100, 1.5)}%`, background: SERIES[i] }} />
                </span>
                <span className="text-right tabular-nums">
                  <span className="sr-only">{series[i]}: </span>
                  {format(v)}
                </span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Charts for data pages (vehicle reports, data studies). Spec: docs/DATA-VIZ.md.
// All drawn in HTML/SVG and server-rendered, so crawlers read the numbers as text.

/** A lighter step of the series hue, mixed with the card surface (tracks, partial periods). */
const SOFT = 'color-mix(in oklab, var(--chart-1) 50%, var(--card))';
const TRACK = 'color-mix(in oklab, var(--chart-1) 16%, var(--card))';
const count = (n: number) => n.toLocaleString('en-US');

/** Clean axis ticks from 0: steps of 1, 2 or 5 times a power of ten. */
function niceTicks(max: number, target = 4) {
  if (max <= 0) return [0, 1];
  const rough = max / target;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(t);
  return ticks;
}

/** A tiny trend line for a stat tile: 2px line, the latest point marked. */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const W = 120;
  const H = 32;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [3 + (i / (values.length - 1)) * (W - 6), H - 4 - (v / max) * (H - 8)] as const);
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="mt-2 block overflow-visible">
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.55}
      />
      <circle cx={last[0]} cy={last[1]} r={4} fill="var(--chart-1)" stroke="var(--card)" strokeWidth={2} />
    </svg>
  );
}

/** A headline number: label, big value, optional trend and source line. Use inside a <dl>. */
export function StatTile({
  label,
  value,
  trend,
  trendLabel,
  children,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  trend?: number[];
  trendLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-3">
      <dt className="text-[0.9375rem]">{label}</dt>
      <dd className="mt-0.5 font-heading text-3xl font-extrabold tracking-tight">{value}</dd>
      {trend && (
        <dd>
          <Sparkline values={trend} label={trendLabel ?? 'Trend'} />
        </dd>
      )}
      {children && <dd className="mt-1 text-sm text-muted-foreground">{children}</dd>}
    </div>
  );
}

/**
 * One row per item, each a share of the same total (e.g. "59% of complaints name the engine").
 * Every value is printed, so it needs no tooltip or table.
 */
export function MeterList({ items, total, unit = '' }: { items: { label: string; value: number }[]; total: number; unit?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3.5">
      {items.map((item) => {
        const share = total ? (item.value / total) * 100 : 0;
        return (
          <li key={item.label}>
            <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
              <span className="min-w-0">{item.label}</span>
              <span className="shrink-0 text-right">
                <span className="font-semibold">{Math.round(share)}%</span>
                <span className="ml-2 text-muted-foreground tabular-nums">
                  {count(item.value)}
                  {unit}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full" style={{ background: TRACK }} aria-hidden="true">
              {/* Scaled to the largest row, so differences stay visible when shares are small. */}
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((item.value / max) * 100, 1.5)}%`,
                  background: 'var(--chart-1)',
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Columns per period for one series (e.g. complaints filed per year), on a clean y-axis with hairline
 * gridlines. The peak and the latest full period are labeled; hover, tap or focus shows any column;
 * a partial period (the current year) is drawn lighter.
 */
export function ColumnChart({
  title,
  periods,
  valueName,
  format = count,
}: {
  title: string;
  periods: { label: string; value: number; partial?: boolean }[];
  valueName: string;
  format?: (v: number) => string;
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const ticks = niceTicks(Math.max(...periods.map((p) => p.value), 1));
  const top = ticks[ticks.length - 1] || 1;
  const full = periods.filter((p) => !p.partial);
  const peakIndex = periods.reduce((best, p, i) => (p.value > periods[best].value ? i : best), 0);
  const lastFullIndex = full.length ? periods.indexOf(full[full.length - 1]) : -1;
  const labeled = new Set([peakIndex, lastFullIndex]);
  const shown = active ?? lastFullIndex;
  const partial = periods.find((p) => p.partial);

  return (
    <figure>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {partial ? (
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-[3px]" style={{ background: 'var(--chart-1)' }} aria-hidden="true" />
              Full year
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-[3px]" style={{ background: SOFT }} aria-hidden="true" />
              {partial.label} so far
            </li>
          </ul>
        ) : (
          <span />
        )}
        <TableToggle open={table} onToggle={() => setTable((t) => !t)} id={`${id}-table`} />
      </div>
      <figcaption className="sr-only">{title}</figcaption>
      <p className="mt-3 min-h-6 text-[0.9375rem]" aria-live="polite">
        {shown >= 0 && (
          <>
            <strong>
              {periods[shown].label}
              {periods[shown].partial ? ' (so far)' : ''}:
            </strong>{' '}
            {format(periods[shown].value)} {valueName}
          </>
        )}
      </p>
      <div className="mt-2 grid grid-cols-[2.75rem_1fr] gap-2">
        {/* Y-axis tick labels */}
        <div className="relative h-48 text-right text-xs text-muted-foreground tabular-nums" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 leading-none"
              style={{
                bottom: `${(t / top) * 100}%`,
                transform: 'translateY(50%)',
              }}
            >
              {format(t)}
            </span>
          ))}
        </div>
        <div>
          <div className="relative h-48">
            {ticks.map((t) => (
              <span key={t} aria-hidden="true" className="absolute inset-x-0 h-px bg-border" style={{ bottom: `${(t / top) * 100}%` }} />
            ))}
            <div className="relative flex h-full items-end gap-1 sm:gap-2" role="list" aria-label={title}>
              {periods.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  role="listitem"
                  aria-label={`${p.label}${p.partial ? ' so far' : ''}: ${format(p.value)} ${valueName}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(i)}
                  className={cn(
                    'relative flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end rounded-t-[4px]',
                    focusRing,
                    active === i && 'bg-muted/70',
                  )}
                >
                  {labeled.has(i) && (
                    <span className="mb-1 text-xs font-semibold whitespace-nowrap text-foreground">{format(p.value)}</span>
                  )}
                  <span
                    className="block w-full max-w-6 rounded-t-[4px]"
                    style={{
                      height: `${Math.max((p.value / top) * 100, p.value ? 1 : 0)}%`,
                      background: p.partial ? SOFT : 'var(--chart-1)',
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex gap-1 sm:gap-2" aria-hidden="true">
            {periods.map((p) => (
              <span key={p.label} className="min-w-0 flex-1 text-center text-xs text-muted-foreground tabular-nums">
                <span className="sm:hidden">{/^\d{4}$/.test(p.label) ? `'${p.label.slice(2)}` : p.label}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      {table && (
        <table id={`${id}-table`} className="mt-4 w-full text-[0.9375rem]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-1.5 font-semibold">Period</th>
              <th className="py-1.5 text-right font-semibold capitalize">{valueName}</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.label} className="border-b border-border">
                <td className="py-1.5">
                  {p.label}
                  {p.partial ? ' (so far)' : ''}
                </td>
                <td className="py-1.5 text-right tabular-nums">{format(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}

/**
 * Dated events on a year axis (e.g. recalls), numbered to match a list below it.
 * Events close together move to a second row so their markers never overlap.
 */
export function Timeline({
  title,
  from,
  to,
  events,
}: {
  title: string;
  from: number;
  to: number;
  events: { date: string; label: string }[];
}) {
  const start = Date.UTC(from, 0, 1);
  const end = Date.UTC(to + 1, 0, 1);
  const pos = (iso: string) => Math.min(100, Math.max(0, ((Date.parse(`${iso}T00:00:00Z`) - start) / (end - start)) * 100));
  const sorted = events.map((e, i) => ({ ...e, n: i + 1, x: pos(e.date) })).sort((a, b) => a.x - b.x);
  const lanes: number[] = [];
  const placed = sorted.map((e) => {
    let lane = lanes.findIndex((lastX) => e.x - lastX >= 7);
    if (lane === -1) lane = lanes.length;
    lanes[lane] = e.x;
    return { ...e, lane };
  });
  const laneCount = Math.max(1, lanes.length);
  const years: number[] = [];
  const stepYears = to - from > 8 ? 2 : 1;
  for (let y = from; y <= to + 1; y += stepYears) years.push(y);
  const rowH = 30;

  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="relative mx-3" style={{ height: laneCount * rowH + 8 }} aria-hidden="true">
        <span className="absolute inset-x-0 bottom-0 h-px bg-border" />
        {placed.map((e) => (
          <span
            key={e.n}
            className="absolute flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${e.x}%`, bottom: e.lane === 0 ? -7 : 0 }}
          >
            <span className="text-xs font-bold text-foreground">{e.n}</span>
            <span className="mt-0.5 block size-3.5 shrink-0 rounded-full" style={{ background: 'var(--chart-1)', boxShadow: '0 0 0 2px var(--card)' }} />
            {/* A marker lifted to avoid an overlap hangs from a stem down to its date on the axis. */}
            {e.lane > 0 && <span className="w-px bg-muted-foreground/50" style={{ height: e.lane * rowH - 7 }} />}
          </span>
        ))}
      </div>
      <div className="relative mx-3 mt-2 h-4 text-xs text-muted-foreground tabular-nums" aria-hidden="true">
        {years.map((y) => (
          <span
            key={y}
            className="absolute -translate-x-1/2"
            style={{
              left: `${((Date.UTC(y, 0, 1) - start) / (end - start)) * 100}%`,
            }}
          >
            {y}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** A rating out of 5 as stars plus the number. Non-numeric ratings ("Not Rated") show as text. */
export function Stars({ rating }: { rating: string }) {
  const n = /^\d$/.test(rating) ? Number(rating) : null;
  if (n == null) return <span className="text-muted-foreground">{rating || 'Not rated'}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-flex" role="img" aria-label={`${n} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} viewBox="0 0 20 20" className="size-4" aria-hidden="true">
            <path
              d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"
              fill={i <= n ? 'var(--color-sign-yellow)' : 'var(--muted)'}
              stroke={i <= n ? 'var(--chart-2)' : 'var(--border)'}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </span>
      <span className="text-sm font-semibold tabular-nums" aria-hidden="true">
        {n}/5
      </span>
    </span>
  );
}

/**
 * A grid of values (e.g. complaints per model and model-year), shaded in one hue from light (few) to dark
 * (many) in fixed steps, with the number in each cell and a legend. Empty cells (no data) stay blank.
 * Wide grids scroll inside their own box on small screens; a table toggle gives every value as text.
 */
export function Heatmap({
  title,
  rows,
  columns,
  value,
  href,
  steps,
}: {
  title: string;
  rows: string[];
  columns: (string | number)[];
  value: (row: string, column: string | number) => number | null;
  /** Optional link for a cell (e.g. to that vehicle's report). */
  href?: (row: string, column: string | number) => string | undefined;
  /** Upper bounds of each shade, ascending; values above the last bound get the darkest shade. */
  steps: number[];
}) {
  const id = useId();
  const [table, setTable] = useState(false);
  const shades = [16, 34, 52, 72, 100];
  const shadeOf = (v: number) => {
    const i = steps.findIndex((s) => v <= s);
    return i === -1 ? shades.length - 1 : Math.min(i, shades.length - 1);
  };
  const bg = (i: number) => `color-mix(in oklab, var(--chart-1) ${shades[i]}%, var(--card))`;
  const labels = steps.map((s, i) => (i === 0 ? `up to ${count(s)}` : `${count(steps[i - 1] + 1)} to ${count(s)}`));
  labels.push(`over ${count(steps[steps.length - 1])}`);

  return (
    <figure>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Shading">
          {shades.map((_, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-[3px]" style={{ background: bg(i) }} aria-hidden="true" />
              {labels[i]}
            </li>
          ))}
        </ul>
        <TableToggle open={table} onToggle={() => setTable((t) => !t)} id={`${id}-table`} />
      </div>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-separate border-spacing-[2px] text-sm" aria-label={title}>
          <thead>
            <tr>
              <th className="sticky left-0 bg-card" />
              {columns.map((c) => (
                <th key={c} scope="col" className="px-1 pb-1 text-center text-xs font-semibold text-muted-foreground tabular-nums">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <th scope="row" className="sticky left-0 bg-card pr-2 text-left font-semibold whitespace-nowrap">
                  {r}
                </th>
                {columns.map((c) => {
                  const v = value(r, c);
                  if (v == null) return <td key={c} className="rounded-[4px] bg-muted/40" aria-label={`${r} ${c}: no data`} />;
                  const i = shadeOf(v);
                  const link = href?.(r, c);
                  const text = count(v);
                  const cls = cn('block rounded-[4px] px-1 py-1.5 text-center tabular-nums', i >= 3 ? 'font-semibold text-white' : 'text-foreground');
                  return (
                    <td key={c} className="p-0" title={`${r} ${c}: ${text}`}>
                      {link ? (
                        <a href={link} className={cn(cls, 'hover:outline-2 hover:outline-foreground', focusRing)} style={{ background: bg(i) }}>
                          {text}
                        </a>
                      ) : (
                        <span className={cls} style={{ background: bg(i) }}>
                          {text}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table && (
        <table id={`${id}-table`} className="mt-4 w-full text-[0.9375rem]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-1.5 font-semibold" />
              {columns.map((c) => (
                <th key={c} className="py-1.5 text-right font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r} className="border-b border-border">
                <td className="py-1.5">{r}</td>
                {columns.map((c) => {
                  const v = value(r, c);
                  return (
                    <td key={c} className="py-1.5 text-right tabular-nums">
                      {v == null ? '–' : count(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}
