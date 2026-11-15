import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CONDITIONS, MILES_PER_YEAR, modelFacts, valueReport, type Condition, type ModelFacts } from '../utils/resale';
import { BarList } from './tool/charts';
import {
  Faq,
  FactList,
  Field,
  Notice,
  NumberField,
  Panel,
  PanelTitle,
  PrimaryButton,
  Spinner,
  ToolPage,
  VehicleFields,
  Verdict,
  hasVehicle,
  inputClass,
  money,
  vehicleLabel,
  type Vehicle,
} from './tool/kit';
import LeadPanel from './tool/LeadPanel';

const RETENTION_TONE = { Strong: 'go', 'Above average': 'go', Average: 'neutral', 'Below average': 'caution', Weak: 'stop' } as const;

const FAQS: [string, string][] = [
  [
    'How is the value worked out?',
    "The AI looks up the car's original price and how well that model holds its value. The rest is math: a standard US depreciation curve, adjusted for that model, your mileage against the 12,000-mile yearly average, and the condition you pick.",
  ],
  [
    'Why are trade-in and private sale so different?',
    'A dealer has to recondition, store, advertise and warranty the car and still make a profit, so trade-in offers usually come in 10 to 20% below what a private buyer pays. In most states you also pay sales tax only on the difference when you trade in, which narrows the gap.',
  ],
  [
    'When do cars lose the most value?',
    'In the first three years: a typical new car loses about 20% in year one and close to 40% by year three. After about five years the yearly loss in dollars gets much smaller, which is why a 3- to 5-year-old car is often the best value to buy.',
  ],
  [
    'Does mileage matter more than age?',
    'Both matter. Buyers expect about 12,000 miles a year. Well over that lowers the price, and passing 100,000 miles is a psychological line where many buyers and lenders pay noticeably less.',
  ],
  [
    'How do I get the most for my car?',
    'Get two or three instant offers (for example from CarMax, Carvana and a local dealer), fix small cosmetic things, gather service records, and sell before a big service or a new set of tires is due.',
  ],
];

