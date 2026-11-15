import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { generateContent, Type } from '../utils/ai';
import {
  AGES,
  COVERAGES,
  CREDITS,
  DEDUCTIBLES,
  MILES,
  NATIONAL_BASE,
  NO_CREDIT_STATES,
  RECORDS,
  STATES,
  VEHICLE_CLASSES,
  estimate,
  savings,
  type Profile,
  type VehicleClassId,
} from '../utils/insurance';
import { Faq, Field, Notice, Panel, PanelTitle, ToolPage, VehicleFields, inputClass, money, hasVehicle, vehicleLabel, type Vehicle } from './tool/kit';
import LeadPanel from './tool/LeadPanel';

const FAQS: [string, string][] = [
  [
    'How is this estimate worked out?',
    'It starts from a typical 2026 US full-coverage premium ($210 a month for a 35-year-old with a clean record, good credit and an average car) and multiplies it by the factors insurers price on: your state, age, record, credit, miles, the car, coverage and deductible. Every factor and its effect is listed next to your estimate.',
  ],
  [
    'Why might my real quote be different?',
    "Each insurer weighs these factors differently, and they also use your exact ZIP code, claims history and the car's trim. Quotes for the same driver often differ by 50% or more between companies, which is why comparing at least three quotes is the single biggest saving.",
  ],
  [
    'Does my credit score really change my price?',
    'In most states, yes: drivers with poor credit often pay 70% or more than drivers with good credit. California, Hawaii and Massachusetts ban credit-based pricing, and Michigan limits it, so the estimate ignores credit there.',
  ],
  [
    'When should I drop full coverage?',
    'Collision and comprehensive pay to fix or replace your own car. A common rule: once the car is worth less than about 10 times what that coverage costs per year, or you could replace it from savings, liability-only can make sense. If the car has a loan or lease, the lender requires full coverage.',
  ],
  [
    'What is 100/300/100?',
    'Liability limits in thousands: $100,000 per injured person, $300,000 per accident for injuries and $100,000 for property damage. State minimums are much lower and can leave you paying the rest after a serious crash.',
  ],
];

const pct = (f: number) => {
  const p = Math.round((f - 1) * 100);
  return p === 0 ? 'average' : `${p > 0 ? '+' : '−'}${Math.abs(p)}%`;
};

function Select<T extends string>({ id, label, value, onChange, options, hint }: { id: string; label: string; value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; hint?: React.ReactNode }) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={inputClass}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

