import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { STATES } from '../utils/insurance';
import { COUPON_SOURCES, SERVICES, SHOP_TYPES, servicePrice, type ShopType } from '../utils/servicePrices';
import { Faq, Field, Panel, PanelTitle, ToolPage, focusRing, inputClass, money, moneyRange } from './tool/kit';
import LeadPanel from './tool/LeadPanel';

const SEASONS: [string, string][] = [
  ['Tires', 'Manufacturer rebates (often $70 to $150 on a set of four) cluster in spring and fall and around Memorial Day, Labor Day and Black Friday.'],
  ['Batteries', 'Cold kills weak batteries. Get a free test in early fall and buy before the first freeze, when shops run battery promotions.'],
  ['A/C service', 'Shops discount A/C checks in early spring, before the summer rush.'],
  ['Oil changes', 'Chains post new coupons on their websites almost every month; sign up for their email list for the best ones.'],
];

const FAQS: [string, string][] = [
  [
    'Where do these prices come from?',
    'They are typical 2026 US prices for each service at a quick lube or chain shop, adjusted for your state’s shop labor costs and the type of shop. Use them to spot a quote that is far out of line; a specific car can cost more (European brands, trucks, AWD).',
  ],
  [
    'Are dealers always more expensive?',
    'For routine service, usually 20 to 40% more. But dealers sometimes match chain prices on oil changes and tires, and warranty and recall work at a dealer costs you nothing.',
  ],
  [
    'Does using an independent shop void my warranty?',
    "No. US federal law (the Magnuson-Moss Warranty Act) lets you service your car anywhere, or yourself, without voiding the warranty. Keep receipts and use parts and fluids that meet the manual's specifications.",
  ],
  [
    'How do I avoid upsells?',
    'Bring your owner’s manual schedule, ask to see worn parts and measurements (pad thickness, tire tread depth, battery test printout), and say "not today" to anything you didn’t come in for. A good shop will still show you what’s due soon.',
  ],
];

