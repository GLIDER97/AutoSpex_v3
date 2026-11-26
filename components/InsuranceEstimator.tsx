import React, { useState } from 'react';
import { runTool } from '../utils/ai';
import InsuranceGuide from './InsuranceGuide';
import type { InsuranceFormData } from '../types';
import {
  ChoiceGroup,
  Faq,
  Field,
  Notice,
  Panel,
  PanelTitle,
  PrimaryButton,
  Spinner,
  ToolPage,
  VehicleFields,
  Verdict,
  inputClass,
  money,
  rememberZip,
  rememberedZip,
  vehicleLabel,
  type Vehicle,
} from './tool/kit';

type Profile = Pick<InsuranceFormData, 'ageGroup' | 'drivingHistory' | 'creditTier' | 'coverageLevel' | 'deductible'>;

const INITIAL: Profile = { ageGroup: '25-64', drivingHistory: 'clean', creditTier: 'good', coverageLevel: 'standard', deductible: '500' };

/**
 * A transparent rule-of-thumb model. Calibrated so a typical driver (25-64,
 * clean record, good credit, standard full coverage, $500 deductible) lands
 * near 2026 national averages for full coverage ($186-$216 a month per
 * Insurify, NerdWallet, The Zebra, MoneyGeek). Location is not modeled.
 */
function estimate(p: Profile, model: string) {
  let rate = 177;
  if (p.ageGroup === '16-24') rate *= 2.4;
  else if (p.ageGroup === '65+') rate *= 1.1;
  if (p.drivingHistory === 'tickets') rate *= 1.35;
  else if (p.drivingHistory === 'accidents') rate *= 1.8;
  if (p.creditTier === 'excellent') rate *= 0.85;
  else if (p.creditTier === 'average') rate *= 1.2;
  else if (p.creditTier === 'poor') rate *= 1.6;
  const m = model.toLowerCase();
  if (/\b(gt|sport|amg|m3|m4|rs|srt|type r|corvette|mustang)\b/.test(m)) rate *= 1.4;
  else if (/\b(f-?150|silverado|ram|tacoma|tundra|sierra|truck)\b/.test(m)) rate *= 0.9;
  if (p.coverageLevel === 'state_min') rate *= 0.6;
  else if (p.coverageLevel === 'premium') rate *= 1.45;
  if (p.deductible === '2000') rate *= 0.85;
  else if (p.deductible === '500') rate *= 1.1;
  const min = Math.round(rate * 0.85);
  const max = Math.round(rate * 1.15);
  return { min, max, avg: Math.round((min + max) / 2) };
}

const FAQS: [string, React.ReactNode][] = [
  [
    'How accurate is this estimate?',
    "It's a ballpark from a simple, published model: a national average adjusted for age, driving record, credit, car type, coverage and deductible. Real quotes also depend on your state and ZIP, your exact car, your claims history and each insurer's own pricing, so they can be well above or below it.",
  ],
  [
    'Does this check my credit?',
    "No. Nothing is checked and nothing is sent to insurers. The credit tier you pick only adjusts the estimate. Note that California, Hawaii, Massachusetts and Michigan don't let insurers use credit to set auto rates.",
  ],
  [
    'How do I get a real quote?',
    'Get quotes from at least three insurers with the same coverage and deductible: a large national insurer, a regional one, and an independent agent who can quote several companies at once. Quotes are free and don\'t affect your credit score.',
  ],
  [
    'Why is my estimate so high?',
    'Drivers under 25, at-fault accidents, low credit tiers and sporty cars all raise premiums sharply. The list of ways to lower it shows what each change is worth in this model.',
  ],
  [
    'What is "full coverage"?',
    "Not a legal term: it usually means liability plus collision and comprehensive, which pay to repair your own car. Lenders require it on financed cars. State minimum covers only damage you cause to others.",
  ],
];

