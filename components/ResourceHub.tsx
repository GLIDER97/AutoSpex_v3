import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VEHICLES, vehicleName, vehiclePath } from '../data/vehicles';
import { runTool } from '../utils/ai';
import { latestFeaturedRecalls, searchRecalls, type Recall } from '../utils/nhtsaRecalls';
import {
  Faq,
  Notice,
  Panel,
  PrimaryButton,
  Spinner,
  ToolPage,
  VehicleFields,
  Verdict,
  focusRing,
  hasVehicle,
  type Vehicle,
} from './tool/kit';

interface ResourceHubProps {
  type: 'recalls' | 'coupons';
}


interface Promo {
  offer: string;
  savingValue: string;
  shop: string;
  validIn: string;
}

const formatReportDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

const RECALL_FAQS: [string, React.ReactNode][] = [
  [
    'Are recall repairs free?',
    "Yes. By federal law, the manufacturer's dealers fix safety recalls for free, even if the car is out of warranty or you bought it used. Call any franchised dealer for your brand to book it.",
  ],
  [
    'How do I know if my exact car has an open recall?',
    "A search by year, make and model shows every recall for that model, but not every car is affected. Enter your 17-character VIN on NHTSA's recall lookup to see open recalls for your exact car.",
  ],
  [
    'What do "Do not drive" and "Park outside" mean?',
    "They're NHTSA's most urgent advisories. Do not drive means the car shouldn't be driven until it's fixed. Park outside means a fire risk: keep it away from buildings until it's repaired.",
  ],
  [
    'Where do these recalls come from?',
    "Straight from NHTSA's public recalls database, the U.S. government's official record, loaded when you search.",
  ],
];

const COUPON_FAQS: [string, React.ReactNode][] = [
  [
    'Are these real coupons?',
    "No. They're kinds of promotions that national chains commonly advertise, summarized by AI. Offers, prices and terms change and vary by location, so check the chain's website or call the shop before you go.",
  ],
  [
    'How do I get the best price on routine service?',
    'Call two or three shops with the same request, ask whether a current promotion applies, and check the manufacturer\'s own service coupons at your dealer. Independent shops often match chain prices.',
  ],
];

