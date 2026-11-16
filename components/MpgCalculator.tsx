import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { findEpaVariants, getEpaRating, type EpaVariant } from '../utils/fuelEconomy';
import CompareCars from './mpg/CompareCars';
import { ProductPicks } from './tool/ProductPicks';
import {
  Faq,
  FactList,
  Field,
  Notice,
  NumberField,
  Panel,
  PanelTitle,
  PrimaryButton,
  ToolPage,
  VehicleFields,
  Verdict,
  focusRing,
  hasVehicle,
  inputClass,
  money,
  vehicleLabel,
  type Vehicle,
} from './tool/kit';

type Mode = 'commute' | 'trip' | 'audit' | 'compare';

const MODES: [Mode, string][] = [
  ['commute', 'Commute cost'],
  ['trip', 'Road trip'],
  ['audit', 'My MPG vs EPA'],
  ['compare', 'Compare two cars'],
];

// General checks that commonly cost fuel economy. The EPA data has ratings only, no car-specific advice.
const MPG_TIPS = [
  'Check tire pressure monthly. Under-inflated tires raise rolling resistance and burn more fuel.',
  "Use the motor oil grade your owner's manual recommends.",
  'Get a lit check engine light diagnosed. A failing oxygen sensor or a misfire can cut mileage sharply.',
  "Remove roof racks and cargo you aren't using, and avoid long idling and hard acceleration.",
];

const PICKS = [
  {
    name: 'AstroAI digital tire pressure gauge',
    use: 'Check all four tires once a month. Correct pressure is the cheapest fuel-economy fix there is.',
    url: 'https://www.amazon.com/s?k=AstroAI+Digital+Tire+Pressure+Gauge',
  },
  {
    name: 'EPAuto 12V portable tire inflator',
    use: 'Top up tires at home to the pressure on your door sticker instead of hunting for a gas station air pump.',
    url: 'https://www.amazon.com/s?k=EPAuto+12V+Portable+Air+Compressor',
  },
  {
    name: 'ANCEL AD310 OBD-II scanner',
    use: 'If your mileage suddenly drops, read the codes yourself. Misfires and oxygen sensor faults are common causes.',
    url: 'https://Autospex.short.gy/diGnAb',
  },
];

const FAQS: [string, React.ReactNode][] = [
  [
    'How is cost per mile calculated?',
    'Gas price per gallon divided by your MPG. At $3.50 a gallon and 25 MPG, each mile costs $3.50 ÷ 25 = $0.14.',
  ],
  [
    'Where do the EPA ratings come from?',
    'From fueleconomy.gov, the official fuel economy site run by the U.S. Department of Energy and the EPA, for your exact year, make, model and version.',
  ],
  [
    'Why is my real MPG lower than the EPA rating?',
    'Driving style, short trips, cold weather, A/C, cargo, tire pressure and age all lower real-world mileage. Being 10–15% under the rating is common; more than 20% under can point to a problem worth checking.',
  ],
  [
    'Does a new air filter improve gas mileage?',
    "Not on modern fuel-injected cars: fueleconomy.gov notes that replacing a clogged air filter improves acceleration but not fuel economy. Tire pressure, a lit check engine light and driving style matter far more.",
  ],
  ['Is this calculator free?', 'Yes, with no account. Some product links on this page are affiliate links, which is how the site is funded.'],
];

const n = (v: string) => Math.max(0, Number(v) || 0);

