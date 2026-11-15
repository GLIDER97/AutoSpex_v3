import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Copy, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import SecondOpinionForm from './SecondOpinionForm';
import {
  LINE_TYPES,
  auditQuote,
  photoToJpegBase64,
  quoteMath,
  readEstimatePhoto,
  type QuoteAudit,
  type QuoteInput,
  type QuoteLine,
} from '../utils/quoteAudit';
import {
  Field,
  Notice,
  Panel,
  PanelTitle,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  ToolPage,
  Verdict,
  VehicleFields,
  focusRing,
  hasVehicle,
  inputClass,
  money,
  moneyRange,
  vehicleLabel,
  type Vehicle,
} from './tool/kit';

type EditableLine = { description: string; type: QuoteLine['type']; quantity: string; amount: string };

const BLANK_LINE: EditableLine = { description: '', type: 'Job', quantity: '1', amount: '' };
const SHOP_TYPES: QuoteInput['shopType'][] = ['Independent shop', 'Dealer', 'Chain shop', 'Not sure'];

const VERDICT_TONE = { Fair: 'go', 'A bit high': 'caution', 'Too high': 'stop', Low: 'neutral' } as const;
const LINE_TONE = { Fair: 'go', High: 'caution', 'Too high': 'stop', Low: 'neutral', 'Question it': 'caution' } as const;

const toLines = (rows: EditableLine[]): QuoteLine[] =>
  rows
    .map((r) => ({ description: r.description.trim(), type: r.type, quantity: Number(r.quantity) || 1, amount: Number(r.amount) || 0 }))
    .filter((l) => l.description && l.amount > 0);

/** Where the quote sits against the fair range. */
function RangeBar({ quoted, low, high }: { quoted: number; low: number; high: number }) {
  const min = Math.min(low, quoted) * 0.85;
  const max = Math.max(high, quoted) * 1.1;
  const pos = (v: number) => `${((v - min) / (max - min || 1)) * 100}%`;
  return (
    <div className="mt-5" aria-hidden="true">
      <div className="relative h-3 rounded-full bg-muted">
        <div className="absolute inset-y-0 rounded-full bg-sign-green/70" style={{ left: pos(low), width: `calc(${pos(high)} - ${pos(low)})` }} />
        <div className="absolute -top-1.5 h-6 w-1 -translate-x-1/2 rounded-full bg-foreground" style={{ left: pos(quoted) }} />
      </div>
      <div className="relative mt-2 h-6 text-sm">
        <span className="absolute -translate-x-1/2 whitespace-nowrap font-semibold" style={{ left: pos(quoted) }}>
          Your quote
        </span>
      </div>
    </div>
  );
}

const FAQS = [
  ['How is the quote checked?', 'Each line is compared with typical US prices for that job: standard labor-guide hours at local shop rates and typical aftermarket-to-OEM parts prices, using AI (Anthropic’s Claude). Totals, labor hours and the hourly rate are calculated exactly from your numbers.'],
  ['Is the photo stored?', 'No. The photo is shrunk in your browser and sent to our AI provider only to read the line items. MyAutoSpex doesn’t keep it. You can cover your name and address before taking the photo.'],
  ['Why is a dealer quote higher?', 'Dealers usually charge higher hourly rates and use factory (OEM) parts. That can be worth it for warranty or complex work, so the check accounts for the shop type you choose.'],
  ['The quote is above the fair range. What now?', 'Ask the questions listed, use the suggested script, and get a second quote. A higher price can be justified by rusted parts, extra damage or premium parts, so ask the shop to show you why.'],
];

