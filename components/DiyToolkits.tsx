import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { JOBS, TOOLS, mid, shopping, toolById, type Level } from '../utils/diyJobs';
import { useReveal, Faq, Field, Panel, PanelTitle, ToolPage, Verdict, focusRing, inputClass, money, moneyRange } from './tool/kit';

const LEVEL_TONE: Record<Level, 'go' | 'caution' | 'stop'> = { Easy: 'go', Moderate: 'caution', Hard: 'stop' };

// A typical year of easy jobs: two oil changes, two rotations, one of each filter and a set of wipers.
const YEAR_PLAN: [string, number][] = [
  ['oil', 2],
  ['rotation', 2],
  ['air-filter', 1],
  ['cabin-filter', 1],
  ['wipers', 1],
];

const FAQS: [string, string][] = [
  [
    'Will doing my own maintenance void my warranty?',
    "No. Federal law (the Magnuson-Moss Warranty Act) protects your right to do your own maintenance. Use parts and fluids that meet your owner's manual specifications and keep receipts and a simple log of dates and mileage.",
  ],
  [
    'What should a beginner start with?',
    'Wiper blades, the engine air filter and the cabin air filter: no lifting, almost no tools, and they save $40 to $70 each time. Then reading your own check engine codes with a $20 to $40 scanner.',
  ],
  [
    'What do I do with used oil and old batteries?',
    'Most auto parts stores take used oil, filters and old batteries for free, and you get a core refund on the battery. Never pour oil down a drain or on the ground.',
  ],
  [
    'Is a jack enough to work under the car?',
    'No. A jack can slip or fail. Always put the car on jack stands (or drive-on ramps) on level, solid ground, chock the wheels, and only then get underneath.',
  ],
];

