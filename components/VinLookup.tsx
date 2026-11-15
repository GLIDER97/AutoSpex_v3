import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveLead } from '../utils/leadStorage';
import { checkVin, decodeVin, getCrashRatings, type CrashRating, type DecodedVin } from '../utils/vehicleReport';
import { searchRecalls, type Recall } from '../utils/nhtsaRecalls';
import { formatComponent } from '../utils/nhtsa';
import { searchComplaints, type ComplaintSummary } from '../utils/nhtsaComplaints';
import { findEpaVariants, getEpaRating, type EpaRating } from '../utils/fuelEconomy';
import {
  FactList,
  Field,
  Notice,
  Panel,
  PanelTitle,
  PrimaryButton,
  Spinner,
  ToolPage,
  focusRing,
  inputClass,
  money,
} from './tool/kit';

const EXAMPLE_VIN = '1HGCM82633A004352';

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\(Usa\)/, '(USA)');
const formatDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const SAFETY_FEATURES: [string, string][] = [
  ['CIB', 'Automatic emergency braking'],
  ['PedestrianAutomaticEmergencyBraking', 'Pedestrian emergency braking'],
  ['ForwardCollisionWarning', 'Forward collision warning'],
  ['BlindSpotMon', 'Blind spot warning'],
  ['BlindSpotIntervention', 'Blind spot intervention'],
  ['LaneDepartureWarning', 'Lane departure warning'],
  ['LaneKeepSystem', 'Lane keeping assist'],
  ['LaneCenteringAssistance', 'Lane centering'],
  ['AdaptiveCruiseControl', 'Adaptive cruise control'],
  ['RearVisibilitySystem', 'Backup camera'],
  ['RearCrossTrafficAlert', 'Rear cross traffic alert'],
  ['RearAutomaticEmergencyBraking', 'Rear automatic braking'],
  ['ParkAssist', 'Park assist'],
  ['ESC', 'Electronic stability control'],
  ['TractionControl', 'Traction control'],
  ['ABS', 'Anti-lock brakes'],
  ['TPMS', 'Tire pressure monitoring'],
  ['DynamicBrakeSupport', 'Dynamic brake support'],
  ['AdaptiveDrivingBeam', 'Adaptive driving beam'],
  ['SemiautomaticHeadlampBeamSwitching', 'Automatic high beams'],
  ['DaytimeRunningLight', 'Daytime running lights'],
  ['KeylessIgnition', 'Keyless ignition'],
];

const AIRBAGS: [string, string][] = [
  ['AirBagLocFront', 'Front'],
  ['AirBagLocSide', 'Side'],
  ['AirBagLocCurtain', 'Curtain'],
  ['AirBagLocKnee', 'Knee'],
  ['AirBagLocSeatCushion', 'Seat cushion'],
];

function Stars({ rating, label }: { rating: string; label: string }) {
  const n = Number(rating);
  if (!(n >= 1 && n <= 5)) return <span className="text-[0.9375rem] text-muted-foreground">Not rated</span>;
  return (
    <span role="img" aria-label={`${label}: ${n} out of 5 stars`} className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('size-5', i <= n ? 'fill-sign-yellow text-sign-yellow' : 'text-slate-300 dark:text-slate-600')} aria-hidden="true" />
      ))}
    </span>
  );
}

