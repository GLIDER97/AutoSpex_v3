import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import OwnershipInsuranceLeadForm from './OwnershipInsuranceLeadForm';
import { findEpaVariants, getEpaRating, type EpaVariant } from '../utils/fuelEconomy';
import { CATEGORY_LABELS, SEGMENT_DEFAULTS, ownershipCost, type CarInput, type Segment, type SharedInput } from '../utils/ownership';
import { BarList, PairedBars, StackedColumns } from './tool/charts';
import {
  Field,
  Notice,
  NumberField,
  Panel,
  PanelTitle,
  PrimaryButton,
  SecondaryButton,
  ToolPage,
  VehicleFields,
  focusRing,
  hasVehicle,
  inputClass,
  money,
  vehicleLabel,
  type Vehicle,
} from './tool/kit';

const SEGMENTS: Segment[] = ['Sedan', 'SUV', 'Truck', 'Hybrid', 'EV'];

interface CarForm {
  name: string;
  vehicle: Vehicle;
  segment: Segment;
  price: string;
  mpg: string;
  electric: boolean;
  insurance: string;
  firstYearDrop: string;
  yearlyDrop: string;
  maintenance: string;
}

const newCar = (name: string, segment: Segment, price: number, mpg: number): CarForm => ({
  name,
  vehicle: { year: '', make: '', model: '' },
  segment,
  price: String(price),
  mpg: String(mpg),
  electric: segment === 'EV',
  insurance: '2000',
  firstYearDrop: String(SEGMENT_DEFAULTS[segment].firstYearDrop),
  yearlyDrop: String(SEGMENT_DEFAULTS[segment].yearlyDrop),
  maintenance: String(SEGMENT_DEFAULTS[segment].maintenancePerMile),
});

const n = (v: string) => Math.max(0, Number(v) || 0);

