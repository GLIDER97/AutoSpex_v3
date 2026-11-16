import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { runTool } from '../utils/ai';
import type { ValueRequest, ValueResult } from '../types';
import {
  Faq,
  FactList,
  Field,
  Notice,
  NumberField,
  Panel,
  PanelTitle,
  PrimaryButton,
  SecondaryButton,
  ToolPage,
  VehicleFields,
  Verdict,
  focusRing,
  hasVehicle,
  inputClass,
  money,
  type Vehicle,
} from './tool/kit';

const CONDITIONS: { id: ValueRequest['condition']; label: string; detail: string }[] = [
  { id: 'excellent', label: 'Excellent', detail: 'Like new. No visible wear, everything works.' },
  { id: 'good', label: 'Good', detail: 'Normal wear, minor chips or scratches, runs well.' },
  { id: 'fair', label: 'Fair', detail: 'Visible dents or rust, or needs some repairs.' },
  { id: 'poor', label: 'Poor', detail: 'Major issues, accident damage or not running.' },
];

/** The AI labels its verdict with a color word; map it onto the site's traffic-signal tones. */
const verdictTone = (color: string): 'go' | 'caution' | 'stop' | 'neutral' =>
  /green/.test(color) ? 'go' : /red/.test(color) ? 'stop' : /yellow|orange|amber/.test(color) ? 'caution' : 'neutral';

const FAQS: [string, React.ReactNode][] = [
  [
    'How is the value estimated?',
    "An AI model (Anthropic's Claude) estimates today's trade-in and private-party values from typical US depreciation for your car's make, model, age, mileage and condition, then projects 12 months ahead assuming about 12,000 more miles. It's a starting point, not an appraisal: check a real offer before you sell.",
  ],
  [
    'Why is the daily loss so high?',
    'Losing value is usually the biggest cost of owning a car. New and luxury cars can lose $20 to $40 a day in their first years, while older, high-mileage cars lose much less.',
  ],
  [
    'Does this include repairs, fuel or insurance?',
    'No. This is only the drop in what the car is worth. For everything a car costs, use the cost-of-ownership calculator.',
  ],
  [
    'Can I slow down how fast my car loses value?',
    'Yes: keep the mileage down, keep every service record, fix small damage early, and keep the interior clean. Popular colors and trims also hold value better.',
  ],
  [
    'Why do luxury cars lose value faster?',
    'They cost more to repair as they age, and their technology dates quickly, so fewer used buyers want them. Reliable mainstream models such as Toyotas and Hondas tend to hold value best.',
  ],
];

