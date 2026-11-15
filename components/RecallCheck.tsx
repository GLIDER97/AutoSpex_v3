import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatComponent, componentName } from '../utils/nhtsa';
import { latestFeaturedRecalls, searchRecalls, type Recall } from '../utils/nhtsaRecalls';
import { searchComplaints, type ComplaintSummary } from '../utils/nhtsaComplaints';
import { checkVin, decodeVin } from '../utils/vehicleReport';
import { BarList } from './tool/charts';
import { Faq, Field, Notice, Panel, PanelTitle, PrimaryButton, SecondaryButton, Spinner, ToolPage, VehicleFields, focusRing, hasVehicle, inputClass, type Vehicle } from './tool/kit';

const FAQS: [string, string][] = [
  [
    'Is a recall repair really free?',
    "Yes. By federal law the manufacturer must fix a safety defect for free at an authorized dealer, as long as the vehicle was no more than 15 years old when the recall was announced. You don't need to be the first owner or have bought it from that dealer.",
  ],
  [
    'Does this show recalls for my exact car?',
    'It shows every recall NHTSA has for that model and year. Some only cover cars built in certain plants or date ranges, and some may already be fixed on yours. To see which are still open on your car, enter your VIN on NHTSA’s recall page (linked with your results) or call a dealer.',
  ],
  [
    'I paid for this repair before the recall. Can I get my money back?',
    'Often yes. Manufacturers must have a plan to reimburse owners who paid for the fix before the recall. Keep the receipt and ask the dealer or the manufacturer’s customer service.',
  ],
  [
    'Can a dealer sell me a used car with an open recall?',
    'In most states, yes: only rental companies are barred from renting cars with open recalls. Always check a used car’s VIN before you buy, and ask the seller to get open recalls fixed first.',
  ],
  [
    'What if parts aren’t available yet?',
    'Ask the dealer to put you on the list and, for serious recalls, whether the manufacturer offers a loaner or rental. If the recall says not to drive the car, ask about towing to the dealer at no cost.',
  ],
];