export default function ServiceDeals() {
  const [state, setState] = useState('');
  const [shop, setShop] = useState<ShopType>('independent');
  const [picked, setPicked] = useState<string[]>(['oil-synthetic', 'rotation']);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const chosen = SERVICES.filter((s) => picked.includes(s.id));
  const sum = (t: ShopType) => chosen.reduce<[number, number]>((acc, s) => {
    const [lo, hi] = servicePrice(s, t, state);
    return [acc[0] + lo, acc[1] + hi];
  }, [0, 0]);
  const total = sum(shop);
  const dealer = sum('dealer');
  const independent = sum('independent');

  return (
    <ToolPage
      category="services"
      title="Car service prices and deals"
      intro="Fair prices for oil changes, brakes, batteries and other routine service in your state, the upsells to say no to, and where to find real coupons."
      sources="Typical 2026 US shop prices, adjusted for state labor costs and shop type."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div className="space-y-6">
          <Panel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="State" htmlFor="deal-state">
                <select id="deal-state" value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                  <option value="">US average</option>
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-[0.9375rem] font-semibold">Shop</legend>
                <div className="flex flex-wrap gap-2">
                  {SHOP_TYPES.map((t) => (
                    <label
                      key={t.id}
                      className={cn(
                        'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
                        shop === t.id ? 'border-foreground bg-foreground text-background' : 'border-input hover:bg-muted',
                      )}
                    >
                      <input type="radio" name="shop" value={t.id} checked={shop === t.id} onChange={() => setShop(t.id)} className="sr-only" />
                      {t.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Panel>

          <Panel aria-labelledby="services-title">
            <PanelTitle>
              <span id="services-title">Pick the services you need</span>
            </PanelTitle>
            <ul className="mt-3 divide-y divide-border">
              {SERVICES.map((s) => {
                const [lo, hi] = servicePrice(s, shop, state);
                const on = picked.includes(s.id);
                return (
                  <li key={s.id} className="py-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="mt-1 size-4 shrink-0 accent-sign-green" />
                      <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4">
                        <span className="font-semibold">{s.name}</span>
                        <span className="font-semibold tabular-nums">{moneyRange(lo, hi)}</span>
                      </span>
                    </label>
                    {on && (
                      <div className="mt-2 ml-7 space-y-1.5 text-[0.9375rem]">
                        <p>
                          <strong>Pay less:</strong> <span className="text-muted-foreground">{s.how}</span>
                        </p>
                        <p>
                          <strong>Say no to:</strong> <span className="text-muted-foreground">{s.skip}</span>
                        </p>
                        {s.diy && (
                          <p>
                            <strong>Parts to do it yourself:</strong> <span className="text-muted-foreground">{moneyRange(s.diy[0], s.diy[1])}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel aria-labelledby="total-title" aria-live="polite">
            <PanelTitle>
              <span id="total-title">Fair price for your list</span>
            </PanelTitle>
            {chosen.length === 0 ? (
              <p className="mt-2 text-muted-foreground">Tick the services you need.</p>
            ) : (
              <>
                <p className="mt-2 font-heading text-4xl font-extrabold tracking-[-0.02em]">{moneyRange(total[0], total[1])}</p>
                <p className="text-[0.9375rem] text-muted-foreground">
                  {chosen.length} {chosen.length === 1 ? 'service' : 'services'} at {SHOP_TYPES.find((t) => t.id === shop)!.label.toLowerCase()}
                  {state ? ` in ${STATES.find((s) => s.code === state)!.name}` : ''}
                </p>
                <dl className="mt-4 divide-y divide-border text-[0.9375rem]">
                  <div className="flex justify-between gap-4 py-2">
                    <dt className="text-muted-foreground">Independent shop</dt>
                    <dd className="font-semibold">{moneyRange(independent[0], independent[1])}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <dt className="text-muted-foreground">Dealer</dt>
                    <dd className="font-semibold">{moneyRange(dealer[0], dealer[1])}</dd>
                  </div>
                </dl>
                {shop === 'dealer' && dealer[1] - independent[1] >= 20 && (
                  <p className="mt-3 text-[0.9375rem]">
                    An independent shop would likely save you about <strong>{money(Math.round(((dealer[0] + dealer[1]) - (independent[0] + independent[1])) / 2))}</strong>, and servicing outside the dealer
                    doesn't void your warranty.
                  </p>
                )}
                <p className="mt-4 text-[0.9375rem]">
                  Already have a quote?{' '}
                  <Link to="/maintenance-validator" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                    Check it line by line
                  </Link>
                </p>
              </>
            )}
          </Panel>

          <Panel aria-labelledby="coupons-title">
            <PanelTitle>
              <span id="coupons-title">Where real coupons are</span>
            </PanelTitle>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">Chains publish current coupons on their own sites. Your dealer's "service specials" page often has some too.</p>
            <ul className="mt-3 space-y-2 text-[0.9375rem]">
              {COUPON_SOURCES.map((c) => (
                <li key={c.name}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
                    {c.name}
                  </a>{' '}
                  <span className="text-muted-foreground">· {c.for}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel aria-labelledby="season-title" className="mt-6">
        <PanelTitle>
          <span id="season-title">Best time of year to buy</span>
        </PanelTitle>
        <ul className="mt-3 grid gap-x-8 gap-y-3 md:grid-cols-2">
          {SEASONS.map(([t, d]) => (
            <li key={t} className="text-[0.9375rem] leading-relaxed">
              <strong>{t}.</strong> <span className="text-muted-foreground">{d}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <LeadPanel
        id="deal-lead"
        className="mt-6"
        title="Get local service deals"
        intro="Leave your details and we'll send you service deals from shops near you for the services you picked."
        cta="Send me deals"
        sentText="Thanks. We'll send you local deals for these services."
        sheet="digital_coupon_leads.json"
        source="Service_Deals"
        details={() => ({ state, shopType: shop, services: chosen.map((s) => s.name).join(', ') })}
      />

      <Faq id="deals-faq" title="Questions about service prices" items={FAQS} />
    </ToolPage>
  );
}
