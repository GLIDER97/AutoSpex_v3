// Shared building blocks for every tool page, in the road-sign design system:
// flat panels, Overpass type, sign colors that keep their road meaning
// (green = go/guidance, yellow = caution, red = stop, blue = services).
import React, { useEffect, useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCategoryId } from '../../data/tools';
import { SignMarker } from '../brand';
import { listEpaMakes, listEpaModels } from '../../utils/fuelEconomy';

export const focusRing =
  'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export const inputClass = cn(
  'h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base text-foreground',
  'placeholder:text-muted-foreground/70 disabled:opacity-60',
  'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
);

export const money = (n: number, digits = 0) =>
  Number.isFinite(n)
    ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits })
    : '–';

export const moneyRange = (low: number, high: number) =>
  Math.round(low) === Math.round(high) ? money(low) : `${money(low)} to ${money(high)}`;

// ---------------------------------------------------------------------------

export function ToolPage({
  category,
  title,
  intro,
  sources,
  children,
}: {
  category: ToolCategoryId;
  title: string;
  intro: React.ReactNode;
  /** Where this tool's answers come from, in plain words. */
  sources?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-6xl">
      <header className="mb-8 max-w-3xl">
        <h1 className="flex items-start gap-3 font-heading text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl">
          <SignMarker category={category} className="mt-2 size-7 sm:mt-3 sm:size-8" />
          <span>{title}</span>
        </h1>
        <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">{intro}</p>
        {sources && <p className="mt-3 text-sm text-muted-foreground">Data: {sources}</p>}
      </header>
      {children}
    </div>
  );
}

export function Panel({ className, children, ...props }: React.ComponentProps<'section'>) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5 sm:p-6', className)} {...props}>
      {children}
    </section>
  );
}