function RecallCard({ recall, vin }: { recall: Recall; vin: string }) {
  const [copied, setCopied] = useState(false);
  const script = `Hi, I'd like to schedule a free recall repair. It's NHTSA campaign ${recall.campaignNumber} (${formatComponent(recall.component).toLowerCase()}) for my ${recall.modelYear} ${recall.make} ${recall.model}${vin ? `, VIN ${vin}` : ''}. Are parts available, and how long will it take?`;
  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        {recall.parkIt && <span className="rounded-md bg-sign-red px-2.5 py-1 text-sm font-bold text-white">Do not drive</span>}
        {recall.parkOutside && <span className="rounded-md bg-sign-yellow px-2.5 py-1 text-sm font-bold text-sign-ink">Park outside</span>}
        <span className="text-sm text-muted-foreground">
          {recall.reportDate} · Campaign {recall.campaignNumber}
          {recall.model ? ` · ${recall.model}` : ''}
        </span>
      </div>
      <h3 className="mt-2 font-heading text-lg leading-snug font-extrabold">{formatComponent(recall.component)}</h3>
      <p className="mt-2 text-[0.9375rem] leading-relaxed">{recall.summary}</p>
      {recall.consequence && (
        <p className="mt-3 text-[0.9375rem] leading-relaxed">
          <strong>Risk:</strong> {recall.consequence}
        </p>
      )}
      {recall.remedy && (
        <p className="mt-2 text-[0.9375rem] leading-relaxed">
          <strong>Free fix:</strong> {recall.remedy}
        </p>
      )}
      <details className="mt-3">
        <summary className={cn('cursor-pointer rounded-sm font-semibold underline underline-offset-4', focusRing)}>What to say to the dealer</summary>
        <p className="mt-2 rounded-lg bg-muted p-3 text-[0.9375rem]">{script}</p>
        <SecondaryButton
          type="button"
          className="mt-2 h-9"
          onClick={() => {
            navigator.clipboard?.writeText(script).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
        >
          <Copy className="size-4" aria-hidden="true" /> {copied ? 'Copied' : 'Copy'}
        </SecondaryButton>
      </details>
    </li>
  );
}

interface Result {
  label: string;
  vin: string;
  recalls: Recall[];
  models: string[];
  complaints: ComplaintSummary | null;
}

export default function RecallCheck() {
  const [mode, setMode] = useState<'vin' | 'model'>('vin');
  const [vinInput, setVinInput] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [part, setPart] = useState('all');
  const [feed, setFeed] = useState<Recall[] | null>(null);
  const [feedFailed, setFeedFailed] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    latestFeaturedRecalls()
      .then(setFeed)
      .catch(() => setFeedFailed(true));
  }, []);

  const run = async (v: Vehicle, vin: string) => {
    const id = ++latest.current;
    setLoading(true);
    setError(null);
    setPart('all');
    try {
      const year = Number(v.year);
      const [search, complaints] = await Promise.all([
        searchRecalls(year, v.make.trim(), v.model.trim()),
        searchComplaints(year, v.make.trim(), v.model.trim()).catch(() => null),
      ]);
      if (id !== latest.current) return;
      const label = `${v.year} ${search.make ?? v.make} ${search.models[0] ?? v.model}`;
      setResult({ label, vin, recalls: search.recalls, models: search.models, complaints });
    } catch {
      if (id === latest.current) setError("NHTSA's recall database couldn't be reached. Please try again in a minute.");
    } finally {
      if (id === latest.current) setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'model') {
      if (!hasVehicle(vehicle)) return setError('Enter the year, make and model.');
      return run(vehicle, '');
    }
    const { vin, problem } = checkVin(vinInput);
    if (problem) {
      return setError(
        problem === 'length'
          ? 'A VIN has 17 characters. Check the windshield corner on the driver’s side or your registration.'
          : problem === 'characters'
            ? 'VINs never use the letters I, O or Q. Did you mean 1 or 0?'
            : 'This VIN doesn’t pass the check-digit test, so one character is probably mistyped.',
      );
    }
    setLoading(true);
    setError(null);
    try {
      const decoded = await decodeVin(vin);
      const v = { year: decoded.fields.ModelYear ?? '', make: decoded.fields.Make ?? '', model: decoded.fields.Model ?? '' };
      if (!hasVehicle(v)) {
        setLoading(false);
        return setError("NHTSA couldn't identify this VIN. Try searching by year, make and model instead.");
      }
      await run(v, vin);
    } catch {
      setLoading(false);
      setError("NHTSA's VIN decoder couldn't be reached. Please try again.");
    }
  };

  const recalls = result?.recalls ?? [];
  const parts = [...new Set(recalls.map((r) => componentName(r.component.split(':')[0])))].sort();
  const shown = part === 'all' ? recalls : recalls.filter((r) => componentName(r.component.split(':')[0]) === part);
  const urgent = recalls.filter((r) => r.parkIt || r.parkOutside);
  const sorted = [...shown].sort((a, b) => Number(b.parkIt) - Number(a.parkIt) || Number(b.parkOutside) - Number(a.parkOutside));

  return (
    <ToolPage
      category="warnings"
      title="Car recall check"
      intro="Enter your VIN or your car's year, make and model to see every safety recall, the ones that say stop driving first, and exactly what to tell the dealer to get the free repair."
      sources="NHTSA recalls, owner complaints and VIN decoder (api.nhtsa.gov, vpic.nhtsa.dot.gov)."
    >
      <Panel className="max-w-3xl">
        <div className="inline-flex rounded-lg border border-input p-0.5" role="group" aria-label="Search by">
          {(
            [
              ['vin', 'VIN'],
              ['model', 'Year, make and model'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => {
                setMode(id);
                setError(null);
              }}
              className={cn('cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold', mode === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground', focusRing)}
            >
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={submit} noValidate className="mt-4 space-y-4">
          {mode === 'vin' ? (
            <Field label="VIN (17 characters)" htmlFor="recall-vin" hint="On the dashboard by the windshield, the driver’s door jamb, or your registration and insurance card.">
              <input
                id="recall-vin"
                value={vinInput}
                onChange={(e) => setVinInput(e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 17))}
                autoComplete="off"
                spellCheck={false}
                className={cn(inputClass, 'font-mono tracking-wider uppercase')}
              />
            </Field>
          ) : (
            <VehicleFields value={vehicle} onChange={setVehicle} required />
          )}
          <PrimaryButton type="submit" loading={loading}>
            Check recalls
          </PrimaryButton>
          {error && <Notice tone="error">{error}</Notice>}
        </form>
      </Panel>

      <section className="mt-8" aria-live="polite" aria-busy={loading}>
        {loading && !result && <Spinner label="Checking NHTSA…" />}
        {result && (
          <div className={cn('space-y-6', loading && 'opacity-60')}>
            <div>
              <h2 className="font-heading text-2xl font-extrabold">
                {recalls.length === 0
                  ? `No recalls on record for the ${result.label}`
                  : `${recalls.length} ${recalls.length === 1 ? 'recall' : 'recalls'} for the ${result.label}`}
              </h2>
              {result.models.length > 1 && <p className="mt-1 text-[0.9375rem] text-muted-foreground">Includes {result.models.join(', ')}.</p>}
            </div>

            {urgent.length > 0 && (
              <Notice tone="error" title={`${urgent.length} ${urgent.length === 1 ? 'recall says' : 'recalls say'} to ${urgent.some((r) => r.parkIt) ? 'stop driving' : 'park outside'}`}>
                {urgent.some((r) => r.parkIt)
                  ? 'NHTSA advises not driving affected vehicles until they are repaired. Call a dealer now; ask about free towing.'
                  : 'There is a fire risk: park outside and away from buildings until the repair is done.'}
              </Notice>
            )}

            {recalls.length > 0 && (
              <Notice tone="info" title="Which of these are still open on your car?">
                Some recalls cover only part of a model's production, and some may already be fixed on yours.{' '}
                {result.vin ? (
                  <>
                    Enter your VIN <span className="font-mono">{result.vin}</span> on{' '}
                  </>
                ) : (
                  'Enter your VIN on '
                )}
                <a href="https://www.nhtsa.gov/recalls" target="_blank" rel="noopener noreferrer" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                  NHTSA's recall page
                </a>{' '}
                or ask any dealer for your brand. The repair is free.
              </Notice>
            )}

            {parts.length > 1 && (
              <Field label="Show recalls for" htmlFor="recall-part" className="max-w-xs">
                <select id="recall-part" value={part} onChange={(e) => setPart(e.target.value)} className={inputClass}>
                  <option value="all">All parts ({recalls.length})</option>
                  {parts.map((p) => (
                    <option key={p} value={p}>
                      {p} ({recalls.filter((r) => componentName(r.component.split(':')[0]) === p).length})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {sorted.length > 0 && (
              <ul className="space-y-4">
                {sorted.map((r) => (
                  <RecallCard key={r.campaignNumber} recall={r} vin={result.vin} />
                ))}
              </ul>
            )}

            {result.complaints && result.complaints.total > 0 && (
              <Panel aria-labelledby="complaints-title">
                <PanelTitle>
                  <span id="complaints-title">What owners report (not recalls)</span>
                </PanelTitle>
                <p className="mt-1 text-[0.9375rem] text-muted-foreground">
                  {result.complaints.total.toLocaleString('en-US')} complaints filed with NHTSA
                  {result.complaints.crashes ? `, ${result.complaints.crashes} involving a crash` : ''}
                  {result.complaints.fires ? `, ${result.complaints.fires} a fire` : ''}. Many complaints about one part can come before a recall.
                </p>
                <div className="mt-4">
                  <BarList items={result.complaints.byComponent.slice(0, 6).map((c) => ({ label: c.label, value: c.count }))} format={(v) => v.toLocaleString('en-US')} />
                </div>
                <p className="mt-4 text-[0.9375rem]">
                  Want the full picture?{' '}
                  <Link to="/vin-lookup" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                    Get a free VIN report
                  </Link>{' '}
                  with crash ratings, specs and these complaints.
                </p>
              </Panel>
            )}
          </div>
        )}
      </section>

      {!result && (
        <section className="mt-10" aria-labelledby="feed-title">
          <h2 id="feed-title" className="font-heading text-2xl font-extrabold">
            Latest recalls on best-selling vehicles
          </h2>
          {feed === null && !feedFailed && (
            <div className="mt-4">
              <Spinner label="Loading the latest recalls…" />
            </div>
          )}
          {feedFailed && <p className="mt-3 text-muted-foreground">NHTSA's latest recalls couldn't be loaded right now.</p>}
          {feed && (
            <ul className="mt-4 space-y-4">
              {feed.map((r) => (
                <RecallCard key={r.campaignNumber} recall={r} vin="" />
              ))}
            </ul>
          )}
        </section>
      )}

      <Faq id="recall-faq" title="Questions about recalls" items={FAQS} />
    </ToolPage>
  );
}