const ResourceHub: React.FC<ResourceHubProps> = ({ type }) => {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [searched, setSearched] = useState<Vehicle | null>(null);
  // Only the latest request may update the page.
  const latest = useRef(0);

  const load = async (query?: Vehicle) => {
    const id = ++latest.current;
    const current = () => id === latest.current;
    setLoading(true);
    setError(null);
    try {
      if (type === 'recalls') {
        if (!query) {
          const list = await latestFeaturedRecalls();
          if (!current()) return;
          setRecalls(list);
          setNote('Latest NHTSA recalls on best-selling vehicles. Enter your year, make and model to check yours.');
        } else {
          const result = await searchRecalls(Number(query.year), query.make.trim(), query.model.trim());
          if (!current()) return;
          setRecalls(result.recalls);
          if (!result.recalls.length) {
            setNote(
              `NHTSA has no recalls on record for a ${query.year} ${result.make ?? query.make} ${query.model}. If that looks wrong, try the model name as NHTSA lists it (for example CR-V, F-150 or C-Class).`,
            );
          } else {
            const [first, ...others] = result.models;
            const models = others.length ? `${first} (and ${others.length} related model${others.length === 1 ? '' : 's'})` : first;
            setNote(`${result.recalls.length} NHTSA recall${result.recalls.length === 1 ? '' : 's'} for the ${query.year} ${result.make} ${models}, newest first.`);
          }
        }
      } else {
        // The prompt is written on the server (api/_aiTools.ts, "coupons").
        const response = await runTool('coupons');
        if (!current()) return;
        setPromos(JSON.parse(response.text || '{}').items ?? []);
      }
    } catch {
      if (!current()) return;
      setError(
        type === 'recalls'
          ? "We couldn't reach the NHTSA recalls database. Please try again in a moment."
          : "The promotions couldn't be loaded right now. Please try again in a moment.",
      );
    } finally {
      if (current()) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasVehicle(vehicle)) return;
    setSearched(vehicle);
    load(vehicle);
  };

  const retry = () => load(searched ?? undefined);

  if (type === 'coupons') {
    return (
      <ToolPage
        category="services"
        title="Service coupons"
        intro="Typical promotions national chains advertise on oil changes, brakes, tires and batteries, so you know what to ask for."
        sources="Summarized by AI (Anthropic's Claude) from common national promotions. Not coupons: confirm current offers with the shop."
      >
        {loading ? (
          <Spinner label="Loading typical promotions…" />
        ) : error ? (
          <Notice tone="error" title="Couldn't load promotions">
            {error}{' '}
            <button type="button" onClick={retry} className={cn('cursor-pointer font-semibold underline underline-offset-4', focusRing)}>
              Try again
            </button>
          </Notice>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((p, i) => (
              <li key={i} className="flex flex-col rounded-xl border border-border bg-card p-5">
                <p className="font-heading text-3xl font-extrabold text-sign-green">{p.savingValue}</p>
                <h2 className="mt-1 text-lg font-bold leading-snug">{p.offer}</h2>
                <p className="mt-2 flex-1 text-[0.9375rem] text-muted-foreground">
                  Often offered by {p.shop}. {p.validIn}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Panel className="mt-6">
          <h2 className="font-heading text-xl font-extrabold">Ask local shops too</h2>
          <p className="mt-1 text-[0.9375rem] text-muted-foreground">
            Independent shops often beat chain prices and will tell you about their own specials over the phone.
          </p>
          <Link
            to="/mechanic-finder"
            className={cn('mt-4 inline-flex h-11 items-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong', focusRing)}
          >
            Find shops near you
          </Link>
        </Panel>

        <Faq id="coupon-faq" title="Questions about service deals" items={COUPON_FAQS} />
      </ToolPage>
    );
  }

  return (
    <ToolPage
      category="warnings"
      title="Recall check"
      intro="Safety recalls for your year, make and model, with the risk and the free fix for each."
      sources="NHTSA recalls database (nhtsa.gov), loaded live."
    >
      <Panel className="mb-6 max-w-3xl">
        <form onSubmit={search} className="space-y-4">
          <VehicleFields value={vehicle} onChange={setVehicle} minYear={1966} required />
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton type="submit" loading={loading && Boolean(searched)}>
              Check recalls
            </PrimaryButton>
            <Link to="/vin-lookup" className={cn('font-semibold underline underline-offset-4', focusRing)}>
              Have a VIN? Get the full VIN report
            </Link>
          </div>
        </form>
      </Panel>

      {loading ? (
        <Spinner label="Loading recalls from NHTSA…" />
      ) : error ? (
        <Notice tone="error" title="Couldn't reach NHTSA">
          {error}{' '}
          <button type="button" onClick={retry} className={cn('cursor-pointer font-semibold underline underline-offset-4', focusRing)}>
            Try again
          </button>
        </Notice>
      ) : (
        <>
          <p className="mb-4 text-[0.9375rem] text-muted-foreground" aria-live="polite">
            {note}
          </p>
          <ul className="grid gap-4 lg:grid-cols-2">
            {recalls.map((r) => (
              <li key={`${r.campaignNumber}-${r.model}-${r.modelYear}`} className="flex flex-col rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Verdict tone={r.parkIt || r.parkOutside ? 'stop' : 'caution'}>
                    {r.parkIt ? 'Do not drive' : r.parkOutside ? 'Park outside' : 'Safety recall'}
                  </Verdict>
                  <span className="text-sm text-muted-foreground">
                    Campaign {r.campaignNumber}
                    {r.reportDate && ` · ${formatReportDate(r.reportDate)}`}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold leading-snug">
                  {r.modelYear} {r.make} {r.model}
                </h2>
                <p className="text-sm font-semibold text-muted-foreground">{r.component.replace(/:/g, ' › ')}</p>
                <div className="mt-3 flex-1 space-y-2 text-[0.9375rem]">
                  <p className="line-clamp-5">{r.summary}</p>
                  {r.consequence && (
                    <p>
                      <strong>Risk:</strong> {r.consequence}
                    </p>
                  )}
                  {r.remedy && (
                    <p className="line-clamp-3">
                      <strong>Fix:</strong> {r.remedy}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Notice tone="info" title="Check your exact car" className="mt-6 max-w-3xl">
        Not every car of a model is affected. Enter your VIN on NHTSA's recall lookup to see open recalls for your car. Recall repairs are
        free at any franchised dealer for your brand.{' '}
        <a href="https://www.nhtsa.gov/recalls" target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1 font-semibold underline underline-offset-4', focusRing)}>
          NHTSA recall lookup <ExternalLink className="size-3.5" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </Notice>

      {type === 'recalls' && VEHICLES.length > 0 && (
        <section aria-labelledby="vehicle-reports" className="mt-10 max-w-3xl">
          <h2 id="vehicle-reports" className="font-heading text-2xl font-extrabold">
            Vehicle reports
          </h2>
          <p className="mt-2 text-muted-foreground">
            Owner complaints, every recall, crash ratings and fuel economy for one model-year, counted from NHTSA and EPA data.
          </p>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {VEHICLES.map((v) => (
              <li key={vehiclePath(v)} className="py-3">
                <Link to={vehiclePath(v)} className={cn('font-semibold underline underline-offset-4', focusRing)}>
                  {vehicleName(v)}
                </Link>
                <span className="text-muted-foreground">
                  {' '}
                  · {v.complaints.total.toLocaleString('en-US')} complaints, {v.recalls.length} recall{v.recalls.length === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Faq id="recall-faq" title="Questions about recalls" items={RECALL_FAQS} />
    </ToolPage>
  );
};

export default ResourceHub;