const MaintenanceValidator: React.FC = () => {
  const [mode, setMode] = useState<'photo' | 'type'>('photo');
  const [rows, setRows] = useState<EditableLine[]>([{ ...BLANK_LINE }]);
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [zip, setZip] = useState('');
  const [shopType, setShopType] = useState<QuoteInput['shopType']>('Independent shop');
  const [reading, setReading] = useState(false);
  const [readNote, setReadNote] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [audit, setAudit] = useState<{ input: QuoteInput; result: QuoteAudit } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondOpinionOpen, setSecondOpinionOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const lines = toLines(rows);
  const math = quoteMath(lines);

  const update = (i: number, patch: Partial<EditableLine>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const check = async (input: QuoteInput) => {
    setChecking(true);
    setError(null);
    try {
      const result = await auditQuote(input);
      setAudit({ input, result });
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The check failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setReadNote(null);
    setAudit(null);
    try {
      const base64 = await photoToJpegBase64(file);
      setPreview(`data:image/jpeg;base64,${base64}`);
      const extracted = await readEstimatePhoto(base64);
      if (!extracted.lines.length) {
        setReadNote({ tone: 'error', text: "No priced lines could be read. Try a sharper, flatter photo, or type the lines in." });
        setMode('type');
        return;
      }
      const v = { ...vehicle, ...Object.fromEntries(Object.entries(extracted.vehicle).filter(([, x]) => x)) } as Vehicle;
      setRows(extracted.lines.map((l) => ({ description: l.description, type: l.type, quantity: String(l.quantity), amount: String(l.amount) })));
      setVehicle(v);
      if (extracted.zip) setZip(extracted.zip);
      setReadNote({ tone: 'success', text: `Read ${extracted.lines.length} lines${extracted.shopName ? ` from ${extracted.shopName}` : ''}. Check them below; you can fix anything that was misread.` });
      setMode('type');
      await check({ vehicle: hasVehicle(v) ? vehicleLabel(v) : '', zip: extracted.zip || zip, shopType, lines: extracted.lines });
    } catch (err) {
      setReadNote({ tone: 'error', text: err instanceof Error ? err.message : 'The photo could not be read.' });
    } finally {
      setReading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lines.length) {
      setError('Add at least one line with a description and an amount.');
      return;
    }
    check({ vehicle: hasVehicle(vehicle) ? vehicleLabel(vehicle) : '', zip, shopType, lines });
  };

  const result = audit?.result;
  const quoted = audit ? quoteMath(audit.input.lines) : null;
  const savings = result && quoted ? Math.max(0, quoted.total - result.fairHigh) : 0;

  return (
    <ToolPage
      category="money"
      title="Repair quote checker"
      intro="Take a photo of your estimate or type in the lines. Every line is checked against typical prices for your area, with upsells to question and what to say to the shop."
      sources="AI (Anthropic's Claude) with typical US parts prices and labor-guide hours. Totals and labor rate are calculated exactly."
    >
      <Panel>
        <div role="tablist" aria-label="How to enter your quote" className="inline-flex rounded-lg bg-muted p-1">
          {(
            [
              ['photo', 'Photo of the estimate'],
              ['type', 'Type it in'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                'cursor-pointer rounded-md px-4 py-2 text-[0.9375rem] font-semibold',
                mode === id ? 'bg-card shadow-xs' : 'text-muted-foreground hover:text-foreground',
                focusRing,
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'photo' && (
          <div className="mt-5">
            <label
              htmlFor="estimate-photo"
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input px-6 py-10 text-center hover:bg-muted/60',
                'focus-within:outline-solid focus-within:outline-2 focus-within:outline-ring',
              )}
            >
              <Camera className="size-8 text-sign-green" aria-hidden="true" />
              <span className="text-lg font-bold">Take or upload a photo of the estimate</span>
              <span className="text-[0.9375rem] text-muted-foreground">Paper estimates and screenshots both work. Keep it flat and in focus.</span>
              <input id="estimate-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
            <p className="mt-3 text-sm text-muted-foreground">The photo is only used to read the prices and isn't stored.</p>
          </div>
        )}

        {reading && (
          <div className="mt-5 flex items-center gap-4">
            {preview && <img src={preview} alt="Your estimate" className="h-20 w-16 rounded-md border border-border object-cover" />}
            <Spinner label="Reading your estimate…" />
          </div>
        )}
        {readNote && (
          <Notice tone={readNote.tone} className="mt-5">
            {readNote.text}
          </Notice>
        )}

        {mode === 'type' && (
          <form onSubmit={submit} className="mt-5 space-y-6">
            <div>
              <h2 className="text-[0.9375rem] font-semibold">Quote lines</h2>
              <p className="text-sm text-muted-foreground">
                One line per charge. Use "Job" when a single price covers parts and labor, like "Front brake pads and rotors".
              </p>
              <div className="mt-3 space-y-3">
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_8rem_auto] sm:border-0 sm:p-0">
                    <input
                      aria-label={`Line ${i + 1} description`}
                      value={r.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      placeholder="Front brake pads and rotors"
                      className={cn(inputClass, 'col-span-2 sm:col-span-1')}
                    />
                    <select aria-label={`Line ${i + 1} type`} value={r.type} onChange={(e) => update(i, { type: e.target.value as QuoteLine['type'] })} className={inputClass}>
                      {LINE_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      aria-label={`Line ${i + 1} ${r.type === 'Labor' ? 'hours' : 'quantity'}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={r.quantity}
                      disabled={r.type === 'Job' || r.type === 'Fee'}
                      title={r.type === 'Labor' ? 'Hours' : 'Quantity'}
                      onChange={(e) => update(i, { quantity: e.target.value })}
                      className={cn(inputClass, 'col-span-1')}
                    />
                    <div className="relative col-span-1">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">$</span>
                      <input
                        aria-label={`Line ${i + 1} amount`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={r.amount}
                        onChange={(e) => update(i, { amount: e.target.value })}
                        placeholder="0"
                        className={cn(inputClass, 'pl-7')}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove line ${i + 1}`}
                      disabled={rows.length === 1}
                      onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                      className={cn('inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40', focusRing)}
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <SecondaryButton type="button" onClick={() => setRows((rs) => [...rs, { ...BLANK_LINE }])} className="h-10">
                  <Plus className="size-4" aria-hidden="true" /> Add a line
                </SecondaryButton>
                <p className="text-[0.9375rem]">
                  Total before tax <strong className="font-heading text-xl tabular-nums">{money(math.total, 2)}</strong>
                  {math.laborRate && (
                    <span className="block text-sm text-muted-foreground sm:text-right">
                      Labor: {math.laborHours} h at {money(math.laborRate)} per hour
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_10rem_12rem]">
              <div>
                <p className="mb-1.5 text-[0.9375rem] font-semibold">Your car</p>
                <VehicleFields value={vehicle} onChange={setVehicle} minYear={1990} />
              </div>
              <Field label="Shop ZIP code" htmlFor="quote-zip" className="lg:pt-7">
                <input id="quote-zip" inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))} placeholder="90210" className={inputClass} />
              </Field>
              <Field label="Shop type" htmlFor="shop-type" className="lg:pt-7">
                <select id="shop-type" value={shopType} onChange={(e) => setShopType(e.target.value as QuoteInput['shopType'])} className={inputClass}>
                  {SHOP_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>

            <PrimaryButton type="submit" loading={checking} className="h-12 px-6 text-lg">
              Check this quote
            </PrimaryButton>
          </form>
        )}
        {error && (
          <Notice tone="error" className="mt-5">
            {error}
          </Notice>
        )}
      </Panel>

      <div ref={resultsRef} className="scroll-mt-24">
        {checking && !result && (
          <Panel className="mt-6">
            <Spinner label="Checking each line against typical prices…" />
          </Panel>
        )}
        {result && audit && quoted && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 space-y-6 lg:col-span-2">
              <Panel>
                <div className="flex flex-wrap items-center gap-3">
                  <Verdict tone={VERDICT_TONE[result.verdict]} className="text-base">
                    {result.verdict}
                  </Verdict>
                  <p className="text-[0.9375rem] text-muted-foreground">{audit.input.vehicle || 'Your car'}</p>
                </div>
                <h2 className="mt-3 font-heading text-2xl leading-snug font-extrabold">{result.headline}</h2>
                <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Your quote</dt>
                    <dd className="font-heading text-2xl font-extrabold tabular-nums">{money(quoted.total)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Fair range</dt>
                    <dd className="font-heading text-2xl font-extrabold tabular-nums">{moneyRange(result.fairLow, result.fairHigh)}</dd>
                  </div>
                  {savings > 0 && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Possible savings</dt>
                      <dd className="font-heading text-2xl font-extrabold text-sign-green tabular-nums dark:text-emerald-300">{money(savings)}</dd>
                    </div>
                  )}
                </dl>
                {result.fairHigh > 0 && <RangeBar quoted={quoted.total} low={result.fairLow} high={result.fairHigh} />}
                {(quoted.laborRate || quoted.feeShare > 0.12) && (
                  <ul className="mt-2 space-y-1 text-[0.9375rem]">
                    {quoted.laborRate && (
                      <li>
                        The shop charges <strong>{money(quoted.laborRate)} per hour</strong> for {quoted.laborHours} hours of labor.
                      </li>
                    )}
                    {quoted.feeShare > 0.12 && (
                      <li>
                        Fees are <strong>{Math.round(quoted.feeShare * 100)}%</strong> of the quote. Ask what each fee covers.
                      </li>
                    )}
                  </ul>
                )}
              </Panel>

              <Panel aria-labelledby="lines-title">
                <PanelTitle>
                  <span id="lines-title">Line by line</span>
                </PanelTitle>
                <ul className="mt-3 divide-y divide-border">
                  {audit.input.lines.map((l, i) => {
                    const c = result.lines[i];
                    return (
                      <li key={i} className="py-4">
                        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
                          <div className="min-w-0 flex-1 basis-56">
                            <p className="font-bold">{l.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {l.type}
                              {l.type === 'Labor' ? `, ${l.quantity} h` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-heading text-lg font-extrabold tabular-nums">{money(l.amount, 2)}</p>
                            {c && c.fairHigh > 0 && <p className="text-sm text-muted-foreground">fair {moneyRange(c.fairLow, c.fairHigh)}</p>}
                          </div>
                        </div>
                        {c && (
                          <div className="mt-2 flex flex-wrap items-start gap-2">
                            <Verdict tone={LINE_TONE[c.verdict]}>{c.verdict}</Verdict>
                            {c.note && <p className="min-w-0 flex-1 basis-60 text-[0.9375rem] text-muted-foreground">{c.note}</p>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-sm text-muted-foreground">AI estimates. Prices vary with rust, damage and part brands, so ask the shop to explain big gaps.</p>
              </Panel>

              {result.canWait.length > 0 && (
                <Notice tone="warning" title="Often upsold or can wait">
                  <ul className="mt-1 space-y-1.5">
                    {result.canWait.map((c) => (
                      <li key={c.item}>
                        <strong>{c.item}:</strong> {c.why}
                      </li>
                    ))}
                  </ul>
                </Notice>
              )}
              {result.missing.length > 0 && (
                <Notice tone="info" title="Usually included but not on this quote">
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {result.missing.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </Notice>
              )}
            </div>

            <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
              {result.script && (
                <Panel>
                  <PanelTitle>What to say to the shop</PanelTitle>
                  <blockquote className="mt-3 border-l-4 border-sign-green pl-3 leading-relaxed">{result.script}</blockquote>
                  <SecondaryButton
                    type="button"
                    className="mt-4 h-10"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(result.script);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2500);
                      } catch {
                        // Clipboard blocked; the text is on screen to copy by hand.
                      }
                    }}
                  >
                    <Copy className="size-4" aria-hidden="true" /> {copied ? 'Copied' : 'Copy'}
                  </SecondaryButton>
                </Panel>
              )}
              {result.questions.length > 0 && (
                <Panel>
                  <PanelTitle>Questions to ask</PanelTitle>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.9375rem]">
                    {result.questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </Panel>
              )}
              <Panel>
                <PanelTitle>Get a second opinion</PanelTitle>
                <p className="mt-1 text-[0.9375rem] text-muted-foreground">Local shops can quote the same job so you can compare.</p>
                <PrimaryButton type="button" className="mt-4 w-full" onClick={() => setSecondOpinionOpen(true)}>
                  Request quotes from shops
                </PrimaryButton>
                <Link to={/^\d{5}$/.test(zip) ? `/mechanic-finder?zip=${zip}` : "/mechanic-finder"} className={cn('mt-3 block rounded-sm text-center font-semibold underline underline-offset-4', focusRing)}>
                  Find a mechanic near you
                </Link>
              </Panel>
            </aside>
          </div>
        )}
      </div>

      <SecondOpinionForm
        isOpen={secondOpinionOpen}
        onClose={() => setSecondOpinionOpen(false)}
        maintenanceRequest={{
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          service: (audit?.input.lines ?? lines).slice(0, 3).map((l) => l.description).join(', '),
          zip,
          quoteAmount: String(Math.round((audit ? quoteMath(audit.input.lines) : math).total)),
        }}
      />

      <section className="mt-16 max-w-3xl" aria-labelledby="quote-faq">
        <h2 id="quote-faq" className="font-heading text-2xl font-extrabold">
          Questions about quote checks
        </h2>
        <div className="mt-4 divide-y divide-border border-y border-border">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className={cn('cursor-pointer list-none font-bold marker:hidden', focusRing)}>
                <span className="flex items-center justify-between gap-4">
                  {q}
                  <span aria-hidden="true" className="text-xl text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-2 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </ToolPage>
  );
};

export default MaintenanceValidator;