const MpgCalculator: React.FC = () => {
  const [mode, setMode] = useState<Mode>('commute');

  // Shared
  const [mpg, setMpg] = useState('25');
  const [gas, setGas] = useState('3.50');

  // Commute
  const [dailyMiles, setDailyMiles] = useState('30');
  const [days, setDays] = useState('5');

  // Trip
  const [tripMiles, setTripMiles] = useState('400');
  const [people, setPeople] = useState('1');

  // Audit
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [observed, setObserved] = useState('');
  const [rating, setRating] = useState<{ city: number; hwy: number; combined: number } | null>(null);
  const [variants, setVariants] = useState<EpaVariant[]>([]);
  const [variantId, setVariantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const costPerMile = n(gas) / (n(mpg) || 1);
  const daily = costPerMile * n(dailyMiles);
  const monthly = daily * n(days) * 4.33;
  const yearly = monthly * 12;
  const savingWith5 = yearly - yearly * (n(mpg) / (n(mpg) + 5));
  const tripCost = costPerMile * n(tripMiles);
  const tripGallons = n(tripMiles) / (n(mpg) || 1);

  const loadRating = async (id: string) => {
    const r = await getEpaRating(id);
    setRating({ city: r.city, hwy: r.hwy, combined: r.combined });
  };

  const runAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasVehicle(vehicle) || !observed) {
      setAuditError('Enter the year, make, model and the MPG your car shows.');
      return;
    }
    setAuditError(null);
    setRating(null);
    setVariants([]);
    setLoading(true);
    try {
      const year = Number(vehicle.year);
      const { make, variants: found } = await findEpaVariants(year, vehicle.make.trim(), vehicle.model.trim());
      if (!make) {
        setAuditError(`We couldn't find ${vehicle.make} in the EPA's ${year} listings. Please check the make.`);
        return;
      }
      if (!found.length) {
        setAuditError(`No EPA-rated ${year} ${make} matches "${vehicle.model}". Try the model name as sold, for example Civic, CR-V or F150.`);
        return;
      }
      setVariants(found);
      setVariantId(found[0].id);
      await loadRating(found[0].id);
    } catch {
      setAuditError('Could not reach the EPA fuel economy database (fueleconomy.gov). Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickVariant = async (id: string) => {
    setVariantId(id);
    setAuditError(null);
    setLoading(true);
    try {
      await loadRating(id);
    } catch {
      setRating(null);
      setAuditError('Could not load the EPA rating for that version. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const gap = rating && observed ? ((n(observed) - rating.combined) / rating.combined) * 100 : null;
  const verdict =
    gap === null
      ? null
      : gap > -10
        ? { tone: 'go' as const, label: 'In line with the EPA rating', text: 'Your car is doing about as well as it should.' }
        : gap > -20
          ? { tone: 'caution' as const, label: 'A bit below the EPA rating', text: 'Common with city driving, cold weather or short trips. Check tire pressure first.' }
          : { tone: 'stop' as const, label: 'Well below the EPA rating', text: 'More than 20% under is worth checking: tires, a lit check engine light, brakes dragging or a sensor fault.' };

  return (
    <ToolPage
      category="money"
      title="MPG and fuel cost"
      intro="Work out what your commute or a road trip costs in fuel, and check your real mileage against the official EPA rating for your car."
      sources="EPA fuel economy ratings (fueleconomy.gov). Fuel costs use the gas price you enter."
    >
      <div role="tablist" aria-label="What do you want to work out?" className="mb-6 inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1">
        {MODES.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn('cursor-pointer rounded-md px-4 py-2 font-semibold', mode === id ? 'bg-card shadow-xs' : 'text-muted-foreground hover:text-foreground', focusRing)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'compare' ? (
        <CompareCars />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,25rem)_1fr]">
          <Panel className="space-y-5 self-start">
            {mode === 'commute' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField id="mpg" label="Your car's MPG" value={mpg} onChange={setMpg} suffix="mpg" />
                  <NumberField id="gas" label="Gas price" value={gas} onChange={setGas} prefix="$" suffix="/gal" step="0.05" />
                  <NumberField id="daily" label="Miles a day" value={dailyMiles} onChange={setDailyMiles} suffix="mi" hint="Round trip" />
                  <NumberField id="days" label="Days a week" value={days} onChange={setDays} step="1" />
                </div>
              </>
            )}
            {mode === 'trip' && (
              <div className="grid grid-cols-2 gap-3">
                <NumberField id="trip" label="Trip distance" value={tripMiles} onChange={setTripMiles} suffix="mi" hint="Total miles you'll drive" />
                <NumberField id="people" label="People splitting" value={people} onChange={setPeople} step="1" min={1} />
                <NumberField id="mpg" label="Your car's MPG" value={mpg} onChange={setMpg} suffix="mpg" />
                <NumberField id="gas" label="Gas price" value={gas} onChange={setGas} prefix="$" suffix="/gal" step="0.05" />
              </div>
            )}
            {mode === 'audit' && (
              <form onSubmit={runAudit} className="space-y-5">
                <VehicleFields value={vehicle} onChange={setVehicle} />
                <NumberField id="observed" label="MPG your car shows" value={observed} onChange={setObserved} suffix="mpg" step="0.1" hint="From the dashboard, or miles driven ÷ gallons at your last fill-up" />
                <PrimaryButton type="submit" loading={loading} className="w-full">
                  Compare with the EPA rating
                </PrimaryButton>
                {variants.length > 1 && (
                  <Field label={`Your version (${variants.length} EPA ratings found)`} htmlFor="variant">
                    <select id="variant" value={variantId} disabled={loading} onChange={(e) => pickVariant(e.target.value)} className={inputClass}>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.model} · {v.description}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {auditError && <Notice tone="error">{auditError}</Notice>}
              </form>
            )}
          </Panel>

          <div className="space-y-6" aria-live="polite">
            {mode === 'commute' && (
              <>
                <Panel>
                  <p className="text-sm text-muted-foreground">Fuel cost per mile</p>
                  <p className="mt-1 font-heading text-5xl font-extrabold tracking-[-0.02em]">{money(costPerMile, 2)}</p>
                  <FactList
                    className="mt-4"
                    items={[
                      ['Each day', money(daily, 2)],
                      ['Each month', money(monthly)],
                      ['Each year', money(yearly)],
                    ]}
                  />
                </Panel>
                {n(mpg) > 0 && yearly > 0 && (
                  <Notice tone="success" title={`A car that gets 5 MPG more would save about ${money(savingWith5)} a year`}>
                    On this commute, at today's price. Keeping tires at the right pressure alone is worth a little every month.
                  </Notice>
                )}
              </>
            )}

            {mode === 'trip' && (
              <Panel>
                <p className="text-sm text-muted-foreground">Fuel for the trip</p>
                <p className="mt-1 font-heading text-5xl font-extrabold tracking-[-0.02em]">{money(tripCost, 2)}</p>
                <FactList
                  className="mt-4"
                  items={[
                    ['Gallons needed', tripGallons.toFixed(1)],
                    ...(n(people) > 1 ? ([[`Each of ${n(people)} people pays`, money(tripCost / n(people), 2)]] as [string, string][]) : []),
                  ]}
                />
              </Panel>
            )}

            {mode === 'audit' &&
              (rating && verdict ? (
                <>
                  <Panel>
                    <p className="text-sm text-muted-foreground">{vehicleLabel(vehicle)}, combined MPG</p>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">EPA rating</p>
                        <p className="font-heading text-4xl font-extrabold">{rating.combined}</p>
                        <p className="text-sm text-muted-foreground">
                          City {rating.city} · Highway {rating.hwy}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Your car</p>
                        <p className="font-heading text-4xl font-extrabold">{n(observed)}</p>
                        <p className="text-sm text-muted-foreground">
                          {gap! >= 0 ? '+' : ''}
                          {gap!.toFixed(0)}% vs EPA
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Verdict tone={verdict.tone}>{verdict.label}</Verdict>
                      <p className="text-[0.9375rem]">{verdict.text}</p>
                    </div>
                  </Panel>
                  <Panel>
                    <PanelTitle>Common causes of low mileage</PanelTitle>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
                      {MPG_TIPS.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </Panel>
                </>
              ) : (
                <Panel className="flex min-h-48 flex-col justify-center">
                  <PanelTitle>Is your car using more fuel than it should?</PanelTitle>
                  <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                    Enter your car and the MPG it actually gets. We'll compare it with the official EPA rating for your exact version.
                  </p>
                </Panel>
              ))}

            <Panel>
              <PanelTitle>Cash back on gas</PanelTitle>
              <p className="mt-1 text-[0.9375rem] text-muted-foreground">
                Free apps such as Upside give cash back at participating gas stations. Offers vary by station and area. MyAutoSpex isn't affiliated
                with Upside.
              </p>
              <a
                href="https://www.upside.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={cn('mt-3 inline-flex font-semibold underline underline-offset-4', focusRing)}
              >
                See offers near you on Upside<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Panel>
          </div>
        </div>
      )}

      <ProductPicks
        id="mpg-picks"
        title="Tools that help your mileage"
        intro="Simple things that make a real difference. We don't list 'gas-saving' gadgets or additives: when the EPA tested more than 100 of them, very few improved fuel economy at all."
        items={PICKS}
      />

      <Faq id="mpg-faq" title="Questions about fuel cost and MPG" items={FAQS} />
    </ToolPage>
  );
};

export default MpgCalculator;