export function PanelTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('font-heading text-xl font-extrabold tracking-[-0.01em]', className)}>{children}</h2>;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.9375rem] font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** A number input with an optional unit before or after the value ($, /hr, mi ...). */
export function NumberField({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  step = 'any',
  min = 0,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: React.ReactNode;
  step?: string;
  min?: number;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">{prefix}</span>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, prefix && 'pl-7', suffix && 'pr-14')}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

export function PrimaryButton({ className, children, loading, ...props }: React.ComponentProps<'button'> & { loading?: boolean }) {
  return (
    <button
      className={cn(
        'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-sign-green px-5 text-base font-bold whitespace-nowrap text-white',
        'transition-colors hover:bg-sign-green-strong disabled:cursor-not-allowed disabled:opacity-60',
        focusRing,
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function SecondaryButton({ className, children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 text-base font-semibold whitespace-nowrap',
        'transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60',
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const NOTICE_TONES = {
  info: 'border-sign-blue bg-sign-blue/8',
  warning: 'border-sign-yellow bg-sign-yellow/15',
  error: 'border-sign-red bg-sign-red/8',
  success: 'border-sign-green bg-sign-green/8',
};

export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof NOTICE_TONES;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={cn('rounded-lg border-l-4 px-4 py-3', NOTICE_TONES[tone], className)}>
      {title && <p className="font-bold">{title}</p>}
      {children && <div className={cn('text-[0.9375rem] leading-relaxed', title && 'mt-0.5')}>{children}</div>}
    </div>
  );
}

const VERDICT_TONES = {
  go: 'bg-sign-green text-white',
  caution: 'bg-sign-yellow text-sign-ink',
  stop: 'bg-sign-red text-white',
  neutral: 'bg-muted text-foreground',
};

/** A traffic-signal colored label: green go, yellow caution, red stop. */
export function Verdict({ tone, children, className }: { tone: keyof typeof VERDICT_TONES; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2.5 py-1 text-sm font-bold', VERDICT_TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <p role="status" className="flex items-center gap-2 text-[0.9375rem] text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Year / make / model with suggestions from the EPA's vehicle lists.
// ---------------------------------------------------------------------------

export interface Vehicle {
  year: string;
  make: string;
  model: string;
}

export const vehicleLabel = (v: Vehicle) => [v.year, v.make, v.model].filter(Boolean).join(' ');
export const hasVehicle = (v: Vehicle) => Boolean(v.year && v.make.trim() && v.model.trim());

const suggestionCache = new Map<string, Promise<string[]>>();
function cached(key: string, load: () => Promise<string[]>) {
  if (!suggestionCache.has(key)) suggestionCache.set(key, load().catch(() => []));
  return suggestionCache.get(key)!;
}

export function VehicleFields({
  value,
  onChange,
  minYear = 1984,
  required = false,
  optionalLabel = false,
}: {
  value: Vehicle;
  onChange: (vehicle: Vehicle) => void;
  minYear?: number;
  required?: boolean;
  /** Adds "(optional)" to the labels. */
  optionalLabel?: boolean;
}) {
  const id = useId();
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const latestYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: latestYear - minYear + 1 }, (_, i) => String(latestYear - i));
  const suffix = optionalLabel ? ' (optional)' : '';

  useEffect(() => {
    if (!value.year) return setMakes([]);
    let live = true;
    cached(`makes:${value.year}`, () => listEpaMakes(Number(value.year))).then((list) => live && setMakes(list));
    return () => {
      live = false;
    };
  }, [value.year]);

  const epaMake = makes.find((m) => m.toLowerCase() === value.make.trim().toLowerCase());
  useEffect(() => {
    if (!value.year || !epaMake) return setModels([]);
    let live = true;
    cached(`models:${value.year}:${epaMake}`, () => listEpaModels(Number(value.year), epaMake)).then(
      (list) => live && setModels(list),
    );
    return () => {
      live = false;
    };
  }, [value.year, epaMake]);

  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 sm:grid-cols-[7rem_1fr_1fr]">
      <Field label={`Year${suffix}`} htmlFor={`${id}-year`}>
        <select
          id={`${id}-year`}
          value={value.year}
          required={required}
          onChange={(e) => onChange({ ...value, year: e.target.value })}
          className={cn(inputClass, 'pr-2')}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Field>
      <Field label={`Make${suffix}`} htmlFor={`${id}-make`}>
        <input
          id={`${id}-make`}
          list={`${id}-makes`}
          value={value.make}
          required={required}
          autoComplete="off"
          placeholder="Honda"
          onChange={(e) => onChange({ ...value, make: e.target.value })}
          className={inputClass}
        />
        <datalist id={`${id}-makes`}>
          {makes.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </Field>
      <Field label={`Model${suffix}`} htmlFor={`${id}-model`} className="col-span-2 sm:col-span-1">
        <input
          id={`${id}-model`}
          list={`${id}-models`}
          value={value.model}
          required={required}
          autoComplete="off"
          placeholder="Civic"
          onChange={(e) => onChange({ ...value, model: e.target.value })}
          className={inputClass}
        />
        <datalist id={`${id}-models`}>
          {models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </Field>
    </div>
  );
}

/** A labelled list of facts (spec sheet style). */
export function FactList({ items, className }: { items: [string, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn('divide-y divide-border', className)}>
      {items.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 py-2.5 text-[0.9375rem]">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Questions and answers as native disclosure rows (keyboard and screen-reader friendly). */
export function Faq({ id, title, items, className }: { id: string; title: string; items: [string, React.ReactNode][]; className?: string }) {
  return (
    <section className={cn('mt-16 max-w-3xl', className)} aria-labelledby={id}>
      <h2 id={id} className="font-heading text-2xl font-extrabold">
        {title}
      </h2>
      <div className="mt-4 divide-y divide-border border-y border-border">
        {items.map(([q, a]) => (
          <details key={q} className="group py-4">
            <summary className={cn('cursor-pointer list-none font-bold marker:hidden', focusRing)}>
              <span className="flex items-center justify-between gap-4">
                {q}
                <span aria-hidden="true" className="text-xl text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <div className="mt-2 text-muted-foreground">{a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

/** The visitor's ZIP code, remembered across tools on this device. */
export function rememberedZip(): string {
  try {
    return /^\d{5}$/.test(localStorage.getItem('zip') ?? '') ? (localStorage.getItem('zip') as string) : '';
  } catch {
    return '';
  }
}
export function rememberZip(zip: string) {
  try {
    if (/^\d{5}$/.test(zip)) localStorage.setItem('zip', zip);
  } catch {
    /* storage unavailable */
  }
}

/** A row of radio choices shown as chips (or cards when options have details). */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  columns,
  className,
}: {
  legend: string;
  name: string;
  options: { id: T; label: string; detail?: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Grid columns for card-style options; chips wrap when omitted. */
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="mb-2 text-[0.9375rem] font-semibold">{legend}</legend>
      <div className={cn(columns ? cn('grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-3') : 'flex flex-wrap gap-2')}>
        {options.map((o) => (
          <label
            key={o.id}
            className={cn(
              'cursor-pointer rounded-lg border transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
              o.detail ? 'p-3' : 'px-3.5 py-2 font-semibold',
              value === o.id ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/60',
            )}
          >
            <input type="radio" name={name} className="sr-only" checked={value === o.id} onChange={() => onChange(o.id)} />
            {o.detail ? (
              <>
                <span className="block font-bold">{o.label}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{o.detail}</span>
              </>
            ) : (
              o.label
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
