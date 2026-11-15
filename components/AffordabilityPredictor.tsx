import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { saveLead } from '../utils/leadStorage';
import { generateContent, Type } from '../utils/ai';
import {
  CREDIT_TIERS,
  amortizationByYear,
  amountFinanced,
  maxLoanForPayment,
  maxPriceForLoan,
  monthlyPayment,
  salesTax,
  type CreditTierId,
} from '../utils/carMath';
import { StackedColumns } from './tool/charts';
import {
  Field,
  FactList,
  Notice,
  NumberField,
  Panel,
  PanelTitle,
  PrimaryButton,
  SecondaryButton,
  ToolPage,
  Verdict,
  VehicleFields,
  focusRing,
  hasVehicle,
  inputClass,
  money,
  moneyRange,
  vehicleLabel,
  type Vehicle,
} from './tool/kit';

const TERMS = [36, 48, 60, 72, 84];
// Guidelines: car payment at most 10% of gross income (15% is a stretch);
// all debt payments at most 36% (most lenders cap around 43%).
const RULES = { payment: { ok: 0.1, max: 0.15 }, dti: { ok: 0.36, max: 0.43 } };

const n = (v: string) => Math.max(0, Number(v) || 0);
const pct = (v: number) => `${Math.round(v * 100)}%`;

function RuleBar({ label, value, ok, max, note }: { label: string; value: number; ok: number; max: number; note: string }) {
  const scale = Math.max(max * 1.4, value * 1.05);
  const tone = value <= ok ? 'bg-sign-green' : value <= max ? 'bg-sign-yellow' : 'bg-sign-red';
  return (
    <div>
      <div className="flex justify-between gap-4 text-[0.9375rem]">
        <span className="font-semibold">{label}</span>
        <span className="font-bold tabular-nums">{pct(value)}</span>
      </div>
      <div className="relative mt-1.5 h-2.5 rounded-full bg-muted" aria-hidden="true">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${Math.min(100, (value / scale) * 100)}%` }} />
        <div className="absolute -top-1 h-4.5 w-0.5 bg-foreground/70" style={{ left: `${(ok / scale) * 100}%` }} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

async function estimatePrice(vehicle: string, trim: string, zip: string) {
  const response = await generateContent({
    model: 'text',
    contents: `Estimate today's typical US dealer retail price for a used ${vehicle} ${trim} in average condition with typical mileage${zip ? `, near ZIP ${zip}` : ''}. If it is a current model year, estimate the typical transaction price. Return USD numbers and one sentence on what moves the price most.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: { priceLow: { type: Type.NUMBER }, priceHigh: { type: Type.NUMBER }, fairPrice: { type: Type.NUMBER }, note: { type: Type.STRING } },
        required: ['priceLow', 'priceHigh', 'fairPrice', 'note'],
      },
    },
  });
  const raw = JSON.parse(response.text ?? '{}');
  const low = Math.max(0, Number(raw.priceLow) || 0);
  const high = Math.max(low, Number(raw.priceHigh) || 0);
  const fair = Math.min(high, Math.max(low, Number(raw.fairPrice) || 0));
  if (!fair) throw new Error('No estimate');
  return { low, high, fair, note: String(raw.note ?? '').slice(0, 300) };
}