/** Loads one section of the report and keeps its own loading/error state. */
function useSection<T>(load: (() => Promise<T>) | null, key: string) {
  const [state, setState] = useState<{ data: T | null; failed: boolean; loaded: boolean }>({ data: null, failed: false, loaded: false });
  useEffect(() => {
    if (!load) return;
    let live = true;
    setState({ data: null, failed: false, loaded: false });
    load()
      .then((data) => live && setState({ data, failed: false, loaded: true }))
      .catch(() => live && setState({ data: null, failed: true, loaded: true }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

function Report({ vin, decoded }: { vin: string; decoded: DecodedVin }) {
  const f = decoded.fields;
  const year = Number(f.ModelYear);
  const make = f.Make ?? '';
  const model = f.Model ?? '';
  const canLookUp = Boolean(year && make && model);
  const key = `${year}|${make}|${model}`;
  const name = [f.ModelYear, titleCase(make), model, f.Trim].filter(Boolean).join(' ');

  const recalls = useSection<Recall[]>(canLookUp ? () => searchRecalls(year, make, model).then((r) => r.recalls) : null, key);
  const complaints = useSection<ComplaintSummary>(canLookUp ? () => searchComplaints(year, make, model) : null, key);
  const ratings = useSection<CrashRating[]>(canLookUp ? () => getCrashRatings(year, make, model) : null, key);
  const fuel = useSection<{ rating: EpaRating; description: string } | null>(
    canLookUp
      ? async () => {
          const { variants } = await findEpaVariants(year, make, model);
          if (!variants.length) return null;
          // Prefer the EPA version with this VIN's engine ("4 cyl, 1.5 L").
          const engine = f.EngineCylinders && f.DisplacementL ? `${f.EngineCylinders} cyl, ${Number(f.DisplacementL).toFixed(1)} L` : '';
          const match = variants.find((v) => engine && v.description.includes(engine)) ?? variants[0];
          return { rating: await getEpaRating(match.id), description: `${match.model}, ${match.description}` };
        }
      : null,
    key,
  );

  const engine = [
    f.EngineCylinders && `${f.EngineCylinders} cylinders`,
    f.DisplacementL && `${Number(f.DisplacementL).toFixed(1)} L`,
    f.EngineHP && `${Math.round(Number(f.EngineHP))} hp`,
    f.ElectrificationLevel,
  ]
    .filter(Boolean)
    .join(', ');
  const specs: [string, React.ReactNode][] = (
    [
      ['Engine', engine],
      ['Fuel', f.FuelTypePrimary && [f.FuelTypePrimary, f.FuelTypeSecondary].filter(Boolean).join(' / ')],
      ['Transmission', [f.TransmissionSpeeds && `${f.TransmissionSpeeds}-speed`, f.TransmissionStyle].filter(Boolean).join(' ')],
      ['Drive', f.DriveType],
      ['Body', [f.BodyClass, f.Doors && `${f.Doors} doors`].filter(Boolean).join(', ')],
      ['Seats', [f.Seats, f.SeatRows && `in ${f.SeatRows} rows`].filter(Boolean).join(' ')],
      ['Curb weight', f.CurbWeightLB && `${Number(f.CurbWeightLB).toLocaleString('en-US')} lb`],
      ['Weight class (GVWR)', f.GVWR?.replace(/^Class /, 'Class ')],
      ['Base price when new', f.BasePrice && money(Number(f.BasePrice))],
      ['Built in', [f.PlantCity, f.PlantState, f.PlantCountry].filter(Boolean).map(titleCase).join(', ')],
      ['Manufacturer', f.Manufacturer && titleCase(f.Manufacturer)],
    ] as [string, React.ReactNode][]
  ).filter(([, v]) => v);
  const safety = SAFETY_FEATURES.filter(([k]) => f[k]).map(([k, label]) => [label, f[k]] as const);
  const airbags = AIRBAGS.filter(([k]) => f[k]).map(([k, label]) => [label, f[k]] as const);

  const openRecalls = recalls.data?.length ?? null;
  const overall = ratings.data?.[0]?.overall;

  return (
    <div className="mt-8 space-y-6">
      <Panel>
        <p className="font-mono text-[0.9375rem] tracking-wider text-muted-foreground">{vin}</p>
        <h2 className="mt-1 font-heading text-3xl leading-tight font-extrabold tracking-[-0.015em] sm:text-4xl">{name}</h2>
        <p className="mt-1 text-lg text-muted-foreground">{[f.BodyClass, engine, f.DriveType].filter(Boolean).join(', ')}</p>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-5 sm:grid-cols-4">
          {[
            ['Recalls on this model', openRecalls == null ? '…' : String(openRecalls), '#vin-recalls'],
            ['Owner complaints', complaints.data ? complaints.data.total.toLocaleString('en-US') : '…', '#vin-complaints'],
            ['Overall crash rating', overall && Number(overall) ? `${overall} of 5 stars` : ratings.data ? 'Not rated' : '…', '#vin-ratings'],
            ['Combined fuel economy', fuel.data ? `${fuel.data.rating.combined} MPG` : canLookUp && !fuel.loaded ? '…' : 'Not listed', '#vin-fuel'],
          ].map(([label, value, href]) => (
            <div key={label}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd>
                <a href={href} className={cn('font-heading text-2xl font-extrabold hover:underline', focusRing)}>
                  {value}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      {decoded.warnings.length > 0 && (
        <Notice tone="warning" title="NHTSA's decoder flagged this VIN">
          <ul className="list-disc pl-5">
            {decoded.warnings.map((w) => (
              <li key={w}>{w.replace(/^\d+\s*-\s*/, '')}</li>
            ))}
          </ul>
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle>Factory specs</PanelTitle>
          <FactList className="mt-3" items={specs} />
        </Panel>
        <Panel>
          <PanelTitle>Safety equipment</PanelTitle>
          {safety.length === 0 && airbags.length === 0 ? (
            <p className="mt-3 text-[0.9375rem] text-muted-foreground">The manufacturer didn't report safety equipment for this VIN.</p>
          ) : (
            <>
              <ul className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {safety.map(([label, value]) => (
                  <li key={label} className="flex gap-2 text-[0.9375rem]">
                    <CheckCircle2 className={cn('mt-0.5 size-4 shrink-0', value === 'Standard' ? 'text-sign-green' : 'text-muted-foreground')} aria-hidden="true" />
                    <span>
                      {label}
                      {value !== 'Standard' && <span className="text-muted-foreground"> ({value.toLowerCase()})</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {airbags.length > 0 && (
                <>
                  <h3 className="mt-5 font-bold">Airbags</h3>
                  <FactList className="mt-1" items={airbags.map(([k, v]) => [k, v])} />
                </>
              )}
            </>
          )}
        </Panel>
      </div>

      <Panel id="vin-recalls" className="scroll-mt-24">
        <PanelTitle>Safety recalls for the {year} {titleCase(make)} {model}</PanelTitle>
        <p className="mt-1 text-[0.9375rem] text-muted-foreground">
          Recall repairs are free at any dealer. To see whether this exact car still has an open recall, enter the VIN at{' '}
          <a href="https://www.nhtsa.gov/recalls" target="_blank" rel="noopener noreferrer" className={cn('underline underline-offset-4', focusRing)}>
            nhtsa.gov/recalls
          </a>
          .
        </p>
        <div className="mt-4">
          {!recalls.data && !recalls.failed && <Spinner label="Checking NHTSA recalls…" />}
          {recalls.failed && <p>NHTSA's recall records could not be loaded right now.</p>}
          {recalls.data?.length === 0 && <p className="font-semibold">NHTSA has no recalls on record for this model year.</p>}
          {recalls.data && recalls.data.length > 0 && (
            <ul className="space-y-3">
              {recalls.data.map((r) => (
                <li key={r.campaignNumber} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {(r.parkIt || r.parkOutside) && (
                      <span className="rounded-md bg-sign-red px-2 py-0.5 text-sm font-bold text-white">{r.parkIt ? 'Do not drive' : 'Park outside'}</span>
                    )}
                    <span className="font-bold">{formatComponent(r.component)}</span>
                  </div>
                  <p className="mt-2 text-[0.9375rem]">{r.summary}</p>
                  {r.consequence && (
                    <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">
                      <strong className="text-foreground">Risk:</strong> {r.consequence}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Campaign {r.campaignNumber}, reported {formatDate(r.reportDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="vin-ratings" className="scroll-mt-24">
          <PanelTitle>Crash-test ratings</PanelTitle>
          <p className="mt-1 text-[0.9375rem] text-muted-foreground">NHTSA 5-Star Safety Ratings for this model year.</p>
          <div className="mt-4">
            {!ratings.data && !ratings.failed && <Spinner label="Loading crash ratings…" />}
            {(ratings.failed || ratings.data?.length === 0) && <p>NHTSA hasn't published crash ratings for this model year.</p>}
            {ratings.data?.map((r) => (
              <div key={r.description} className="border-t border-border py-3 first:border-t-0 first:pt-0">
                <h3 className="font-bold">{r.description}</h3>
                <dl className="mt-2 grid gap-1.5">
                  {[
                    ['Overall', r.overall],
                    ['Frontal crash', r.frontal],
                    ['Side crash', r.side],
                    ['Rollover', r.rollover],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 text-[0.9375rem]">
                      <dt>{label}</dt>
                      <dd>
                        <Stars rating={value} label={label} />
                      </dd>
                    </div>
                  ))}
                </dl>
                {r.rolloverRisk != null && (
                  <p className="mt-2 text-sm text-muted-foreground">Rollover risk in a single-vehicle crash: {(r.rolloverRisk * 100).toFixed(1)}%</p>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Panel id="vin-fuel" className="scroll-mt-24">
          <PanelTitle>Fuel economy</PanelTitle>
          <p className="mt-1 text-[0.9375rem] text-muted-foreground">Official EPA ratings for this engine.</p>
          <div className="mt-4">
            {canLookUp && !fuel.loaded && <Spinner label="Loading EPA ratings…" />}
            {(!canLookUp || (fuel.loaded && !fuel.data)) && <p>The EPA has no rating listed for this vehicle.</p>}
            {fuel.data && (
              <>
                <dl className="grid grid-cols-3 gap-4">
                  {[
                    ['City', fuel.data.rating.city],
                    ['Highway', fuel.data.rating.hwy],
                    ['Combined', fuel.data.rating.combined],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="font-heading text-3xl font-extrabold">
                        {value} <span className="text-base font-semibold text-muted-foreground">MPG</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm text-muted-foreground">EPA version: {fuel.data.description}</p>
              </>
            )}
          </div>
        </Panel>
      </div>

      <Panel id="vin-complaints" className="scroll-mt-24">
        <PanelTitle>What owners report to NHTSA</PanelTitle>
        <div className="mt-4">
          {!complaints.data && !complaints.failed && <Spinner label="Loading owner complaints…" />}
          {complaints.failed && <p>NHTSA's complaint records could not be loaded right now.</p>}
          {complaints.data && complaints.data.total === 0 && <p>NHTSA has no owner complaints on record for this model year.</p>}
          {complaints.data && complaints.data.total > 0 && (
            <>
              <p className="text-[0.9375rem]">
                <strong>{complaints.data.total.toLocaleString('en-US')}</strong> complaints
                {complaints.data.crashes > 0 && `, ${complaints.data.crashes} involving a crash`}
                {complaints.data.fires > 0 && `, ${complaints.data.fires} involving a fire`}.
              </p>
              <ul className="mt-4 space-y-1.5">
                {complaints.data.byComponent.slice(0, 6).map((c) => (
                  <li key={c.component} className="grid grid-cols-[minmax(0,12rem)_1fr_3rem] items-center gap-3 text-[0.9375rem]">
                    <span className="truncate">{c.label}</span>
                    <span className="h-2.5 rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-sign-blue" style={{ width: `${Math.max((c.count / complaints.data!.byComponent[0].count) * 100, 3)}%` }} />
                    </span>
                    <span className="text-right tabular-nums">{c.count}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-5 font-bold">Latest owner reports</h3>
              <ul className="mt-2 space-y-3">
                {complaints.data.complaints.slice(0, 3).map((c) => (
                  <li key={c.id} className="border-l-2 border-border pl-3 text-[0.9375rem]">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(c.date)}, {c.components.map((x) => x.toLowerCase()).join(', ')}
                    </p>
                    <p className="mt-0.5 line-clamp-3">{c.summary}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}

function InsuranceQuoteForm({ vin, vehicle }: { vin: string; vehicle: string }) {
  const [data, setData] = useState({ zip: '', name: '', email: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await saveLead('VIN_lookup_leads.json', {
        timestamp: new Date().toISOString(),
        name: data.name,
        phone: data.phone,
        email: data.email,
        zip: data.zip,
        car_model: vehicle,
        vin,
      });
      setSent(true);
    } catch (err) {
      console.error('Lead submission failed', err);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Notice tone="success" title="Request sent">
        An insurance partner will contact you with quotes for the {vehicle}.
      </Notice>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="ZIP code" htmlFor="ins-zip">
        <input id="ins-zip" required inputMode="numeric" pattern="\d{5}" maxLength={5} value={data.zip} onChange={(e) => setData({ ...data, zip: e.target.value.replace(/\D/g, '') })} className={inputClass} />
      </Field>
      <Field label="Full name" htmlFor="ins-name">
        <input id="ins-name" required autoComplete="name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Email" htmlFor="ins-email">
        <input id="ins-email" required type="email" autoComplete="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Phone" htmlFor="ins-phone">
        <input id="ins-phone" required type="tel" autoComplete="tel" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className={inputClass} />
      </Field>
      <div className="sm:col-span-2">
        <PrimaryButton type="submit" loading={sending}>
          Get insurance quotes
        </PrimaryButton>
        <p className="mt-2 text-sm text-muted-foreground">We share these details only with the insurance partner who sends your quotes.</p>
      </div>
    </form>
  );
}

const FAQS = [
  ['Where can I find my VIN?', "On the driver's side of the dashboard (look through the windshield), on the sticker in the driver's door jamb, and on your registration and insurance card."],
  ['What does this report include?', 'Factory specs and safety equipment from NHTSA’s VIN decoder, safety recalls, owner complaints and 5-Star crash ratings from NHTSA, and EPA fuel economy. All of it is free public data.'],
  ['Does it show accidents or title problems?', 'No. Accident, title, odometer and ownership history comes from paid history reports. Use the history report link above for those.'],
  ['Does a listed recall mean this car still needs the repair?', 'Not necessarily. The report lists recalls for the model. To see whether this exact car’s recall was already fixed, enter its VIN at nhtsa.gov/recalls or ask a dealer.'],
  ['Which vehicles work?', 'Any 17-character VIN, which covers vehicles built since 1981: cars, SUVs, trucks, motorcycles and more. Recalls, ratings and fuel economy depend on what NHTSA and the EPA have published for that model.'],
];

const VinLookup: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<{ vin: string; data: DecodedVin } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const check = checkVin(input);
  const live =
    input.length === 0
      ? null
      : check.problem === 'characters'
        ? 'VINs never use the letters I, O or Q.'
        : check.problem === 'length'
          ? `${check.vin.length} of 17 characters`
          : check.problem === 'check-digit'
            ? "17 characters, but the check digit doesn't match. Double-check for typos."
            : 'Valid VIN format';

  const vinParam = params.get('vin') ?? '';
  useEffect(() => {
    const { vin, problem } = checkVin(vinParam);
    if (!vin || problem === 'length' || problem === 'characters') return;
    setInput(vin);
    let current = true;
    setLoading(true);
    setError(null);
    decodeVin(vin)
      .then((data) => {
        if (!current) return;
        if (!data.fields.Make) setError("NHTSA couldn't decode this VIN. Check it against the VIN on the car.");
        else {
          setDecoded({ vin, data });
          requestAnimationFrame(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
      })
      .catch(() => current && setError("NHTSA's VIN decoder didn't respond. Please try again."))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [vinParam]);

  const submit = (vin: string) => {
    const result = checkVin(vin);
    if (result.problem === 'length' || result.problem === 'characters') {
      setError(result.problem === 'length' ? 'A VIN has exactly 17 characters.' : 'VINs never use the letters I, O or Q.');
      return;
    }
    setError(null);
    setParams({ vin: result.vin });
  };

  const vehicleName = decoded ? [decoded.data.fields.ModelYear, titleCase(decoded.data.fields.Make ?? ''), decoded.data.fields.Model].filter(Boolean).join(' ') : '';

  return (
    <ToolPage
      category="warnings"
      title="VIN decoder and vehicle report"
      intro="Enter a 17-character VIN to get the car's factory specs, safety recalls, owner complaints, crash-test ratings and fuel economy in one free report."
      sources="NHTSA VIN decoder (vPIC), NHTSA recalls, complaints and 5-Star Safety Ratings, EPA fueleconomy.gov"
    >
      <Panel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <Field label="VIN" htmlFor="vin" hint="Find it at the bottom of the windshield on the driver's side, or on the driver's door jamb.">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="vin"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17))}
                placeholder="1HGCM82633A004352"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-describedby="vin-status"
                className={cn(inputClass, 'h-14 font-mono text-xl font-semibold tracking-[0.08em]')}
              />
              <PrimaryButton type="submit" loading={loading} className="h-14 px-6 text-lg">
                Get report
              </PrimaryButton>
            </div>
          </Field>
          <p id="vin-status" aria-live="polite" className={cn('mt-2 text-[0.9375rem] font-semibold', check.problem && input ? 'text-muted-foreground' : 'text-sign-green')}>
            {live}
          </p>
          {!decoded && (
            <button
              type="button"
              onClick={() => {
                setInput(EXAMPLE_VIN);
                submit(EXAMPLE_VIN);
              }}
              className={cn('mt-2 cursor-pointer rounded-sm text-[0.9375rem] font-semibold underline underline-offset-4', focusRing)}
            >
              Try an example VIN
            </button>
          )}
        </form>
        {error && (
          <Notice tone="error" className="mt-4">
            {error}
          </Notice>
        )}
      </Panel>

      <div ref={reportRef} className="scroll-mt-24">
        {decoded && <Report vin={decoded.vin} decoded={decoded.data} />}
      </div>

      {decoded && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelTitle>Accidents, title and odometer history</PanelTitle>
            <p className="mt-2 text-[0.9375rem] text-muted-foreground">
              This report covers factory data and NHTSA records. Accidents, title brands, odometer readings and previous owners come
              from a paid vehicle history report.
            </p>
            <a
              href="https://goodcar.com/vehicle-history"
              target="_blank"
              rel="noopener noreferrer"
              className={cn('mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-sign-blue px-5 font-bold text-white hover:opacity-90', focusRing)}
            >
              Get a history report from GoodCar <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </Panel>
          <Panel>
            <PanelTitle>Insurance quotes for this {decoded.data.fields.Model}</PanelTitle>
            <p className="mt-2 mb-4 text-[0.9375rem] text-muted-foreground">Compare rates for the {vehicleName} before you buy.</p>
            <InsuranceQuoteForm vin={decoded.vin} vehicle={vehicleName} />
          </Panel>
        </div>
      )}

      <section className="mt-16 max-w-3xl" aria-labelledby="vin-faq">
        <h2 id="vin-faq" className="font-heading text-2xl font-extrabold">
          Questions about VIN reports
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

export default VinLookup;