const InsuranceEstimator: React.FC = () => {
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [zip, setZip] = useState(rememberedZip);
  const [profile, setProfile] = useState<Profile>(INITIAL);
  const [shown, setShown] = useState<{ profile: Profile; car: string; carText: string } | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const set = <K extends keyof Profile>(key: K) => (value: Profile[K]) => setProfile((p) => ({ ...p, [key]: value }));
  const carText = `${vehicle.make} ${vehicle.model}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    rememberZip(zip);
    const result = estimate(profile, carText);
    setShown({ profile, car: vehicleLabel(vehicle), carText });
    setExplanation(null);
    setExplaining(true);
    try {
      // The prompt is written on the server (api/_aiTools.ts, "insurance-explain").
      const response = await runTool('insurance-explain', {
        min: result.min,
        max: result.max,
        year: vehicle.year,
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        zipCode: /^\d{5}$/.test(zip) ? zip : '',
        ...profile,
      });
      setExplanation(response.text || null);
    } catch {
      setExplanation(null);
    } finally {
      setExplaining(false);
    }
  };

  const result = shown ? estimate(shown.profile, shown.carText) : null;
  const ways = (() => {
    if (!shown || !result) return [];
    const p = shown.profile;
    const options: { label: string; next: Profile }[] = [];
    if (p.deductible !== '2000') {
      const next = p.deductible === '500' ? '1000' : '2000';
      options.push({ label: `Raise your deductible to $${Number(next).toLocaleString('en-US')}`, next: { ...p, deductible: next } });
    }
    if (p.coverageLevel === 'premium') options.push({ label: 'Switch from premium to standard full coverage', next: { ...p, coverageLevel: 'standard' } });
    if (p.creditTier === 'poor' || p.creditTier === 'average')
      options.push({ label: 'Improve your credit by one tier', next: { ...p, creditTier: p.creditTier === 'poor' ? 'average' : 'good' } });
    if (p.drivingHistory !== 'clean')
      options.push({ label: 'Keep a clean record (tickets and accidents usually stop counting after 3 to 5 years)', next: { ...p, drivingHistory: 'clean' } });
    return options
      .map((o) => ({ label: o.label, monthly: result.avg - estimate(o.next, shown.carText).avg }))
      .filter((w) => w.monthly > 0)
      .sort((a, b) => b.monthly - a.monthly);
  })();

  return (
    <ToolPage
      category="money"
      title="Car insurance calculator"
      intro="Estimate your car insurance cost per month and per year for your age, driving record, credit, car and coverage, and see what each change would save. No contact details needed. Below it: how much US car insurance prices have risen, from official BLS data."
      sources="A published rule-of-thumb model calibrated to 2026 national average full-coverage rates (Insurify, NerdWallet, The Zebra, MoneyGeek). Location isn't modeled. Explanation written by AI (Anthropic's Claude)."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <Panel className="self-start">
          <form onSubmit={submit} className="space-y-5">
            <VehicleFields value={vehicle} onChange={setVehicle} optionalLabel />
            <Field label="ZIP code (optional)" htmlFor="ins-zip" hint="Used only to tailor the explanation. It doesn't change the estimate.">
              <input id="ins-zip" inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))} className={inputClass} />
            </Field>
            <ChoiceGroup
              legend="Driver age"
              name="age"
              value={profile.ageGroup}
              onChange={set('ageGroup')}
              options={[
                { id: '16-24', label: '16–24' },
                { id: '25-64', label: '25–64' },
                { id: '65+', label: '65+' },
              ]}
            />
            <ChoiceGroup
              legend="Driving record, last 3 years"
              name="history"
              value={profile.drivingHistory}
              onChange={set('drivingHistory')}
              options={[
                { id: 'clean', label: 'Clean' },
                { id: 'tickets', label: '1–2 tickets' },
                { id: 'accidents', label: 'At-fault accident or DUI' },
              ]}
            />
            <ChoiceGroup
              legend="Credit"
              name="credit"
              value={profile.creditTier}
              onChange={set('creditTier')}
              options={[
                { id: 'excellent', label: 'Excellent' },
                { id: 'good', label: 'Good' },
                { id: 'average', label: 'Average' },
                { id: 'poor', label: 'Poor' },
              ]}
            />
            <ChoiceGroup
              legend="Coverage"
              name="coverage"
              value={profile.coverageLevel}
              onChange={set('coverageLevel')}
              columns={3}
              options={[
                { id: 'state_min', label: 'State minimum', detail: 'Damage you cause to others only' },
                { id: 'standard', label: 'Full coverage', detail: 'Plus collision and comprehensive' },
                { id: 'premium', label: 'Premium', detail: 'Higher limits and extras' },
              ]}
            />
            <ChoiceGroup
              legend="Deductible"
              name="deductible"
              value={profile.deductible}
              onChange={set('deductible')}
              options={[
                { id: '500', label: '$500' },
                { id: '1000', label: '$1,000' },
                { id: '2000', label: '$2,000' },
              ]}
            />
            <PrimaryButton type="submit" className="w-full">
              Estimate my premium
            </PrimaryButton>
          </form>
        </Panel>

        <div className="space-y-6" aria-live="polite">
          {!result || !shown ? (
            <Panel className="flex min-h-64 flex-col justify-center">
              <PanelTitle>What you'll see</PanelTitle>
              <ul className="mt-3 space-y-2 text-[0.9375rem] text-muted-foreground">
                <li>A monthly and yearly premium range for your profile</li>
                <li>How it compares with the national average</li>
                <li>Which changes would lower it, and by how much</li>
              </ul>
            </Panel>
          ) : (
            <>
              <Panel>
                <p className="text-sm text-muted-foreground">
                  {shown.car || 'Your car'}, {shown.profile.coverageLevel === 'state_min' ? 'state minimum' : shown.profile.coverageLevel === 'premium' ? 'premium coverage' : 'full coverage'}
                </p>
                <p className="mt-1 font-heading text-5xl font-extrabold tracking-[-0.02em]">
                  {money(result.min)}–{money(result.max)}
                  <span className="ml-1 text-2xl text-muted-foreground">a month</span>
                </p>
                <dl className="mt-4 grid gap-2 border-y border-border py-3 sm:grid-cols-3 sm:gap-3">
                  {(
                    [
                      ['Per month', 1],
                      ['6-month policy', 6],
                      ['Per year', 12],
                    ] as const
                  ).map(([label, months]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3 sm:block">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="font-bold whitespace-nowrap tabular-nums sm:mt-0.5">
                        {money(result.min * months)}–{money(result.max * months)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4">
                  <Verdict tone={result.avg < 160 ? 'go' : result.avg > 240 ? 'stop' : 'caution'}>
                    {result.avg < 160 ? 'Below the national average' : result.avg > 240 ? 'Above the national average' : 'Near the national average'}
                  </Verdict>
                </div>
              </Panel>

              <Panel>
                <PanelTitle>Ways to lower it</PanelTitle>
                {ways.length ? (
                  <ul className="mt-3 divide-y divide-border">
                    {ways.map((w) => (
                      <li key={w.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                        <span>{w.label}</span>
                        <span className="font-bold whitespace-nowrap">
                          about {money(w.monthly)}/month ({money(w.monthly * 12)}/year)
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[0.9375rem] text-muted-foreground">Your choices already keep this estimate low.</p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                  Worked out with the same model as the estimate. Discounts for bundling, safe-driving apps and paying in full vary by insurer.
                </p>
              </Panel>

              <Panel>
                <PanelTitle>Why it's in this range</PanelTitle>
                <div className="mt-2 text-[0.9375rem]">
                  {explaining ? (
                    <Spinner label="Writing an explanation…" />
                  ) : explanation ? (
                    <>
                      <p>{explanation}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Written by AI. Check anything important with an insurer.</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Age, driving record and credit move this estimate most. Where you live matters a lot too, which is why real quotes can differ.
                    </p>
                  )}
                </div>
              </Panel>

              <Notice tone="info" title="Get real quotes">
                Ask at least three insurers for the same coverage and deductible: a large national insurer, a regional one and an independent
                agent who can quote several companies. Quotes are free and don't affect your credit score.
              </Notice>
            </>
          )}
        </div>
      </div>

      <InsuranceGuide />

      <Faq id="insurance-faq" title="Questions about car insurance costs" items={FAQS} />
    </ToolPage>
  );
};

export default InsuranceEstimator;
