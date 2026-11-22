import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Cause, CodeExplanation, Diagnosis, DriveVerdict } from '../../utils/diagnosis';
import { Notice, NumberField, Panel, PanelTitle, SecondaryButton, Spinner, Verdict, money, moneyRange } from '../tool/kit';

const DRIVE_TONE: Record<DriveVerdict, 'go' | 'caution' | 'stop'> = {
  'Safe to drive': 'go',
  'Drive with caution': 'caution',
  'Stop driving': 'stop',
};

function CodeCard({ code }: { code: CodeExplanation }) {
  return (
    <Panel>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <span className="rounded-lg bg-sign-yellow px-3 py-1.5 font-mono text-xl font-bold tracking-wider text-sign-ink">{code.code}</span>
        <div className="min-w-0 flex-1 basis-60">
          <h2 className="font-heading text-xl leading-snug font-extrabold">{code.title}</h2>
          {code.system && <p className="text-[0.9375rem] text-muted-foreground">{code.system}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Verdict tone={DRIVE_TONE[code.drive]}>{code.drive}</Verdict>
        <Verdict tone="neutral">{code.severity} severity</Verdict>
      </div>
      {code.driveAdvice && <p className="mt-3 font-semibold">{code.driveAdvice}</p>}
      <p className="mt-3 leading-relaxed">{code.meaning}</p>
      {code.symptoms.length > 0 && (
        <>
          <h3 className="mt-4 text-[0.9375rem] font-bold">What you may notice</h3>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {code.symptoms.map((s) => (
              <li key={s} className="rounded-md bg-muted px-2.5 py-1 text-[0.9375rem]">
                {s}
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

const LIKELIHOOD_STYLE: Record<Cause['likelihood'], string> = {
  'Most likely': 'bg-sign-green text-white',
  Likely: 'bg-sign-green/15 text-sign-green dark:text-emerald-300',
  Possible: 'bg-muted text-foreground',
  'Less likely': 'bg-muted text-muted-foreground',
};

function CauseRow({ cause, rate }: { cause: Cause; rate: number }) {
  const low = cause.partsLow + cause.laborHoursLow * rate;
  const high = cause.partsHigh + cause.laborHoursHigh * rate;
  const hours =
    cause.laborHoursLow === cause.laborHoursHigh ? `${cause.laborHoursLow}` : `${cause.laborHoursLow} to ${cause.laborHoursHigh}`;
  return (
    <li className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          <h3 className="text-lg font-extrabold">{cause.cause}</h3>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <span className={cn('rounded-md px-2 py-0.5 text-sm font-bold', LIKELIHOOD_STYLE[cause.likelihood])}>{cause.likelihood}</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-semibold">{cause.diy}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-xl font-extrabold tabular-nums">{moneyRange(low, high)}</p>
          <p className="text-sm text-muted-foreground">
            parts {moneyRange(cause.partsLow, cause.partsHigh)} + {hours} h labor
          </p>
        </div>
      </div>
      <dl className="mt-3 grid gap-2 text-[0.9375rem] sm:grid-cols-[8rem_1fr]">
        <dt className="font-semibold">How to confirm</dt>
        <dd className="text-muted-foreground">{cause.howToConfirm}</dd>
        <dt className="font-semibold">Fix</dt>
        <dd className="text-muted-foreground">{cause.fix}</dd>
      </dl>
    </li>
  );
}

export default function DiagnosisView({
  diagnosis,
  fallback,
  loading,
  error,
  onRetry,
  laborRate,
  onLaborRateChange,
}: {
  diagnosis: Diagnosis | null;
  /** Instant answers from the built-in code list, shown while the full analysis loads. */
  fallback: CodeExplanation[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  laborRate: string;
  onLaborRateChange: (value: string) => void;
}) {
  const codes = diagnosis?.codes.length ? diagnosis.codes : fallback;
  const rate = Math.max(0, Number(laborRate) || 0);

  return (
    <div className="space-y-6">
      {codes.map((c) => (
        <CodeCard key={c.code} code={c} />
      ))}

      {loading && (
        <Panel>
          <Spinner size="xl" label="Working out the likely causes and repair costs…" />
        </Panel>
      )}

      {error && (
        <Notice tone="error" title="The full analysis didn't load">
          <p>{error}</p>
          <SecondaryButton type="button" onClick={onRetry} className="mt-3 h-10">
            Try again
          </SecondaryButton>
        </Notice>
      )}

      {diagnosis && (
        <>
          {diagnosis.combined && (
            <Notice tone="info" title="How these codes fit together">
              {diagnosis.combined}
            </Notice>
          )}

          {diagnosis.causes.length > 0 && (
            <Panel aria-labelledby="causes-title">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <PanelTitle>
                    <span id="causes-title">Likely causes and repair costs</span>
                  </PanelTitle>
                  <p className="mt-1 text-[0.9375rem] text-muted-foreground">Most likely first. Costs are parts plus labor at your shop's rate.</p>
                </div>
                <div className="w-44">
                  <NumberField id="labor-rate" label="Shop labor rate" value={laborRate} onChange={onLaborRateChange} prefix="$" suffix="/hr" step="5" />
                </div>
              </div>
              <ul>
                {diagnosis.causes.map((c) => (
                  <CauseRow key={c.cause} cause={c} rate={rate} />
                ))}
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                AI estimates using typical US parts prices and book labor times, at {money(rate)} per hour. Confirm the diagnosis before you pay
                for parts.
              </p>
            </Panel>
          )}

          {diagnosis.quickChecks.length > 0 && (
            <Panel aria-labelledby="checks-title">
              <PanelTitle>
                <span id="checks-title">Check these first</span>
              </PanelTitle>
              <p className="mt-1 text-[0.9375rem] text-muted-foreground">Free or cheap things to rule out before paying for a repair.</p>
              <ul className="mt-4 space-y-2.5">
                {diagnosis.quickChecks.map((q) => (
                  <li key={q} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-sign-green" aria-hidden="true" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {diagnosis.watchOut && (
            <Notice tone="warning" title="Watch out for">
              {diagnosis.watchOut}
            </Notice>
          )}
        </>
      )}
    </div>
  );
}