function loadOwned(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('ownedTools') ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function DiyToolkits() {
  const [jobId, setJobId] = useState('oil');
  const [owned, setOwned] = useState<string[]>([]);
  const [car, setCar] = useState('');
  const detail = useReveal<HTMLElement>();

  useEffect(() => setOwned(loadOwned()), []);
  const toggleOwned = (id: string) =>
    setOwned((o) => {
      const next = o.includes(id) ? o.filter((x) => x !== id) : [...o, id];
      try {
        localStorage.setItem('ownedTools', JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });

  const job = JOBS.find((j) => j.id === jobId)!;
  const saving = mid(job.shop) - mid(job.diyParts);
  const missing = job.tools.filter((t) => !owned.includes(t)).map(toolById);
  const missingCost: [number, number] = missing.reduce<[number, number]>((a, t) => [a[0] + t.price[0], a[1] + t.price[1]], [0, 0]);
  const payback = missing.length && saving > 0 ? Math.max(1, Math.ceil(mid(missingCost) / saving)) : 0;
  const yearSaving = YEAR_PLAN.reduce((sum, [id, times]) => {
    const j = JOBS.find((x) => x.id === id)!;
    return sum + (mid(j.shop) - mid(j.diyParts)) * times;
  }, 0);
  const video = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${job.name} ${car}`.trim())}`;

  return (
    <ToolPage
      category="services"
      title="DIY car repair planner"
      intro="Pick a job to see how hard it is, how long it takes, how much you save over a shop, which tools you're missing and when to leave it to a pro."
      sources="Typical 2026 US shop and parts prices."
    >
      <p className="mb-6 max-w-3xl rounded-lg bg-muted px-4 py-3 text-[0.9375rem]">
        Doing the five easiest jobs yourself (two oil changes, two tire rotations, both air filters and wipers) saves about{' '}
        <strong>{money(Math.round(yearSaving / 10) * 10)} a year</strong>.
      </p>

      <fieldset>
        <legend className="mb-3 font-heading text-xl font-extrabold">Choose a job</legend>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
          {JOBS.map((j) => (
            <label
              key={j.id}
              className={cn(
                'flex cursor-pointer flex-col rounded-lg border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
                jobId === j.id ? 'border-sign-green bg-sign-green/8 ring-1 ring-sign-green' : 'border-input bg-card hover:bg-muted',
              )}
            >
              <input type="radio" name="job" value={j.id} checked={jobId === j.id} onChange={() => {
                  setJobId(j.id);
                  detail.reveal();
                }} className="sr-only" />
              <span className="font-bold leading-snug">{j.name}</span>
              <span className="mt-1 text-sm text-muted-foreground">
                {j.level} · save about {money(Math.round((mid(j.shop) - mid(j.diyParts)) / 5) * 5)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <Panel aria-labelledby="job-title" aria-live="polite" ref={detail.ref} className="scroll-mt-20">
          <div className="flex flex-wrap items-center gap-3">
            <PanelTitle>
              <span id="job-title">{job.name}</span>
            </PanelTitle>
            <Verdict tone={LEVEL_TONE[job.level]}>{job.level}</Verdict>
            <span className="text-[0.9375rem] text-muted-foreground">{job.time}</span>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted p-3">
              <dt className="text-sm text-muted-foreground">At a shop</dt>
              <dd className="font-heading text-xl font-extrabold">{moneyRange(job.shop[0], job.shop[1])}</dd>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <dt className="text-sm text-muted-foreground">Parts yourself</dt>
              <dd className="font-heading text-xl font-extrabold">{job.diyParts[1] ? moneyRange(job.diyParts[0], job.diyParts[1]) : 'Free'}</dd>
            </div>
            <div className="rounded-lg bg-sign-green/10 p-3">
              <dt className="text-sm text-muted-foreground">You save</dt>
              <dd className="font-heading text-xl font-extrabold">about {money(Math.round(saving / 5) * 5)}</dd>
            </div>
          </dl>

          <h3 className="mt-6 font-bold">Steps</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[0.9375rem]">
            {job.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Field label="Your car (for a how-to video)" htmlFor="diy-car">
              <input id="diy-car" value={car} onChange={(e) => setCar(e.target.value)} placeholder="e.g. 2017 Honda Civic" maxLength={60} className={inputClass} />
            </Field>
            <a
              href={video}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('inline-flex h-11 items-center justify-center rounded-lg border border-input bg-card px-4 font-semibold hover:bg-muted', focusRing)}
            >
              Watch how-to videos
            </a>
          </div>

          <p className="mt-5 rounded-lg border-l-4 border-sign-yellow bg-sign-yellow/15 px-4 py-3 text-[0.9375rem]">
            <strong>When to use a pro:</strong> {job.pro}
          </p>
          {job.id === 'codes' && (
            <p className="mt-4 text-[0.9375rem]">
              Got a code?{' '}
              <Link to="/fault-code-decoder" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                Look it up here
              </Link>{' '}
              for likely causes and repair costs.
            </p>
          )}
        </Panel>

        <Panel aria-labelledby="tools-title">
          <PanelTitle>
            <span id="tools-title">Tools for this job</span>
          </PanelTitle>
          {job.tools.length === 0 ? (
            <p className="mt-2 text-[0.9375rem] text-muted-foreground">No tools needed.</p>
          ) : (
            <>
              <ul className="mt-3 space-y-1">
                {job.tools.map(toolById).map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3 py-1">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[0.9375rem]">
                      <input type="checkbox" checked={owned.includes(t.id)} onChange={() => toggleOwned(t.id)} className="mt-1 size-4 shrink-0 accent-sign-green" />
                      <span className={cn(owned.includes(t.id) && 'text-muted-foreground line-through')}>{t.name}</span>
                    </label>
                    {!owned.includes(t.id) && (
                      <a href={shopping(t)} target="_blank" rel="noopener noreferrer nofollow" className={cn('inline-flex shrink-0 items-center rounded-sm text-sm font-semibold underline underline-offset-4 pointer-coarse:min-h-11', focusRing)}>
                        {moneyRange(t.price[0], t.price[1])}
                        <span className="sr-only"> (shop for {t.name})</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">Tick what you already own. We remember it on this device.</p>
              <p className="mt-4 text-[0.9375rem]" aria-live="polite">
                {missing.length === 0 ? (
                  <strong>You have everything you need.</strong>
                ) : (
                  <>
                    Missing tools: <strong>{moneyRange(missingCost[0], missingCost[1])}</strong>.{' '}
                    {payback <= 1 ? 'They pay for themselves the first time.' : `They pay for themselves after about ${payback} jobs.`}
                  </>
                )}
              </p>
            </>
          )}
        </Panel>
      </div>

      <Panel aria-labelledby="kit-title" className="mt-6">
        <PanelTitle>
          <span id="kit-title">Roadside emergency kit</span>
        </PanelTitle>
        <p className="mt-1 text-[0.9375rem] text-muted-foreground">Five things that turn a dead battery, a flat or a crash into a small problem instead of a tow.</p>
        <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
          {TOOLS.filter((t) => t.emergency).map((t) => (
            <li key={t.id} className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-[0.9375rem]">
              <span>{t.name}</span>
              <a href={shopping(t)} target="_blank" rel="noopener noreferrer nofollow" className={cn('shrink-0 rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                {moneyRange(t.price[0], t.price[1])}
                <span className="sr-only"> (shop for {t.name})</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">Prices are typical ranges; links open a product search.</p>
      </Panel>

      <Faq id="diy-faq" title="Questions about DIY car maintenance" items={FAQS} />
    </ToolPage>
  );
}