const Check = ({ id, label, checked, onChange, hint }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) => (
  <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-1.5">
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-sign-green" />
    <span>
      <span className="font-semibold">{label}</span>
      {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
    </span>
  </label>
);

export default function InsuranceEstimator() {
  const [profile, setProfile] = useState<Profile>({
    state: '',
    age: '30-64',
    record: 'clean',
    credit: 'good',
    miles: 'average',
    coverage: 'full',
    deductible: '1000',
    year: '',
    vehicleClass: 'average',
    bundle: false,
    goodStudent: false,
    telematics: false,
  });
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [vehicleNote, setVehicleNote] = useState<{ label: string; reason: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const cache = useRef(new Map<string, { cls: VehicleClassId; reason: string }>());

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile((p) => ({ ...p, [key]: value }));

  // How costly the car is to insure: a quick AI check once year, make and model are filled in.
  useEffect(() => {
    set('year', vehicle.year);
    if (!hasVehicle(vehicle)) {
      set('vehicleClass', 'average');
      setVehicleNote(null);
      return;
    }
    const label = vehicleLabel(vehicle);
    const known = cache.current.get(label);
    if (known) {
      set('vehicleClass', known.cls);
      setVehicleNote({ label, reason: known.reason });
      return;
    }
    let live = true;
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await generateContent({
          model: 'text',
          contents: `How expensive is a ${label} to insure in the US compared with an average passenger car? Consider theft rates, typical repair and parts costs, safety ratings and performance. Answer with a cost class and one short sentence (under 25 words) giving the main reason.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: { costClass: { type: Type.STRING, enum: VEHICLE_CLASSES.map((c) => c.id) }, reason: { type: Type.STRING } },
              required: ['costClass', 'reason'],
            },
          },
        });
        const raw = JSON.parse(res.text ?? '{}');
        const cls: VehicleClassId = VEHICLE_CLASSES.some((c) => c.id === raw.costClass) ? raw.costClass : 'average';
        const reason = String(raw.reason ?? '').slice(0, 200);
        cache.current.set(label, { cls, reason });
        if (live) {
          set('vehicleClass', cls);
          setVehicleNote({ label, reason });
        }
      } catch {
        if (live) setVehicleNote(null);
      } finally {
        if (live) setChecking(false);
      }
    }, 600);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [vehicle.year, vehicle.make, vehicle.model]);

  const result = estimate(profile);
  const ways = savings(profile);
  const full = profile.coverage === 'full' || profile.coverage === 'fullPlus';
  const young = profile.age === '16-19' || profile.age === '20-24';
  const vehicleClassLabel = VEHICLE_CLASSES.find((c) => c.id === profile.vehicleClass)!.label;

  return (
    <ToolPage
      category="money"
      title="Car insurance cost estimate"
      intro="See what car insurance should cost you before you shop, why, and which changes save the most. The estimate updates as you change anything."
      sources="Typical 2026 US premiums and state averages from published industry surveys; AI (Anthropic's Claude) rates how costly your car is to insure."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
        <div className="space-y-6">
          <Panel aria-labelledby="you-title">
            <PanelTitle>
              <span id="you-title">You</span>
            </PanelTitle>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                id="ins-state"
                label="State"
                value={profile.state}
                onChange={(v) => set('state', v)}
                options={[{ id: '', label: 'Choose your state' }, ...STATES.map((s) => ({ id: s.code, label: s.name }))]}
              />
              <Select id="ins-age" label="Age" value={profile.age} onChange={(v) => set('age', v)} options={AGES} />
              <Select id="ins-record" label="Driving record (last 3 to 5 years)" value={profile.record} onChange={(v) => set('record', v)} options={RECORDS} />
              <Select
                id="ins-credit"
                label="Credit"
                value={profile.credit}
                onChange={(v) => set('credit', v)}
                options={CREDITS}
                hint={NO_CREDIT_STATES.includes(profile.state) ? 'Insurers in your state can’t price on credit.' : undefined}
              />
            </div>
          </Panel>

          <Panel aria-labelledby="car-title">
            <PanelTitle>
              <span id="car-title">Your car</span>
            </PanelTitle>
            <div className="mt-4">
              <VehicleFields value={vehicle} onChange={setVehicle} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select id="ins-miles" label="Miles driven a year" value={profile.miles} onChange={(v) => set('miles', v)} options={MILES} />
            </div>
            <p className="mt-3 text-[0.9375rem] text-muted-foreground" aria-live="polite">
              {checking
                ? 'Checking how costly this car is to insure…'
                : vehicleNote
                  ? `${vehicleNote.label}: ${vehicleClassLabel.toLowerCase()}. ${vehicleNote.reason}`
                  : 'Add the year, make and model to factor in theft rates and repair costs for your car.'}
            </p>
          </Panel>

          <Panel aria-labelledby="cover-title">
            <PanelTitle>
              <span id="cover-title">Coverage</span>
            </PanelTitle>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select id="ins-coverage" label="Coverage" value={profile.coverage} onChange={(v) => set('coverage', v)} options={COVERAGES} />
              {full && <Select id="ins-deductible" label="Deductible" value={profile.deductible} onChange={(v) => set('deductible', v)} options={DEDUCTIBLES} />}
            </div>
            <fieldset className="mt-4">
              <legend className="text-[0.9375rem] font-semibold">Discounts</legend>
              <Check id="ins-bundle" label="Bundle with home or renters insurance" checked={profile.bundle} onChange={(v) => set('bundle', v)} />
              <Check id="ins-telematics" label="Safe-driving app or plug-in" checked={profile.telematics} onChange={(v) => set('telematics', v)} hint="Tracks how you drive; careful drivers pay less." />
              {young && <Check id="ins-student" label="Good student (B average or better)" checked={profile.goodStudent} onChange={(v) => set('goodStudent', v)} />}
            </fieldset>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel aria-labelledby="estimate-title">
            <PanelTitle>
              <span id="estimate-title">Your estimate</span>
            </PanelTitle>
            <p className="mt-3 font-heading text-4xl font-extrabold tracking-[-0.02em]" aria-live="polite">
              {money(result.low)} to {money(result.high)}
              <span className="text-lg font-bold text-muted-foreground"> a month</span>
            </p>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">
              About {money(result.yearly)} a year.{' '}
              {Math.abs(result.vsAverage - 1) < 0.05
                ? 'Close to the US average.'
                : `${Math.round(Math.abs(result.vsAverage - 1) * 100)}% ${result.vsAverage > 1 ? 'above' : 'below'} the US average of ${money(NATIONAL_BASE)} for full coverage.`}
            </p>
            {!profile.state && (
              <Notice tone="info" className="mt-4">
                Choose your state: it can move the price by 50% either way.
              </Notice>
            )}
            <h3 className="mt-5 font-bold">Why this price</h3>
            <dl className="mt-1 divide-y divide-border">
              {result.factors.map((f) => (
                <div key={f.label + f.value} className="flex items-baseline justify-between gap-4 py-2 text-[0.9375rem]">
                  <dt>
                    <span className="text-muted-foreground">{f.label}:</span> {f.value}
                  </dt>
                  <dd
                    className={cn(
                      'shrink-0 font-semibold tabular-nums',
                      f.factor > 1.001 && 'text-sign-red dark:text-red-300',
                      f.factor < 0.999 && 'text-sign-green dark:text-emerald-300',
                    )}
                  >
                    {pct(f.factor)}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          {ways.length > 0 && (
            <Panel aria-labelledby="save-title">
              <PanelTitle>
                <span id="save-title">Ways to pay less</span>
              </PanelTitle>
              <ul className="mt-3 divide-y divide-border">
                {ways.map((w) => (
                  <li key={w.label} className="py-3">
                    <p className="flex items-baseline justify-between gap-4">
                      <span className="font-semibold">{w.label}</span>
                      <span className="shrink-0 font-bold text-sign-green dark:text-emerald-300">−{money(w.monthly)}/mo</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{w.detail}</p>
                  </li>
                ))}
                <li className="py-3">
                  <p className="font-semibold">Compare at least three quotes</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">The same driver can pay 50% more at one company than another. This is usually the biggest saving of all.</p>
                </li>
              </ul>
            </Panel>
          )}
        </div>
      </div>

      <LeadPanel
        id="ins-lead"
        className="mt-6"
        title="Get real quotes"
        intro="An estimate tells you what's fair; a quote is what you'd actually pay. Licensed agents can quote this exact profile."
        cta="Get my quotes"
        sentText="A licensed agent will contact you with quotes for this profile."
        sheet="Insurance_Estimator_leads.json"
        source="Insurance_Estimator"
        details={() => ({
          state: profile.state,
          vehicleYear: vehicle.year,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          ageGroup: profile.age,
          drivingHistory: profile.record,
          creditTier: profile.credit,
          annualMileage: profile.miles,
          coverageLevel: profile.coverage,
          deductible: profile.deductible,
          estimateMonthly: `${result.low}-${result.high}`,
        })}
      />

      <Faq id="ins-faq" title="Questions about car insurance costs" items={FAQS} />
    </ToolPage>
  );
}