const ValueShockCalculator: React.FC = () => {
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [trim, setTrim] = useState('');
  const [mileage, setMileage] = useState('');
  const [condition, setCondition] = useState<ValueRequest['condition']>('good');
  const [result, setResult] = useState<ValueResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasVehicle(vehicle) || !mileage) {
      setError('Enter the year, make, model and mileage.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // The prompt and schema are written on the server (api/_aiTools.ts, "value-shock").
      const response = await runTool('value-shock', {
        year: vehicle.year,
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        trim: trim.trim(),
        mileage: Number(String(mileage).replace(/[^\d.]/g, '')) || 0,
        condition,
      });
      const data = JSON.parse(response.text || '{}');
      if (!data.depreciation || !data.currentValue || !data.futureValue || !data.verdict) {
        throw new Error('incomplete');
      }
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'incomplete' && !/JSON/.test(err.message)
          ? err.message
          : "The estimate couldn't be made right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const label = [vehicle.year, vehicle.make, vehicle.model, trim].filter(Boolean).join(' ');

  return (
    <ToolPage
      category="money"
      title="Resale value drop"
      intro="See roughly what your car is worth today, what it will be worth in a year, and how much value it loses each day."
      sources="AI estimate (Anthropic's Claude) from typical US depreciation for the make, model, age, mileage and condition. Not an appraisal."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <Panel className="self-start">
          <form onSubmit={calculate} className="space-y-5">
            <VehicleFields value={vehicle} onChange={setVehicle} minYear={1995} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Trim (optional)" htmlFor="trim">
                <input id="trim" value={trim} onChange={(e) => setTrim(e.target.value)} placeholder="EX-L" maxLength={40} className={inputClass} />
              </Field>
              <NumberField id="mileage" label="Mileage" value={mileage} onChange={setMileage} suffix="mi" step="1000" />
            </div>

            <fieldset>
              <legend className="mb-2 text-[0.9375rem] font-semibold">Condition</legend>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      'cursor-pointer rounded-lg border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
                      condition === c.id ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/60',
                    )}
                  >
                    <input type="radio" name="condition" className="sr-only" checked={condition === c.id} onChange={() => setCondition(c.id)} />
                    <span className="block font-bold">{c.label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{c.detail}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <PrimaryButton type="submit" loading={loading} className="w-full">
              {loading ? 'Estimating…' : 'Estimate the value drop'}
            </PrimaryButton>
            {error && <Notice tone="error">{error}</Notice>}
          </form>
        </Panel>

        <div className="space-y-6">
          {!result ? (
            <Panel className="flex min-h-64 flex-col justify-center">
              <PanelTitle>What you'll see</PanelTitle>
              <ul className="mt-3 space-y-2 text-[0.9375rem] text-muted-foreground">
                <li>Trade-in and private-party value today, and in 12 months</li>
                <li>How much value the car loses per day and over the year</li>
                <li>What drives the value of this model up or down</li>
              </ul>
            </Panel>
          ) : (
            <>
              <Panel aria-live="polite">
                <p className="text-sm text-muted-foreground">{label}, {Number(mileage).toLocaleString('en-US')} miles</p>
                <p className="mt-1 font-heading text-5xl font-extrabold tracking-[-0.02em]">
                  {money(result.depreciation.perDay, 2)}
                  <span className="ml-1 text-2xl text-muted-foreground">a day</span>
                </p>
                <p className="mt-2 text-lg text-muted-foreground">
                  About {money(result.depreciation.totalOneYear)} of value lost over the next year ({result.depreciation.percentDrop}%).
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Verdict tone={verdictTone(result.verdict.color)}>{result.verdict.status}</Verdict>
                  <p className="text-[0.9375rem]">{result.verdict.description}</p>
                </div>
              </Panel>

              <div className="grid gap-6 sm:grid-cols-2">
                <Panel>
                  <PanelTitle>Today</PanelTitle>
                  <FactList
                    className="mt-2"
                    items={[
                      ['Private party', money(result.currentValue.privateParty)],
                      ['Trade-in', money(result.currentValue.tradeIn)],
                    ]}
                  />
                </Panel>
                <Panel>
                  <PanelTitle>In 12 months</PanelTitle>
                  <FactList
                    className="mt-2"
                    items={[
                      ['Private party', money(result.futureValue.privateParty)],
                      ['Trade-in', money(result.futureValue.tradeIn)],
                    ]}
                  />
                </Panel>
              </div>

              {result.marketFactors?.length > 0 && (
                <Panel>
                  <PanelTitle>What moves this car's value</PanelTitle>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
                    {result.marketFactors.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </Panel>
              )}

              <Notice tone="info" title="Selling privately usually pays more">
                A private sale often brings 10–20% more than a dealer trade-in, in exchange for more effort.
              </Notice>

              <Panel>
                <PanelTitle>Check a real offer</PanelTitle>
                <p className="mt-1 text-[0.9375rem] text-muted-foreground">
                  An estimate is only a guide. Online buyers such as Carvana make a free instant offer you can compare with this one and with
                  local dealers. MyAutoSpex isn't paid for this link.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://www.carvana.com/sell-my-car"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong',
                      focusRing,
                    )}
                  >
                    Get an offer from Carvana
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <SecondaryButton type="button" onClick={() => setResult(null)}>
                    Estimate another car
                  </SecondaryButton>
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>

      <Faq id="value-faq" title="Questions about car depreciation" items={FAQS} />

    </ToolPage>
  );
};

export default ValueShockCalculator;
