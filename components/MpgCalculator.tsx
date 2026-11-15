import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { findEpaVariants, getEpaRating, type EpaRating, type EpaVariant } from '../utils/fuelEconomy';
import CompareCars from './mpg/CompareCars';
import {
  Faq,
  FactList,
  Field,
  Notice,
  NumberField,
  Panel,
  PanelTitle,
  SecondaryButton,
  ToolPage,
  Verdict,
  VehicleFields,
  focusRing,
  hasVehicle,
  inputClass,
  money,
  vehicleLabel,
  type Vehicle,
} from './tool/kit';
import LeadPanel from './tool/LeadPanel';

type Tab = 'trip' | 'budget' | 'check' | 'compare';
const TABS: { id: Tab; label: string }[] = [
  { id: 'trip', label: 'Trip cost' },
  { id: 'budget', label: 'Monthly fuel budget' },
  { id: 'check', label: 'Is my MPG normal?' },
  { id: 'compare', label: 'Compare two cars' },
];
type Driving = 'highway' | 'mixed' | 'city';

const KWH_PER_GALLON_EQUIVALENT = 33.7;
const n = (v: string) => Math.max(0, Number(v) || 0);

const CAUSES: { gap: number; title: string; detail: string }[] = [
  { gap: 0, title: 'Tire pressure', detail: 'Check it cold, monthly, against the sticker in the driver’s door jamb. Low tires are the most common and cheapest fix.' },
  { gap: 0, title: 'Short trips and cold weather', detail: 'An engine that never warms up, winter-blend fuel and heater use can cut 10 to 20% in winter. That is normal.' },
  { gap: 0, title: 'Speed and driving style', detail: 'Fuel use climbs fast above 60 mph. Driving 75 instead of 65 costs about 10 to 15% more fuel; hard acceleration costs more.' },
  { gap: 0.1, title: 'Roof racks and extra weight', detail: 'An empty roof rack can cost 5 to 15% on the highway. Take it off when you are not using it.' },
  { gap: 0.15, title: 'A dirty engine air filter or old spark plugs', detail: 'Cheap to check. Old plugs that misfire waste fuel even before the check engine light comes on.' },
  { gap: 0.2, title: 'An oxygen sensor, thermostat or dragging brake', detail: 'A failing O2 sensor or a thermostat stuck open makes the engine run rich. A brake that drags makes one wheel hot after driving. Worth a diagnosis.' },
];

const FAQS: [string, string][] = [
  [
    'How do I measure my real MPG?',
    "Fill the tank until the pump clicks off and reset the trip meter. Drive normally until the tank is at least half empty, fill it again the same way, and divide the miles on the trip meter by the gallons you just bought. Average two or three tanks: the car's own MPG display is often 3 to 8% optimistic.",
  ],
  [
    'Where do the MPG ratings come from?',
    "From fueleconomy.gov, the U.S. Department of Energy and EPA's official database. Since 2008 the ratings are adjusted to real-world driving, so a healthy car driven normally usually gets within about 10% of its combined rating.",
  ],
  [
    'Why does the trip cost use highway MPG?',
    "Long trips are mostly highway driving, where most cars beat their combined rating. Pick 'Mixed' or 'Mostly city' if your route has lots of traffic.",
  ],
  [
    'How much does a 10% MPG drop really cost?',
    'For a car rated 30 MPG driven 12,000 miles a year with gas at $3.50, dropping to 27 MPG costs about $156 a year. The "Is my MPG normal?" tab works this out for your car.',
  ],
  [
    'Is it cheaper to drive or fly?',
    "For two or more people on trips under about 500 miles, driving usually wins on fuel cost alone. The trip tab shows the cost per person; add tolls, parking and a night's hotel if the drive needs one.",
  ],
];

