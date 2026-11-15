import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { REPAIR_SERVICES, searchShops, type ShopSearch } from '../utils/places';
import { Faq, Field, Panel, PanelTitle, PrimaryButton, Spinner, ToolPage, focusRing, inputClass, rememberZip, rememberedZip } from './tool/kit';
import ShopResults from './tool/ShopResults';

type ServiceId = (typeof REPAIR_SERVICES)[number]['id'];
const isService = (v: string | null): v is ServiceId => REPAIR_SERVICES.some((s) => s.id === v);

const BEFORE_YOU_BOOK: [string, string][] = [
  ['Ask for a written estimate', 'Parts, labor hours and the hourly rate on paper before any work starts. In most states the shop needs your OK to go over it.'],
  ['Ask what the diagnosis costs', 'Typical check engine diagnosis runs $100 to $200. Many shops take it off the repair bill if you let them fix it.'],
  ['Ask about the warranty', 'Good shops cover parts and labor for at least 12 months or 12,000 miles, many for 24 or 36 months.'],
  ['Look for ASE-certified techs', 'ASE certification means the technicians passed national exams for the work they do.'],
  ['Ask which parts they use', 'OEM, or quality aftermarket? Both can be fine. Ask for your old parts back if you want proof they were replaced.'],
];

const FAQS: [string, string][] = [
  [
    'Where do the shops and ratings come from?',
    'From Google: each shop shows its Google rating, how many people reviewed it, whether it is open right now and its phone number. We do not take payment from shops and nothing is sponsored.',
  ],
  [
    'What does "Top rated" do?',
    'It ranks by rating weighted by how many reviews a shop has, so a 4.9 from 8 reviews does not beat a 4.7 from 600. A handful of reviews can come from friends and family; hundreds are much harder to fake.',
  ],
  [
    'Dealer or independent shop?',
    'Independent shops usually charge 20 to 35% less per hour than dealers. A dealer is worth it for warranty and recall work (free to you), software updates and some brand-specific electrical problems.',
  ],
  [
    'How do I know if a quote is fair?',
    'Use the repair quote checker: it compares each line with book labor time and typical parts prices for your car and area, and gives you what to say to the shop.',
  ],
];

export default function MechanicFinder() {
  const [params, setParams] = useSearchParams();
  const [service, setService] = useState<ServiceId>('general');
  const [zip, setZip] = useState('');
  const [zipError, setZipError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ search: ShopSearch; zip: string; service: ServiceId } | null>(null);
  const latest = useRef(0);

  const run = async (z: string, s: ServiceId) => {
    if (!/^\d{5}$/.test(z)) {
      setZipError('Enter a 5-digit US ZIP code.');
      return;
    }
    setZipError(null);
    rememberZip(z);
    setParams({ service: s, zip: z }, { replace: true });
    const id = ++latest.current;
    setLoading(true);
    const search = await searchShops(z, s);
    if (id !== latest.current) return;
    setResult({ search, zip: z, service: s });
    setLoading(false);
  };

  // Links can preset the service (?service=brakes) and search straight away (?zip=78701).
  // Otherwise the ZIP used on other tools is filled in. Read after hydration so the
  // prerendered page and the first client render match.
  useEffect(() => {
    const s = params.get('service');
    const linkedService = isService(s) ? s : 'general';
    setService(linkedService);
    const linkedZip = params.get('zip')?.replace(/\D/g, '').slice(0, 5) ?? '';
    if (/^\d{5}$/.test(linkedZip)) {
      setZip(linkedZip);
      run(linkedZip, linkedService);
    } else {
      setZip(rememberedZip());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serviceLabel = (id: ServiceId) => REPAIR_SERVICES.find((s) => s.id === id)!.label;
  const what = (id: ServiceId) => (id === 'general' ? 'repair shops' : `shops for ${serviceLabel(id).toLowerCase()}`);

  return (
    <ToolPage
      category="services"
      title="Find a mechanic near you"
      intro="Pick the repair you need and enter your ZIP code. You'll see nearby shops with their Google rating, how many reviews it's based on, whether they're open now and their phone number."
      sources="Google Places (listings, ratings and hours)."
    >
      <Panel className="max-w-3xl">
        <form
          noValidate
          className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            run(zip, service);
          }}
        >
          <Field label="What do you need?" htmlFor="mechanic-service">
            <select id="mechanic-service" value={service} onChange={(e) => setService(e.target.value as ServiceId)} className={inputClass}>
              {REPAIR_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ZIP code" htmlFor="mechanic-zip">
            <input
              id="mechanic-zip"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="e.g. 78701"
              aria-invalid={zipError ? true : undefined}
              aria-describedby={zipError ? 'mechanic-zip-error' : undefined}
              className={inputClass}
            />
          </Field>
          <PrimaryButton type="submit" loading={loading}>
            Find shops
          </PrimaryButton>
        </form>
        {zipError && (
          <p id="mechanic-zip-error" role="alert" className="mt-3 text-[0.9375rem] font-semibold text-sign-red dark:text-red-300">
            {zipError}
          </p>
        )}
      </Panel>

      <section aria-labelledby="shops-title" className="mt-8" aria-busy={loading}>
        <h2 id="shops-title" className="sr-only">
          Shops
        </h2>
        {loading && !result && <Spinner label="Finding shops…" />}
        {result && (
          <div className={cn(loading && 'opacity-60')}>
            <ShopResults result={result.search} what={what(result.service)} zip={result.zip} />
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel aria-labelledby="book-title">
          <PanelTitle>
            <span id="book-title">Before you book</span>
          </PanelTitle>
          <ul className="mt-4 space-y-3">
            {BEFORE_YOU_BOOK.map(([title, text]) => (
              <li key={title} className="text-[0.9375rem] leading-relaxed">
                <strong>{title}.</strong> <span className="text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel aria-labelledby="price-title">
          <PanelTitle>
            <span id="price-title">Know the price first</span>
          </PanelTitle>
          <ul className="mt-4 space-y-3 text-[0.9375rem]">
            <li>
              <Link to="/fault-code-decoder" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                Look up a check engine code
              </Link>
              <span className="block text-muted-foreground">Likely causes and typical repair costs before you walk in.</span>
            </li>
            <li>
              <Link to="/maintenance-validator" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                Check a repair quote
              </Link>
              <span className="block text-muted-foreground">Line-by-line fair prices for your car and ZIP code.</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Faq id="mechanic-faq" title="Questions about finding a mechanic" items={FAQS} />
    </ToolPage>
  );
}