function CarEditor({ id, car, onChange, onRemove }: { id: string; car: CarForm; onChange: (c: CarForm) => void; onRemove?: () => void }) {
  const [looking, setLooking] = useState(false);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [variants, setVariants] = useState<EpaVariant[]>([]);
  const [variantId, setVariantId] = useState('');
  const set = (patch: Partial<CarForm>) => onChange({ ...car, ...patch });

  const applyVariant = async (variant: EpaVariant) => {
    const rating = await getEpaRating(variant.id);
    const electric = /electric/i.test(rating.fuelType);
    set({ mpg: String(rating.combined), electric, name: vehicleLabel(car.vehicle), ...(electric ? { segment: 'EV' as Segment } : {}) });
    setLookupNote(`EPA: ${rating.combined} ${electric ? 'MPGe' : 'MPG'} combined.`);
  };

  const lookUp = async () => {
    if (!hasVehicle(car.vehicle)) {
      setLookupNote('Enter the year, make and model first.');
      return;
    }
    setLooking(true);
    setLookupNote(null);
    try {
      const { variants: found } = await findEpaVariants(Number(car.vehicle.year), car.vehicle.make, car.vehicle.model);
      const variants = found;
      if (!variants.length) {
        setLookupNote('No EPA rating found for that car. Enter the MPG yourself.');
        return;
      }
      setVariants(variants);
      setVariantId(variants[0].id);
      await applyVariant(variants[0]);
    } catch {
      setLookupNote("Couldn't reach the EPA right now. Enter the MPG yourself.");
    } finally {
      setLooking(false);
    }
  };

  const setSegment = (segment: Segment) => {
    const d = SEGMENT_DEFAULTS[segment];
    set({
      segment,
      electric: segment === 'EV',
      firstYearDrop: String(d.firstYearDrop),
      yearlyDrop: String(d.yearlyDrop),
      maintenance: String(d.maintenancePerMile),
    });
  };

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-name`} className="sr-only">
          Car name
        </label>
        <input
          id={`${id}-name`}
          value={car.name}
          onChange={(e) => set({ name: e.target.value })}
          className={cn('min-w-0 flex-1 rounded-md bg-transparent font-heading text-xl font-extrabold hover:bg-muted/60', focusRing)}
        />
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Remove ${car.name}`} className={cn('cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted', focusRing)}>
            <X className="size-5" />
          </button>
        )}
      </div>
      <div className="rounded-lg bg-muted/60 p-3">
        <VehicleFields value={car.vehicle} onChange={(vehicle) => set({ vehicle })} />
        <SecondaryButton type="button" onClick={lookUp} disabled={looking} className="mt-3 h-10">
          {looking ? 'Looking up…' : 'Get EPA fuel economy'}
        </SecondaryButton>
        {variants.length > 1 && (
          <Field label={`Version (${variants.length} EPA ratings)`} htmlFor={`${id}-variant`} className="mt-3">
            <select
              id={`${id}-variant`}
              value={variantId}
              onChange={(e) => {
                setVariantId(e.target.value);
                const v = variants.find((x) => x.id === e.target.value);
                if (v) applyVariant(v).catch(() => setLookupNote("Couldn't load that version's rating."));
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
        {lookupNote && <p className="mt-2 text-[0.9375rem]">{lookupNote}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField id={`${id}-price`} label="Purchase price" value={car.price} onChange={(price) => set({ price })} prefix="$" step="500" />
        <Field label="Type" htmlFor={`${id}-segment`}>
          <select id={`${id}-segment`} value={car.segment} onChange={(e) => setSegment(e.target.value as Segment)} className={inputClass}>
            {SEGMENTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <NumberField id={`${id}-mpg`} label={car.electric ? 'Efficiency (MPGe)' : 'Fuel economy (MPG)'} value={car.mpg} onChange={(mpg) => set({ mpg })} step="1" />
        <NumberField id={`${id}-ins`} label="Insurance per year" value={car.insurance} onChange={(insurance) => set({ insurance })} prefix="$" step="50" />
      </div>
      <details className="group">
        <summary className={cn('cursor-pointer rounded-sm text-[0.9375rem] font-semibold underline underline-offset-4', focusRing)}>
          Adjust depreciation and maintenance
        </summary>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <NumberField id={`${id}-d1`} label="Value lost, year 1" value={car.firstYearDrop} onChange={(firstYearDrop) => set({ firstYearDrop })} suffix="%" />
          <NumberField id={`${id}-d2`} label="Each year after" value={car.yearlyDrop} onChange={(yearlyDrop) => set({ yearlyDrop })} suffix="%" />
          <NumberField id={`${id}-m`} label="Upkeep per mile" value={car.maintenance} onChange={(maintenance) => set({ maintenance })} prefix="$" step="0.01" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Starting values are typical for a {car.segment.toLowerCase()}. Upkeep is the five-year average; it starts lower and rises as the car ages.
        </p>
      </details>
    </Panel>
  );
}

const OwnershipCalculator: React.FC = () => {
  const [cars, setCars] = useState<CarForm[]>([newCar('Car 1', 'Sedan', 32000, 32)]);
  const [years, setYears] = useState(5);
  const [miles, setMiles] = useState('12000');
  const [gas, setGas] = useState('3.50');
  const [kwh, setKwh] = useState('0.17');
  const [taxRate, setTaxRate] = useState('6');
  const [registration, setRegistration] = useState('200');
  const [downRate, setDownRate] = useState('20');
  const [apr, setApr] = useState('7.5');
  const [term, setTerm] = useState(60);
  const [zip, setZip] = useState('');
  const [leadOpen, setLeadOpen] = useState(false);

  const shared: SharedInput = {
    years,
    milesPerYear: n(miles),
    gasPrice: n(gas),
    electricityPrice: n(kwh),
    salesTaxRate: n(taxRate) / 100,
    registrationPerYear: n(registration),
    downPaymentRate: Math.min(1, n(downRate) / 100),
    apr: n(apr),
    termMonths: term,
  };

  const results = useMemo(
    () =>
      cars.map((c) => {
        const input: CarInput = {
          price: n(c.price),
          mpg: n(c.mpg),
          electric: c.electric,
          insurancePerYear: n(c.insurance),
          firstYearDrop: Math.min(100, n(c.firstYearDrop)),
          yearlyDrop: Math.min(100, n(c.yearlyDrop)),
          maintenancePerMile: n(c.maintenance),
        };
        return ownershipCost(input, shared);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cars, years, miles, gas, kwh, taxRate, registration, downRate, apr, term],
  );

  const categories = Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[];
  const first = results[0];
  const compare = results.length === 2;
  const diff = compare ? results[0].total - results[1].total : 0;
  const cheaper = diff > 0 ? cars[1].name : cars[0].name;
  const milesBand = n(miles) <= 7500 ? '5k' : n(miles) <= 12500 ? '10k' : n(miles) <= 17500 ? '15k' : '20k+';

  return (
    <ToolPage
      category="money"
      title="Cost of ownership"
      intro="What a car really costs to own: value lost, fuel or charging, insurance, upkeep, loan interest and taxes, year by year. Compare two cars side by side."
      sources="EPA fuel economy (fueleconomy.gov). Standard loan math. Depreciation and upkeep start from typical values for each vehicle type, and every assumption can be changed."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="min-w-0 space-y-6">
          {cars.map((car, i) => (
            <CarEditor
              key={i}
              id={`car${i + 1}`}
              car={car}
              onChange={(c) => setCars((cs) => cs.map((x, j) => (j === i ? c : x)))}
              onRemove={i > 0 ? () => setCars((cs) => cs.filter((_, j) => j !== i)) : undefined}
            />
          ))}
          {cars.length < 2 && (
            <SecondaryButton type="button" onClick={() => setCars((cs) => [...cs, newCar('Car 2', 'Hybrid', 36000, 48)])} className="w-full">
              <Plus className="size-4" aria-hidden="true" /> Compare with another car
            </SecondaryButton>
          )}

          <Panel className="space-y-4">
            <PanelTitle>How you'll drive and pay</PanelTitle>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Years you'll keep it" htmlFor="years">
                <select id="years" value={years} onChange={(e) => setYears(Number(e.target.value))} className={inputClass}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((y) => (
                    <option key={y} value={y}>
                      {y} {y === 1 ? 'year' : 'years'}
                    </option>
                  ))}
                </select>
              </Field>
              <NumberField id="miles" label="Miles per year" value={miles} onChange={setMiles} step="500" />
              <NumberField id="gas" label="Gas price" value={gas} onChange={setGas} prefix="$" suffix="/gal" step="0.05" />
              <NumberField id="kwh" label="Electricity" value={kwh} onChange={setKwh} prefix="$" suffix="/kWh" step="0.01" />
              <NumberField id="down-rate" label="Down payment" value={downRate} onChange={setDownRate} suffix="%" step="5" />
              <NumberField id="own-apr" label="Loan APR" value={apr} onChange={setApr} suffix="%" step="0.1" />
              <Field label="Loan length" htmlFor="own-term">
                <select id="own-term" value={term} onChange={(e) => setTerm(Number(e.target.value))} className={inputClass}>
                  {[36, 48, 60, 72, 84].map((t) => (
                    <option key={t} value={t}>
                      {t} months
                    </option>
                  ))}
                </select>
              </Field>
              <NumberField id="own-tax" label="Sales tax" value={taxRate} onChange={setTaxRate} suffix="%" step="0.25" />
              <NumberField id="reg" label="Registration per year" value={registration} onChange={setRegistration} prefix="$" step="25" />
              <Field label="ZIP code (optional)" htmlFor="own-zip">
                <input id="own-zip" inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))} className={inputClass} />
              </Field>
            </div>
          </Panel>
        </div>

        <div className="min-w-0 space-y-6" aria-live="polite">
          {compare ? (
            <Panel>
              <p className="font-heading text-2xl leading-snug font-extrabold">
                {Math.abs(diff) < 1
                  ? `Both cars cost about the same over ${years} years.`
                  : `${cheaper} costs ${money(Math.abs(diff))} less over ${years} ${years === 1 ? 'year' : 'years'} (${money(Math.abs(diff) / (years * 12))} a month).`}
              </p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {results.map((r, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <dt className="font-bold">{cars[i].name}</dt>
                    <dd className="mt-1">
                      <span className="block font-heading text-3xl font-extrabold tabular-nums">{money(r.total)}</span>
                      <span className="text-[0.9375rem] text-muted-foreground">
                        {money(r.perMonth)} a month, {money(r.perMile, 2)} a mile, worth {money(r.resaleValue)} at the end
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          ) : (
            <Panel>
              <p className="text-[0.9375rem] text-muted-foreground">
                {cars[0].name}, {years} {years === 1 ? 'year' : 'years'}, {n(miles).toLocaleString('en-US')} miles a year
              </p>
              <p className="mt-1 font-heading text-5xl font-extrabold tabular-nums">{money(first.total)}</p>
              <p className="mt-1 text-lg text-muted-foreground">
                {money(first.perMonth)} a month, {money(first.perMile, 2)} a mile. Worth about {money(first.resaleValue)} when you sell.
              </p>
            </Panel>
          )}

          <Panel>
            <PanelTitle>Where the money goes</PanelTitle>
            <div className="mt-4">
              {compare ? (
                <PairedBars
                  series={[cars[0].name, cars[1].name]}
                  categories={categories.map((k) => ({ label: CATEGORY_LABELS[k], values: [results[0].totals[k], results[1].totals[k]] }))}
                />
              ) : (
                <BarList items={categories.map((k) => ({ label: CATEGORY_LABELS[k], value: first.totals[k] })).sort((a, b) => b.value - a.value)} />
              )}
            </div>
            {first.totals.depreciation > 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                Value lost isn't paid out of pocket, but it's real: it's the difference between what you pay and what you sell for.
              </p>
            )}
          </Panel>

          {results.map((r, i) => (
            <Panel key={i}>
              <PanelTitle>Year by year{compare ? `: ${cars[i].name}` : ''}</PanelTitle>
              <div className="mt-4">
                <StackedColumns
                  title={`Value lost and money spent per year for ${cars[i].name}`}
                  series={['Money spent', 'Value lost']}
                  periods={r.years.map((y) => ({
                    label: y.label,
                    values: [y.fuel + y.insurance + y.maintenance + y.interest + y.taxesAndFees, y.depreciation],
                  }))}
                />
              </div>
            </Panel>
          ))}

          <Notice tone="info" title="How this is calculated">
            Fuel uses your miles and the car's MPG (EVs use MPGe with 33.7 kWh per gallon equivalent). Interest counts only the months you own the
            car. Sales tax is paid in year one. Depreciation and upkeep start from typical values for the vehicle type; change them for your car.
          </Notice>

          <Panel>
            <PanelTitle>Insurance is often the cost that varies most</PanelTitle>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">Compare real quotes for {cars[0].name === 'Car 1' ? 'this car' : cars[0].name}.</p>
            <PrimaryButton type="button" className="mt-4" onClick={() => setLeadOpen(true)}>
              Get insurance quotes
            </PrimaryButton>
          </Panel>
        </div>
      </div>

      <OwnershipInsuranceLeadForm
        isOpen={leadOpen}
        onClose={() => setLeadOpen(false)}
        ownershipData={{
          carType: cars[0].segment,
          purchasePrice: String(n(cars[0].price)),
          zipCode: zip,
          annualMiles: milesBand,
          ownershipPeriod: years <= 3 ? '3 years' : '5 years',
        }}
      />
    </ToolPage>
  );
};

export default OwnershipCalculator;