export default function MpgCalculator() {
  const [tab, setTab] = useState<Tab>('trip');

  // Your car
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [variants, setVariants] = useState<EpaVariant[]>([]);
  const [variantId, setVariantId] = useState('');
  const [rating, setRating] = useState<EpaRating | null>(null);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [manualMpg, setManualMpg] = useState('25');
  const [gas, setGas] = useState('3.50');
  const [kwh, setKwh] = useState('0.17');

  // Trip
  const [tripMiles, setTripMiles] = useState('300');
  const [roundTrip, setRoundTrip] = useState(true);
  const [people, setPeople] = useState('1');
  const [driving, setDriving] = useState<Driving>('highway');
  const [tolls, setTolls] = useState('');

  // Budget
  const [commute, setCommute] = useState('15');
  const [days, setDays] = useState('5');
  const [otherWeekly, setOtherWeekly] = useState('60');

  // Check
  const [observed, setObserved] = useState('');

  const electric = rating ? /electric/i.test(rating.fuelType) : false;
  const mpgFor = (d: Driving) => (rating ? (d === 'highway' ? rating.hwy : d === 'city' ? rating.city : rating.combined) : n(manualMpg));
  const costPerMile = (mpg: number) => (mpg > 0 ? (electric ? (KWH_PER_GALLON_EQUIVALENT / mpg) * n(kwh) : n(gas) / mpg) : 0);
  const unit = electric ? 'MPGe' : 'MPG';

  const applyVariant = async (v: EpaVariant) => {
    const r = await getEpaRating(v.id);
    setRating(r);
    setLookupNote(null);
  };
  const lookUp = async () => {
    if (!hasVehicle(vehicle)) {
      setLookupNote('Enter the year, make and model first.');
      return;
    }
    setLooking(true);
    setLookupNote(null);
    try {
      const { make, variants: found } = await findEpaVariants(Number(vehicle.year), vehicle.make.trim(), vehicle.model.trim());
      if (!make || !found.length) {
        setRating(null);
        setVariants([]);
        setLookupNote(`No EPA rating found for a ${vehicleLabel(vehicle)}. Check the spelling, or enter your MPG below.`);
        return;
      }
      setVariants(found);
      setVariantId(found[0].id);
      await applyVariant(found[0]);
    } catch {
      setLookupNote("Couldn't reach the EPA database (fueleconomy.gov). Enter your MPG below instead.");
    } finally {
      setLooking(false);
    }
  };

  // --- Trip ---
  const tripTotalMiles = n(tripMiles) * (roundTrip ? 2 : 1);
  const tripMpg = mpgFor(driving);
  const tripFuel = tripMpg ? tripTotalMiles / tripMpg : 0;
  const tripCost = tripTotalMiles * costPerMile(tripMpg) + n(tolls);
  const perPerson = tripCost / Math.max(1, Math.round(n(people)) || 1);

  // --- Budget ---
  const weeklyMiles = n(commute) * 2 * n(days) + n(otherWeekly);
  const monthlyMiles = (weeklyMiles * 52) / 12;
  const budgetMpg = mpgFor('mixed');
  const monthlyCost = monthlyMiles * costPerMile(budgetMpg);
  const yearlyMiles = weeklyMiles * 52;
  const per50c = budgetMpg && !electric ? (yearlyMiles / budgetMpg) * 0.5 : 0;

  // --- Check ---
  const rated = rating?.combined ?? 0;
  const obs = n(observed);
  const gap = rated && obs ? (rated - obs) / rated : null;
  const checkMiles = yearlyMiles || 12000;
  const extraPerYear = gap !== null && gap > 0 && obs ? checkMiles * (costPerMile(obs) - costPerMile(rated)) : 0;
  const verdict =
    gap === null ? null : gap <= 0.1 ? { tone: 'go' as const, text: 'Normal' } : gap <= 0.2 ? { tone: 'caution' as const, text: 'Lower than it should be' } : { tone: 'stop' as const, text: 'Much lower than it should be' };

  return (
    <ToolPage
      category="money"
      title="Fuel cost and MPG calculator"
      intro="What a trip or your monthly driving costs in gas, whether your car gets the mileage it should (and what the gap costs you), and which of two cars is cheaper to run."
      sources="Official EPA ratings from fueleconomy.gov (U.S. Department of Energy and EPA)."
    >
      <Panel aria-labelledby="mpg-car-title">
        <PanelTitle>
          <span id="mpg-car-title">Your car and fuel price</span>
        </PanelTitle>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="space-y-3">
            <VehicleFields value={vehicle} onChange={setVehicle} optionalLabel />
            <div className="flex flex-wrap items-center gap-3">
              <SecondaryButton type="button" onClick={lookUp} disabled={looking}>
                {looking ? 'Looking up…' : 'Get EPA fuel economy'}
              </SecondaryButton>
              {rating && (
                <p className="text-[0.9375rem]" role="status">
                  EPA: <strong>{rating.combined}</strong> {unit} combined · {rating.city} city · {rating.hwy} highway
                </p>
              )}
            </div>
            {variants.length > 1 && (
              <Field label={`Version (${variants.length} EPA ratings)`} htmlFor="mpg-variant">
                <select
                  id="mpg-variant"
                  value={variantId}
                  onChange={(e) => {
                    setVariantId(e.target.value);
                    const v = variants.find((x) => x.id === e.target.value);
                    if (v) applyVariant(v).catch(() => setLookupNote("Couldn't load that version."));
                  }}
                  className={inputClass}
                >
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.model} · {v.description}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {lookupNote && <Notice tone="warning">{lookupNote}</Notice>}
          </div>
          <div className="grid grid-cols-2 gap-3 self-start">
            {!rating && <NumberField id="mpg-manual" label="Your MPG" value={manualMpg} onChange={setManualMpg} step="1" hint="Or look up your car" />}
            {electric ? (
              <NumberField id="mpg-kwh" label="Electricity" value={kwh} onChange={setKwh} prefix="$" suffix="/kWh" step="0.01" />
            ) : (
              <NumberField id="mpg-gas" label="Gas price" value={gas} onChange={setGas} prefix="$" suffix="/gal" step="0.05" hint="Your local price" />
            )}
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid grid-cols-2 border-b border-border sm:flex sm:gap-1" role="tablist" aria-label="Calculators">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={tab === t.id ? `panel-${t.id}` : undefined}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px cursor-pointer border-b-2 px-3 py-3 text-center font-semibold sm:shrink-0 sm:px-4 sm:whitespace-nowrap',
              tab === t.id ? 'border-sign-green text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              focusRing,
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === 'trip' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <div className="grid grid-cols-2 gap-3">
                <NumberField id="trip-miles" label="Distance one way" value={tripMiles} onChange={setTripMiles} suffix="miles" step="10" />
                <NumberField id="trip-people" label="People splitting" value={people} onChange={setPeople} step="1" min={1} />
                <Field label="Driving" htmlFor="trip-driving">
                  <select id="trip-driving" value={driving} onChange={(e) => setDriving(e.target.value as Driving)} className={inputClass}>
                    <option value="highway">Mostly highway</option>
                    <option value="mixed">Mixed</option>
                    <option value="city">Mostly city</option>
                  </select>
                </Field>
                <NumberField id="trip-tolls" label="Tolls (optional)" value={tolls} onChange={setTolls} prefix="$" step="1" />
              </div>
              <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} className="size-4 accent-sign-green" />
                <span className="font-semibold">Round trip</span>
              </label>
              <p className="mt-3 text-sm text-muted-foreground">
                Not sure of the distance?{' '}
                <a href="https://www.google.com/maps/dir/" target="_blank" rel="noopener noreferrer" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                  Get directions on Google Maps
                </a>
                .
              </p>
            </Panel>
            <Panel aria-live="polite">
              <p className="text-[0.9375rem] text-muted-foreground">
                {tripTotalMiles.toLocaleString('en-US')} miles at {tripMpg || '–'} {unit}
              </p>
              <p className="font-heading text-4xl font-extrabold tracking-[-0.02em]">{money(tripCost)}</p>
              {Math.round(n(people)) > 1 && <p className="text-lg font-semibold">{money(perPerson, 2)} per person</p>}
              <FactList
                className="mt-4"
                items={[
                  [electric ? 'Electricity' : 'Fuel', electric ? `${Math.round((tripFuel * KWH_PER_GALLON_EQUIVALENT) / 1).toLocaleString('en-US')} kWh` : `${tripFuel.toFixed(1)} gallons`],
                  ['Cost per mile', money(costPerMile(tripMpg), 3)],
                  ...(n(tolls) ? ([['Tolls', money(n(tolls))]] as [string, string][]) : []),
                ]}
              />
              <p className="mt-4 text-sm text-muted-foreground">Cruising at 75 mph instead of 65 uses about 10 to 15% more fuel on most cars.</p>
            </Panel>
          </div>
        )}

        {tab === 'budget' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <div className="grid grid-cols-2 gap-3">
                <NumberField id="bud-commute" label="Commute, one way" value={commute} onChange={setCommute} suffix="miles" step="1" />
                <NumberField id="bud-days" label="Days a week" value={days} onChange={setDays} step="1" />
                <NumberField id="bud-other" label="Other driving a week" value={otherWeekly} onChange={setOtherWeekly} suffix="miles" step="10" hint="Errands, weekends" />
              </div>
            </Panel>
            <Panel aria-live="polite">
              <p className="text-[0.9375rem] text-muted-foreground">
                About {Math.round(monthlyMiles).toLocaleString('en-US')} miles a month at {budgetMpg || '–'} {unit}
              </p>
              <p className="font-heading text-4xl font-extrabold tracking-[-0.02em]">
                {money(monthlyCost)} <span className="text-lg font-bold text-muted-foreground">a month</span>
              </p>
              <FactList
                className="mt-4"
                items={[
                  ['A year', money(monthlyCost * 12)],
                  ['Your commute alone', `${money(n(commute) * 2 * n(days) * (52 / 12) * costPerMile(budgetMpg))} a month`],
                  ...(per50c ? ([['If gas goes up 50¢', `+${money(per50c)} a year`]] as [string, string][]) : []),
                ]}
              />
            </Panel>
          </div>
        )}

        {tab === 'check' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              {!rating ? (
                <Notice tone="info">Look up your car above first: the check compares your real mileage with its official EPA rating.</Notice>
              ) : (
                <>
                  <NumberField id="chk-observed" label={`Your real ${unit}`} value={observed} onChange={setObserved} step="0.1" hint="Measured at the pump over two or three tanks (see how below)." />
                  <p className="mt-4 text-[0.9375rem]">
                    EPA combined rating for your {vehicleLabel(vehicle)}: <strong>{rated} {unit}</strong>
                  </p>
                </>
              )}
            </Panel>
            <Panel aria-live="polite">
              {verdict && gap !== null ? (
                <>
                  <Verdict tone={verdict.tone}>{verdict.text}</Verdict>
                  <p className="mt-3 font-heading text-2xl leading-snug font-extrabold">
                    {gap <= 0 ? `You beat the rating by ${Math.round(-gap * 100)}%.` : `${Math.round(gap * 100)}% below the EPA rating.`}
                  </p>
                  {extraPerYear >= 1 && (
                    <p className="mt-2 text-lg">
                      That costs about <strong>{money(extraPerYear)} a year</strong> at {Math.round(checkMiles).toLocaleString('en-US')} miles.
                    </p>
                  )}
                  {gap > 0.1 && (
                    <>
                      <h3 className="mt-5 font-bold">Most likely causes, cheapest first</h3>
                      <ul className="mt-2 space-y-2.5 text-[0.9375rem]">
                        {CAUSES.filter((c) => c.gap <= gap).map((c) => (
                          <li key={c.title}>
                            <strong>{c.title}.</strong> <span className="text-muted-foreground">{c.detail}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-[0.9375rem]">
                        Check engine light on?{' '}
                        <Link to="/fault-code-decoder" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                          Look up the code
                        </Link>
                        : misfire and oxygen sensor codes often explain a big drop.
                      </p>
                    </>
                  )}
                  {gap <= 0.1 && <p className="mt-3 text-[0.9375rem] text-muted-foreground">Within 10% of the rating is normal for real-world driving.</p>}
                </>
              ) : (
                <p className="text-muted-foreground">Enter the MPG you measure at the pump to see if it's normal and what any gap costs you.</p>
              )}
            </Panel>
          </div>
        )}

        {tab === 'compare' && <CompareCars />}
      </div>

      <LeadPanel
        id="mpg-lead"
        className="mt-8"
        title="Get fuel savings offers"
        intro="Leave your details to hear about gas rewards and fuel savings offers for drivers like you."
        cta="Send me offers"
        sentText="Thanks. We'll contact you when a fuel savings offer matches your driving."
        sheet="mpg_fuel_rewards_leads.json"
        source="MPG_Calculator"
        details={() => ({
          vehicleYear: vehicle.year,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          gasPrice: gas,
          monthlyFuelCost: Math.round(monthlyCost),
        })}
      />

      <Faq id="mpg-faq" title="Questions about fuel costs and MPG" items={FAQS} />
    </ToolPage>
  );
}
