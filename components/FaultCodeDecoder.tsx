import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Link2, MapPin, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INITIAL_OBD_DATABASE } from '../data/obdCodes';
import { MAX_CODES, diagnose, explanationFromBuiltIn, parseCodes, type Diagnosis } from '../utils/diagnosis';
import DiagnosisView from './decoder/DiagnosisView';
import MechanicChat from './decoder/MechanicChat';
import OwnerReports from './decoder/OwnerReports';
import LeadForm from './LeadForm';
import AffiliateSection from './AffiliateSection';
import FAQSection from './FAQSection';
import {
  Field,
  Panel,
  PanelTitle,
  PrimaryButton,
  ToolPage,
  VehicleFields,
  focusRing,
  hasVehicle,
  inputClass,
  vehicleLabel,
  type Vehicle,
} from './tool/kit';

interface Lookup {
  codes: string[];
  vehicle: Vehicle;
}

const EMPTY_VEHICLE: Vehicle = { year: '', make: '', model: '' };
const EXAMPLES = ['P0420', 'P0171 P0174', 'P0300 P0301', 'P0455'];
const RECENT_KEY = 'recentCodeLookups';

function loadRecent(): Lookup[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(list) ? list.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function saveRecent(lookup: Lookup) {
  try {
    const key = (l: Lookup) => `${l.codes.join()}|${vehicleLabel(l.vehicle)}`;
    const list = [lookup, ...loadRecent().filter((l) => key(l) !== key(lookup))].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [lookup];
  }
}

const describe = (l: Lookup) => `${l.codes.join(', ')}${hasVehicle(l.vehicle) ? ` on a ${vehicleLabel(l.vehicle)}` : ''}`;

const FaultCodeDecoder: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle>(EMPTY_VEHICLE);
  const [inputError, setInputError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [laborRate, setLaborRate] = useState('140');
  const [leadOpen, setLeadOpen] = useState(false);
  const [recent, setRecent] = useState<Lookup[]>([]);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => setRecent(loadRecent()), []);

  const run = async (next: Lookup) => {
    const id = ++requestId.current;
    setLookup(next);
    setDiagnosis(null);
    setError(null);
    setLoading(true);
    setRecent(saveRecent(next));
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    try {
      const result = await diagnose(next.codes, hasVehicle(next.vehicle) ? vehicleLabel(next.vehicle) : '', INITIAL_OBD_DATABASE);
      if (id === requestId.current) setDiagnosis(result);
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  // Every lookup lives in the URL (?codes=P0171,P0174&year=2016&make=Honda&model=Civic),
  // so results can be bookmarked and shared, and homepage links (?code=P0420) work.
  const paramKey = params.toString();
  useEffect(() => {
    const { codes } = parseCodes(params.get('codes') ?? params.get('code') ?? '');
    if (!codes.length) return;
    const v = { year: params.get('year') ?? '', make: params.get('make') ?? '', model: params.get('model') ?? '' };
    setInput(codes.join(' '));
    setVehicle(v);
    run({ codes, vehicle: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  const submit = (codesText: string, v: Vehicle) => {
    const { codes, invalid } = parseCodes(codesText);
    if (!codes.length) {
      setInputError(
        invalid.length
          ? `"${invalid[0]}" isn't a code. Codes are a letter (P, B, C or U) and four characters, like P0420.`
          : 'Enter at least one code, like P0420.',
      );
      return;
    }
    setInputError(invalid.length ? `Skipped "${invalid.join('", "')}": not a valid code.` : null);
    const next = new URLSearchParams({ codes: codes.join(',') });
    if (hasVehicle(v)) {
      next.set('year', v.year);
      next.set('make', v.make.trim());
      next.set('model', v.model.trim());
    }
    if (next.toString() === paramKey) run({ codes, vehicle: v });
    else setParams(next);
  };

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked: the URL in the address bar is the share link.
    }
  };

  const fallback = (lookup?.codes ?? []).filter((c) => INITIAL_OBD_DATABASE[c]).map((c) => explanationFromBuiltIn(INITIAL_OBD_DATABASE[c]));
  const lookupVehicle = lookup && hasVehicle(lookup.vehicle) ? vehicleLabel(lookup.vehicle) : '';

  return (
    <ToolPage
      category="warnings"
      title="Check engine code lookup"
      intro="Enter the codes from your scanner to see what they mean, whether it's safe to drive, the likely causes and what each fix costs. Add your car for answers specific to it."
      sources="SAE J2012 code definitions, AI (Anthropic's Claude) for causes and costs, NHTSA owner complaints and recalls"
    >
      <Panel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input, vehicle);
          }}
          className="space-y-5"
        >
          <Field
            label="Codes from your scanner"
            htmlFor="codes"
            hint={`Up to ${MAX_CODES} codes, separated by spaces or commas. Codes that show up together are analyzed together.`}
          >
            <input
              id="codes"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="P0171 P0174"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={Boolean(inputError) || undefined}
              aria-describedby={inputError ? 'codes-error' : undefined}
              className={cn(inputClass, 'h-14 font-mono text-xl font-semibold tracking-[0.06em]')}
            />
          </Field>
          {inputError && (
            <p id="codes-error" className="-mt-2 text-[0.9375rem] font-semibold text-sign-red">
              {inputError}
            </p>
          )}
          <div>
            <p className="mb-2 text-[0.9375rem] font-semibold">Your car (optional, for answers specific to it)</p>
            <VehicleFields value={vehicle} onChange={setVehicle} minYear={1996} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <PrimaryButton type="submit" loading={loading} className="h-12 px-6 text-lg">
              Look up {parseCodes(input).codes.length > 1 ? 'codes' : 'code'}
            </PrimaryButton>
            {!lookup && (
              <div className="flex flex-wrap items-center gap-2 text-[0.9375rem]">
                <span className="text-muted-foreground">Try:</span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setInput(ex);
                      submit(ex, vehicle);
                    }}
                    className={cn('cursor-pointer rounded-md border border-input px-2.5 py-1 font-mono font-semibold hover:bg-muted', focusRing)}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {recent.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <h2 className="text-[0.9375rem] font-bold">Your recent lookups</h2>
            <p className="text-sm text-muted-foreground">Saved in this browser only.</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {recent.map((r) => (
                <li key={describe(r)}>
                  <button
                    type="button"
                    onClick={() => {
                      setInput(r.codes.join(' '));
                      setVehicle(r.vehicle);
                      submit(r.codes.join(' '), r.vehicle);
                    }}
                    className={cn('cursor-pointer rounded-md bg-muted px-2.5 py-1 text-[0.9375rem] hover:bg-secondary', focusRing)}
                  >
                    {describe(r)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <div ref={resultsRef} className="scroll-mt-24">
        {lookup && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 space-y-6 lg:col-span-2">
              <DiagnosisView
                diagnosis={diagnosis}
                fallback={fallback}
                loading={loading}
                error={error}
                onRetry={() => run(lookup)}
                laborRate={laborRate}
                onLaborRateChange={setLaborRate}
              />
              {(diagnosis || error) && <MechanicChat codes={lookup.codes} vehicle={lookupVehicle} diagnosis={diagnosis} />}
              {hasVehicle(lookup.vehicle) ? (
                <OwnerReports vehicle={lookup.vehicle} codes={lookup.codes} />
              ) : (
                <Panel>
                  <PanelTitle>See what other owners of your car report</PanelTitle>
                  <p className="mt-1 text-[0.9375rem] text-muted-foreground">
                    Add your year, make and model above to see NHTSA owner complaints and recalls for the systems these codes point at.
                  </p>
                </Panel>
              )}
            </div>

            <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <Panel>
                <PanelTitle>Next steps</PanelTitle>
                <div className="mt-4 space-y-3">
                  <PrimaryButton type="button" onClick={() => setLeadOpen(true)} className="w-full">
                    Get repair quotes from local shops
                  </PrimaryButton>
                  {[
                    { to: '/maintenance-validator', icon: ReceiptText, label: 'Check a quote you already have' },
                    { to: '/mechanic-finder?service=diagnostics', icon: MapPin, label: 'Find a mechanic near you' },
                  ].map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className={cn('flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 font-semibold hover:bg-muted', focusRing)}
                    >
                      <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={shareLink}
                    className={cn('flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 font-semibold hover:bg-muted', focusRing)}
                  >
                    <Link2 className="size-5 text-muted-foreground" aria-hidden="true" />
                    {copied ? 'Link copied' : 'Copy a link to this result'}
                  </button>
                </div>
              </Panel>
            </aside>
          </div>
        )}
      </div>

      {lookup && (
        <LeadForm isOpen={leadOpen} onClose={() => setLeadOpen(false)} errorCode={lookup.codes.join(', ')} vehicleName={lookupVehicle} />
      )}

      <div className="mt-16 space-y-16">
        {lookup && <AffiliateSection />}
        <FAQSection />
      </div>
    </ToolPage>
  );
};

export default FaultCodeDecoder;
