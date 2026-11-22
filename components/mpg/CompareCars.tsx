import React, { useState } from 'react';
import { findEpaVariants, getEpaRating, type EpaVariant } from '../../utils/fuelEconomy';
import { PairedBars } from '../tool/charts';
import { Field, Notice, NumberField, Panel, PanelTitle, SecondaryButton, VehicleFields, hasVehicle, inputClass, money, vehicleLabel, type Vehicle } from '../tool/kit';

interface Slot {
  vehicle: Vehicle;
  name: string;
  mpg: string;
  electric: boolean;
  price: string;
  variants: EpaVariant[];
  variantId: string;
  note: string | null;
  loading: boolean;
}

const emptySlot = (name: string, mpg: string): Slot => ({
  vehicle: { year: '', make: '', model: '' },
  name,
  mpg,
  electric: false,
  price: '',
  variants: [],
  variantId: '',
  note: null,
  loading: false,
});

const n = (v: string) => Math.max(0, Number(v) || 0);
const KWH_PER_GALLON_EQUIVALENT = 33.7;

function SlotEditor({ id, slot, onChange }: { id: string; slot: Slot; onChange: (patch: Partial<Slot>) => void }) {
  const apply = async (variant: EpaVariant, base: Partial<Slot> = {}) => {
    const r = await getEpaRating(variant.id);
    const electric = /electric/i.test(r.fuelType);
    onChange({ ...base, mpg: String(r.combined), electric, name: vehicleLabel(slot.vehicle), note: `EPA: ${r.combined} ${electric ? 'MPGe' : 'MPG'} combined.`, loading: false });
  };
  const lookUp = async () => {
    if (!hasVehicle(slot.vehicle)) return onChange({ note: 'Enter the year, make and model first.' });
    onChange({ loading: true, note: null });
    try {
      const { variants } = await findEpaVariants(Number(slot.vehicle.year), slot.vehicle.make, slot.vehicle.model);
      if (!variants.length) return onChange({ loading: false, note: 'No EPA rating found. Enter the MPG yourself.' });
      await apply(variants[0], { variants, variantId: variants[0].id });
    } catch {
      onChange({ loading: false, note: "Couldn't reach the EPA. Enter the MPG yourself." });
    }
  };

  return (
    <Panel className="space-y-4">
      <PanelTitle>{slot.name}</PanelTitle>
      <VehicleFields value={slot.vehicle} onChange={(vehicle) => onChange({ vehicle })} />
      <SecondaryButton type="button" onClick={lookUp} loading={slot.loading} className="h-10">
        {slot.loading ? 'Looking up…' : 'Get EPA fuel economy'}
      </SecondaryButton>
      {slot.variants.length > 1 && (
        <Field label={`Version (${slot.variants.length} EPA ratings)`} htmlFor={`${id}-variant`}>
          <select
            id={`${id}-variant`}
            value={slot.variantId}
            onChange={(e) => {
              const v = slot.variants.find((x) => x.id === e.target.value);
              onChange({ variantId: e.target.value });
              if (v) apply(v).catch(() => onChange({ note: "Couldn't load that version." }));
            }}
            className={inputClass}
          >
            {slot.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.model} · {v.description}
              </option>
            ))}
          </select>
        </Field>
      )}
      {slot.note && <p className="text-[0.9375rem]">{slot.note}</p>}
      <div className="grid grid-cols-2 gap-3">
        <NumberField id={`${id}-mpg`} label={slot.electric ? 'Efficiency (MPGe)' : 'Fuel economy (MPG)'} value={slot.mpg} onChange={(mpg) => onChange({ mpg })} step="1" />
        <NumberField id={`${id}-price`} label="Price (optional)" value={slot.price} onChange={(price) => onChange({ price })} prefix="$" step="500" hint="For the break-even point" />
      </div>
    </Panel>
  );
}

export default function CompareCars() {
  const [slots, setSlots] = useState<[Slot, Slot]>([emptySlot('Car 1', '28'), emptySlot('Car 2', '48')]);
  const [miles, setMiles] = useState('12000');
  const [gas, setGas] = useState('3.50');
  const [kwh, setKwh] = useState('0.17');
  const [years, setYears] = useState('5');

  const update = (i: 0 | 1) => (patch: Partial<Slot>) => setSlots((s) => (i === 0 ? [{ ...s[0], ...patch }, s[1]] : [s[0], { ...s[1], ...patch }]));

  const perMile = (s: Slot) => {
    const mpg = n(s.mpg);
    if (!mpg) return 0;
    return s.electric ? (KWH_PER_GALLON_EQUIVALENT / mpg) * n(kwh) : n(gas) / mpg;
  };
  const yearly = slots.map((s) => perMile(s) * n(miles));
  const yrs = Math.max(1, n(years));
  const [a, b] = yearly;
  const cheaperIdx = a <= b ? 0 : 1;
  const savings = Math.abs(a - b);
  const priceGap = n(slots[cheaperIdx].price) - n(slots[1 - cheaperIdx].price);
  const payback = priceGap > 0 && savings > 0 ? priceGap / savings : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <SlotEditor id="cmp1" slot={slots[0]} onChange={update(0)} />
        <SlotEditor id="cmp2" slot={slots[1]} onChange={update(1)} />
      </div>
      <Panel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField id="cmp-miles" label="Miles per year" value={miles} onChange={setMiles} step="500" />
          <NumberField id="cmp-gas" label="Gas price" value={gas} onChange={setGas} prefix="$" suffix="/gal" step="0.05" />
          <NumberField id="cmp-kwh" label="Electricity" value={kwh} onChange={setKwh} prefix="$" suffix="/kWh" step="0.01" />
          <NumberField id="cmp-years" label="Years" value={years} onChange={setYears} step="1" />
        </div>
      </Panel>
      <Panel aria-live="polite">
        {savings < 1 ? (
          <p className="font-heading text-2xl font-extrabold">Both cars cost about the same to fuel.</p>
        ) : (
          <p className="font-heading text-2xl leading-snug font-extrabold">
            {slots[cheaperIdx].name} saves {money(savings)} a year on fuel, {money(savings * yrs)} over {yrs} {yrs === 1 ? 'year' : 'years'}.
          </p>
        )}
        {payback !== null && (
          <p className="mt-2 text-lg">
            Its {money(priceGap)} higher price pays for itself in <strong>{payback.toFixed(1)} years</strong>
            {payback > yrs ? `, longer than the ${yrs} years you entered.` : '.'}
          </p>
        )}
        {priceGap < 0 && savings >= 1 && <p className="mt-2 text-lg">It's also the cheaper car to buy.</p>}
        <div className="mt-6">
          <PairedBars
            series={[slots[0].name, slots[1].name]}
            categories={[
              { label: 'Fuel or charging per year', values: [a, b] },
              { label: `Over ${yrs} ${yrs === 1 ? 'year' : 'years'}`, values: [a * yrs, b * yrs] },
            ]}
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Cost per mile: {slots[0].name} {money(perMile(slots[0]), 3)}, {slots[1].name} {money(perMile(slots[1]), 3)}. Electric cars use MPGe with 33.7
          kWh per gallon equivalent.
        </p>
      </Panel>
      <Notice tone="info">EPA ratings are lab results. Real-world mileage depends on driving style, weather and maintenance, but the comparison between two cars holds up well.</Notice>
    </div>
  );
}