export default function ValueShockCalculator() {
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [trim, setTrim] = useState('');
  const [miles, setMiles] = useState('');
  const [perYear, setPerYear] = useState(String(MILES_PER_YEAR));
  const [condition, setCondition] = useState<Condition>('good');
  const [facts, setFacts] = useState<(ModelFacts & { vehicle: string; year: number }) | null>(null);
  const [msrp, setMsrp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasVehicle(vehicle) || !miles) {
      setError('Enter the year, make, model and mileage.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const f = await modelFacts(vehicleLabel(vehicle), trim.trim());
      setFacts({ ...f, vehicle: [vehicleLabel(vehicle), trim.trim()].filter(Boolean).join(' '), year: Number(vehicle.year) });
      setMsrp(String(f.msrp));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The value check failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const report =
    facts && Number(msrp) > 0
      ? valueReport({
          modelYear: facts.year,
          msrp: Number(msrp),
          retention: facts.retention,
          miles: Number(miles) || 0,
          milesPerYear: Number(perYear) || 0,
          condition,
        })
      : null;

  const steepNow = report && report.yearlyLosses[0] >= report.yearlyLosses[report.yearlyLosses.length - 1] * 1.4;

  return (
    <ToolPage
      category="money"
      title="What's my car worth, and how fast is it dropping?"
      intro="See your car's value today for a private sale, trade-in and at a dealer, what it's costing you per day in lost value, and the best time to sell."
      sources="AI (Anthropic's Claude) for the original price and how well this model holds value; US depreciation curves and mileage math for the numbers."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
        <Panel aria-labelledby="car-title">
          <PanelTitle>
            <span id="car-title">Your car</span>
          </PanelTitle>
          <form onSubmit={check} noValidate className="mt-4 space-y-4">
            <VehicleFields value={vehicle} onChange={setVehicle} required />
            <Field label="Trim (optional)" htmlFor="value-trim" hint="For example LE, EX-L or xDrive40i.">
              <input id="value-trim" value={trim} onChange={(e) => setTrim(e.target.value)} maxLength={40} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="value-miles" label="Mileage" value={miles} onChange={setMiles} suffix="mi" />
              <NumberField id="value-per-year" label="Miles a year" value={perYear} onChange={setPerYear} suffix="mi" />
            </div>
            <fieldset>
              <legend className="mb-2 text-[0.9375rem] font-semibold">Condition</legend>
              <div className="space-y-2">
                {CONDITIONS.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      'block cursor-pointer rounded-lg border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
                      condition === c.id ? 'border-sign-green bg-sign-green/8 ring-1 ring-sign-green' : 'border-input hover:bg-muted',
                    )}
                  >
                    <input type="radio" name="condition" value={c.id} checked={condition === c.id} onChange={() => setCondition(c.id)} className="sr-only" />
                    <span className="font-bold">{c.label}</span>
                    <span className="block text-sm text-muted-foreground">{c.detail}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <PrimaryButton type="submit" loading={loading} className="w-full">
              Check my car's value
            </PrimaryButton>
            {error && <Notice tone="error">{error}</Notice>}
          </form>
        </Panel>

        <div className="space-y-6" aria-live="polite">
          {loading && !report && <Spinner label="Looking up this model…" />}
          {!report && !loading && (
            <Panel>
              <p className="text-muted-foreground">Enter your car to see its value today, how much it loses every day and over the next five years, and when selling makes the most sense.</p>
            </Panel>
          )}
          {facts && report && (
            <>
              <Panel aria-labelledby="worth-title">
                <p className="text-[0.9375rem] text-muted-foreground" id="worth-title">
                  {facts.vehicle}, {Number(miles).toLocaleString('en-US')} miles, {CONDITIONS.find((c) => c.id === condition)!.label.toLowerCase()} condition
                </p>
                <p className="mt-1 font-heading text-4xl font-extrabold tracking-[-0.02em]">
                  About {money(Math.round(report.privateParty / 100) * 100)}
                </p>
                <p className="text-[0.9375rem] text-muted-foreground">selling it yourself (private sale)</p>
                <FactList
                  className="mt-4"
                  items={[
                    ['Trade-in at a dealer', `about ${money(Math.round(report.tradeIn / 100) * 100)}`],
                    ['Dealer asking price for one like it', `about ${money(Math.round(report.dealerRetail / 100) * 100)}`],
                    ['Value kept since new', `${Math.round(report.keptOfMsrp * 100)}% of ${money(Number(msrp))}`],
                  ]}
                />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Losing right now</p>
                    <p className="font-heading text-2xl font-extrabold">{money(report.perDay, report.perDay < 10 ? 2 : 0)} a day</p>
                    <p className="text-sm text-muted-foreground">{money(report.perMonth)} a month, {money(report.nextYearLoss)} over the next 12 months</p>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">How this model holds value</p>
                    <Verdict tone={RETENTION_TONE[facts.retention]} className="mt-1">
                      {facts.retention}
                    </Verdict>
                    {facts.segment && <p className="mt-1 text-sm text-muted-foreground">vs. other {facts.segment.toLowerCase()}s and cars its age</p>}
                  </div>
                </div>
                {facts.reasons.length > 0 && (
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-[0.9375rem]">
                    {facts.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-5 max-w-xs">
                <NumberField
                  id="value-msrp"
                  label="Original price (MSRP)"
                  value={msrp}
                  onChange={setMsrp}
                  prefix="$"
                  hint="Our estimate for this model. Change it if you know the exact sticker price."
                />
                </div>
              </Panel>

              <Panel aria-labelledby="curve-title">
                <PanelTitle>
                  <span id="curve-title">Value over the next five years</span>
                </PanelTitle>
                <p className="mt-1 mb-4 text-[0.9375rem] text-muted-foreground">Private-sale value at {Number(perYear).toLocaleString('en-US')} miles a year.</p>
                <BarList items={report.points.map((p) => ({ label: `${p.label} · ${Math.round(p.miles / 1000)}k mi`, value: Math.round(p.privateParty / 100) * 100 }))} />
              </Panel>

              <Panel aria-labelledby="sell-title">
                <PanelTitle>
                  <span id="sell-title">When to sell</span>
                </PanelTitle>
                <ul className="mt-3 space-y-3 text-[0.9375rem] leading-relaxed">
                  <li>
                    <strong>{steepNow ? 'The steepest drop is happening now.' : 'The steep years are behind it.'}</strong>{' '}
                    The next 12 months cost about {money(report.yearlyLosses[0])}; year five costs about {money(report.yearlyLosses[4])}.{' '}
                    {steepNow ? 'If you were planning to sell in the next year or two anyway, sooner saves the most.' : 'Keeping it longer now costs much less per year than buying newer.'}
                  </li>
                  {report.yearsTo100k !== null && (
                    <li>
                      <strong>It passes 100,000 miles in about {report.yearsTo100k < 1 ? `${Math.max(1, Math.round(report.yearsTo100k * 12))} months` : `${report.yearsTo100k.toFixed(1)} years`}.</strong> Many buyers and
                      lenders pay noticeably less past that mark, so selling before it usually gets more.
                    </li>
                  )}
                  <li>
                    <strong>Selling privately pays about {money(Math.round((report.privateParty - report.tradeIn) / 100) * 100)} more than trading in</strong>, in exchange for listing it and meeting
                    buyers. Trading in can save sales tax on your next car in most states.
                  </li>
                  {facts.watchOut && (
                    <li>
                      <strong>Buyers will ask about:</strong> {facts.watchOut}
                    </li>
                  )}
                  <li>
                    <strong>Get two or three real offers</strong> (an online buyer such as CarMax or Carvana and a local dealer) before you accept anything. They often differ by
                    over $1,000.
                  </li>
                </ul>
              </Panel>

              <LeadPanel
                id="resale-lead"
                title="Get a real offer for your car"
                intro="Want to know what a buyer will actually pay? Leave your details and a car buyer will contact you with an offer."
                cta="Get my offer"
                sentText="A car buyer will contact you with an offer for this car."
                sheet="Car_resale_leads.json"
                source="Resale_Value"
                details={() => ({
                  vehicleYear: vehicle.year,
                  vehicleMake: vehicle.make,
                  vehicleModel: vehicle.model,
                  vehicleTrim: trim,
                  mileage: miles,
                  condition,
                  estimatePrivateParty: Math.round(report.privateParty),
                })}
              />
            </>
          )}
        </div>
      </div>

      <Faq id="value-faq" title="Questions about car values" items={FAQS} />
    </ToolPage>
  );
}
