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
      className={cn('inline-flex cursor-pointer items-center rounded-sm text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground pointer-coarse:min-h-11', focusRing)}
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