const AffordabilityPredictor: React.FC = () => {
  const [mode, setMode] = useState<'check' | 'budget'>('check');
  const [price, setPrice] = useState('32000');
  const [condition, setCondition] = useState<'new' | 'used'>('used');
  const [income, setIncome] = useState('6000');
  const [debts, setDebts] = useState('1500');
  const [tier, setTier] = useState<CreditTierId>('good');
  const [apr, setApr] = useState(String(CREDIT_TIERS[1].usedApr));
  const [aprEdited, setAprEdited] = useState(false);
  const [term, setTerm] = useState(60);
  const [down, setDown] = useState('4000');
  const [tradeIn, setTradeIn] = useState('0');
  const [tax, setTax] = useState('6');
  const [fees, setFees] = useState('800');

  const [showEstimator, setShowEstimator] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [trim, setTrim] = useState('');
  const [zip, setZip] = useState('');
  const [estimate, setEstimate] = useState<{ low: number; high: number; fair: number; note: string } | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const [lead, setLead] = useState({ name: '', email: '', phone: '' });
  const [leadSending, setLeadSending] = useState(false);
  const [leadSent, setLeadSent] = useState(false);

  const setTierAndApr = (id: CreditTierId, cond = condition) => {
    setTier(id);
    const t = CREDIT_TIERS.find((x) => x.id === id)!;
    if (!aprEdited) setApr(String(cond === 'new' ? t.newApr : t.usedApr));
  };

  const costs = { price: n(price), taxRate: n(tax) / 100, fees: n(fees), downPayment: n(down), tradeIn: n(tradeIn) };
  const rate = n(apr);
  const monthlyIncome = n(income);
  const otherDebts = n(debts);

  const calc = useMemo(() => {
    const financed = amountFinanced(costs);
    const payment = monthlyPayment(financed, rate, term);
    const totalInterest = payment * term - financed;
    const paymentShare = monthlyIncome ? payment / monthlyIncome : 0;
    const dti = monthlyIncome ? (payment + otherDebts) / monthlyIncome : 0;
    const verdict = !monthlyIncome
      ? null
      : paymentShare <= RULES.payment.ok && dti <= RULES.dti.ok
        ? ({ tone: 'go', label: 'Comfortable' } as const)
        : paymentShare <= RULES.payment.max && dti <= RULES.dti.max
          ? ({ tone: 'caution', label: 'A stretch' } as const)
          : ({ tone: 'stop', label: 'Over budget' } as const);
    const byTerm = TERMS.map((t) => {
      const p = monthlyPayment(financed, rate, t);
      return { term: t, payment: p, interest: p * t - financed };
    });
    const budget = (paymentShare: number, dtiLimit: number) => {
      const maxPayment = Math.max(0, Math.min(monthlyIncome * paymentShare, monthlyIncome * dtiLimit - otherDebts));
      const loan = maxLoanForPayment(maxPayment, rate, term);
      return { payment: maxPayment, price: maxPriceForLoan(loan, costs) };
    };
    return {
      financed,
      payment,
      totalInterest,
      tax: salesTax(costs),
      totalCost: costs.price + salesTax(costs) + costs.fees + totalInterest,
      paymentShare,
      dti,
      verdict,
      byTerm,
      years: amortizationByYear(financed, rate, term),
      comfortable: budget(RULES.payment.ok, RULES.dti.ok),
      stretch: budget(RULES.payment.max, RULES.dti.max),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, tax, fees, down, tradeIn, apr, term, income, debts]);

  const runEstimate = async () => {
    if (!hasVehicle(vehicle)) {
      setEstimateError('Enter the year, make and model first.');
      return;
    }
    setEstimating(true);
    setEstimateError(null);
    try {
      const e = await estimatePrice(vehicleLabel(vehicle), trim, zip);
      setEstimate(e);
      setPrice(String(Math.round(e.fair)));
    } catch {
      setEstimateError("Couldn't estimate a price right now. Enter the price you were quoted.");
    } finally {
      setEstimating(false);
    }
  };

  const sendLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSending(true);
    try {
      await saveLead('Car-affordability_leads.json', {
        timestamp: new Date().toISOString(),
        contactName: lead.name,
        contactEmail: lead.email,
        contactPhone: lead.phone,
        vehicleYear: vehicle.year,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        vehicleTrim: trim,
        vehicleZip: zip,
        monthlyIncome: income,
        monthlyDebt: debts,
        creditScore: tier,
        downPayment: down,
        termMonths: term,
        source: 'Affordability_Predictor_PreApproval',
      });
      setLeadSent(true);
    } catch (err) {
      console.error('Lead submission failed', err);
    } finally {
      setLeadSending(false);
    }
  };

  return (
    <ToolPage
      category="money"
      title="Can I afford this car?"
      intro="See the real monthly payment, interest and total cost of any car, checked against your income. Or find the most you can comfortably spend."
      sources="Standard loan amortization math. Typical rates by credit band (enter your own rate for exact numbers). Optional price estimates by AI (Anthropic's Claude)."
    >
      <div role="tablist" aria-label="What do you want to do?" className="mb-6 inline-flex rounded-lg bg-muted p-1">
        {(
          [
            ['check', 'Check a car'],
            ['budget', 'Find my budget'],
          ] as const
        ).map(([id, label]) => (
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,25rem)_1fr]">
        <Panel className="space-y-5 self-start">
          {mode === 'check' && (
            <div>
              <NumberField id="price" label="Car price" value={price} onChange={setPrice} prefix="$" step="500" />
              <button
                type="button"
                onClick={() => setShowEstimator((v) => !v)}
                aria-expanded={showEstimator}
                className={cn('mt-2 cursor-pointer rounded-sm text-[0.9375rem] font-semibold underline underline-offset-4', focusRing)}
              >
                Don't know a fair price? Estimate it
              </button>
              {showEstimator && (
                <div className="mt-3 space-y-3 rounded-lg bg-muted/60 p-3">
                  <VehicleFields value={vehicle} onChange={setVehicle} minYear={1995} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Trim (optional)" htmlFor="trim">
                      <input id="trim" value={trim} onChange={(e) => setTrim(e.target.value)} placeholder="EX-L" className={inputClass} />
                    </Field>
                    <Field label="ZIP (optional)" htmlFor="est-zip">
                      <input id="est-zip" inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))} className={inputClass} />
                    </Field>
                  </div>
                  <SecondaryButton type="button" onClick={runEstimate} disabled={estimating} className="h-10">
                    {estimating ? 'Estimating…' : 'Estimate the price'}
                  </SecondaryButton>
                  {estimateError && <p className="text-[0.9375rem] text-sign-red">{estimateError}</p>}
                  {estimate && (
                    <p className="text-[0.9375rem]">
                      Typical price <strong>{moneyRange(estimate.low, estimate.high)}</strong>. We used {money(estimate.fair)}. {estimate.note}{' '}
                      <span className="text-muted-foreground">(AI estimate)</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <p className="mb-1.5 text-[0.9375rem] font-semibold">New or used</p>
            <div className="grid grid-cols-2 gap-2">
              {(['new', 'used'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={condition === c}
                  onClick={() => {
                    setCondition(c);
                    setTierAndApr(tier, c);
                  }}
                  className={cn(
                    'h-11 cursor-pointer rounded-lg border font-semibold capitalize',
                    condition === c ? 'border-sign-green bg-sign-green text-white' : 'border-input bg-card hover:bg-muted',
                    focusRing,
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField id="income" label="Monthly income (before tax)" value={income} onChange={setIncome} prefix="$" step="100" />
            <NumberField id="debts" label="Monthly debt payments" value={debts} onChange={setDebts} prefix="$" step="50" hint="Rent or mortgage, cards, loans" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Credit" htmlFor="credit">
              <select id="credit" value={tier} onChange={(e) => setTierAndApr(e.target.value as CreditTierId)} className={inputClass}>
                {CREDIT_TIERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <NumberField
              id="apr"
              label="Interest rate (APR)"
              value={apr}
              onChange={(v) => {
                setApr(v);
                setAprEdited(true);
              }}
              suffix="%"
              step="0.1"
              hint={aprEdited ? 'Your rate' : 'Typical rate, not a quote'}
            />
          </div>

          <Field label="Loan length" htmlFor="term">
            <select id="term" value={term} onChange={(e) => setTerm(Number(e.target.value))} className={inputClass}>
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  {t} months ({t / 12} years)
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <NumberField id="down" label="Down payment" value={down} onChange={setDown} prefix="$" step="500" />
            <NumberField id="trade" label="Trade-in value" value={tradeIn} onChange={setTradeIn} prefix="$" step="500" />
            <NumberField id="tax" label="Sales tax" value={tax} onChange={setTax} suffix="%" step="0.25" />
            <NumberField id="fees" label="Title, registration and fees" value={fees} onChange={setFees} prefix="$" step="50" />
          </div>
        </Panel>

        <div className="min-w-0 space-y-6">
          {mode === 'check' ? (
            <>
              <Panel aria-live="polite">
                <div className="flex flex-wrap items-center gap-3">
                  {calc.verdict && <Verdict tone={calc.verdict.tone}>{calc.verdict.label}</Verdict>}
                  <span className="text-[0.9375rem] text-muted-foreground">
                    {money(costs.price)} car, {term}-month loan at {rate}% APR
                  </span>
                </div>
                <p className="mt-3 font-heading text-5xl font-extrabold tabular-nums">
                  {money(calc.payment)}
                  <span className="ml-1 text-xl font-bold text-muted-foreground">per month</span>
                </p>
                {monthlyIncome > 0 && (
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <RuleBar label="Car payment, share of income" value={calc.paymentShare} ok={RULES.payment.ok} max={RULES.payment.max} note="Aim for 10% or less. 15% is a stretch." />
                    <RuleBar label="All debts, share of income" value={calc.dti} ok={RULES.dti.ok} max={RULES.dti.max} note="Lenders prefer 36% or less; most cap around 43%." />
                  </div>
                )}
                <FactList
                  className="mt-6"
                  items={[
                    ['Amount borrowed', money(calc.financed)],
                    ['Sales tax', money(calc.tax)],
                    ['Total interest', money(calc.totalInterest)],
                    ['Total cost of the car (price, tax, fees, interest)', money(calc.totalCost)],
                  ]}
                />
              </Panel>

              <Panel>
                <PanelTitle>How the loan length changes the cost</PanelTitle>
                <p className="mt-1 text-[0.9375rem] text-muted-foreground">Longer loans lower the payment but cost more interest.</p>
                <table className="mt-4 w-full text-[0.9375rem]">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 font-semibold">Loan length</th>
                      <th className="py-2 text-right font-semibold">Monthly</th>
                      <th className="py-2 text-right font-semibold">Total interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.byTerm.map((row) => (
                      <tr key={row.term} className={cn('border-b border-border', row.term === term && 'bg-sign-green/10 font-bold')}>
                        <td className="py-2">
                          <button type="button" onClick={() => setTerm(row.term)} className={cn('cursor-pointer rounded-sm underline-offset-4 hover:underline', focusRing)}>
                            {row.term} months
                          </button>
                        </td>
                        <td className="py-2 text-right tabular-nums">{money(row.payment)}</td>
                        <td className="py-2 text-right tabular-nums">{money(row.interest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>

              {calc.financed > 0 && (
                <Panel>
                  <PanelTitle>Where your payments go each year</PanelTitle>
                  <div className="mt-4">
                    <StackedColumns
                      title="Principal and interest paid per loan year"
                      series={['Principal', 'Interest']}
                      periods={calc.years.map((y) => ({ label: y.label, values: [y.principal, y.interest] }))}
                    />
                  </div>
                </Panel>
              )}
            </>
          ) : (
            <Panel aria-live="polite">
              <PanelTitle>What you can spend</PanelTitle>
              {!monthlyIncome ? (
                <p className="mt-2">Enter your monthly income to see your budget.</p>
              ) : (
                <>
                  <dl className="mt-4 grid gap-6 sm:grid-cols-2">
                    {[
                      ['Comfortable', calc.comfortable, 'go', 'Payment at most 10% of income, all debts at most 36%.'],
                      ['Stretch', calc.stretch, 'caution', 'Payment at most 15% of income, all debts at most 43%.'],
                    ].map(([label, b, tone, rule]) => {
                      const budget = b as { payment: number; price: number };
                      return (
                        <div key={label as string} className="rounded-lg border border-border p-4">
                          <dt>
                            <Verdict tone={tone as 'go' | 'caution'}>{label as string}</Verdict>
                          </dt>
                          <dd className="mt-3">
                            <span className="block font-heading text-4xl font-extrabold tabular-nums">{money(budget.price)}</span>
                            <span className="text-[0.9375rem] text-muted-foreground">
                              car price, {money(budget.payment)}/month over {term} months
                            </span>
                            <span className="mt-2 block text-sm text-muted-foreground">{rule as string}</span>
                            <SecondaryButton
                              type="button"
                              className="mt-3 h-10"
                              onClick={() => {
                                setPrice(String(Math.floor(budget.price / 100) * 100));
                                setMode('check');
                              }}
                            >
                              Check a car at this price
                            </SecondaryButton>
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                  {calc.comfortable.payment === 0 && (
                    <Notice tone="warning" className="mt-4">
                      Your other debts already use more than 36% of your income, so any car payment would put you over the comfortable limit.
                    </Notice>
                  )}
                  <p className="mt-4 text-sm text-muted-foreground">
                    Includes your down payment, trade-in, {n(tax)}% sales tax and {money(n(fees))} in fees, at {rate}% APR.
                  </p>
                </>
              )}
            </Panel>
          )}

          <Panel>
            <PanelTitle>Get pre-approved</PanelTitle>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">A real rate from a lender makes these numbers exact and gives you leverage at the dealer.</p>
            {leadSent ? (
              <Notice tone="success" className="mt-4" title="Request sent">
                A lending partner will contact you with pre-approval options.
              </Notice>
            ) : (
              <form onSubmit={sendLead} className="mt-4 grid gap-3 sm:grid-cols-3">
                <Field label="Full name" htmlFor="lead-name">
                  <input id="lead-name" required autoComplete="name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Email" htmlFor="lead-email">
                  <input id="lead-email" required type="email" autoComplete="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Phone" htmlFor="lead-phone">
                  <input id="lead-phone" required type="tel" autoComplete="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} className={inputClass} />
                </Field>
                <div className="sm:col-span-3">
                  <PrimaryButton type="submit" loading={leadSending}>
                    Check my rate
                  </PrimaryButton>
                  <p className="mt-2 text-sm text-muted-foreground">We share these details only with the lending partner who contacts you.</p>
                </div>
              </form>
            )}
          </Panel>
        </div>
      </div>
    </ToolPage>
  );
};

export default AffordabilityPredictor;
