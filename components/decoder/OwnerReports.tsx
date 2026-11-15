import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { componentName, componentsForCode, matchesComponents } from '../../utils/nhtsa';
import { searchComplaints, type ComplaintSummary } from '../../utils/nhtsaComplaints';
import { searchRecalls, type Recall } from '../../utils/nhtsaRecalls';
import { Panel, PanelTitle, Spinner, focusRing, type Vehicle } from '../tool/kit';

const formatDate = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

/**
 * What NHTSA has on file for the owner's car: owner complaints and recalls,
 * with the ones about the systems these codes point at listed first.
 */
export default function OwnerReports({ vehicle, codes }: { vehicle: Vehicle; codes: string[] }) {
  const [state, setState] = useState<{ complaints: ComplaintSummary; recalls: Recall[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  useEffect(() => {
    let live = true;
    setState(null);
    setFailed(false);
    const year = Number(vehicle.year);
    Promise.all([searchComplaints(year, vehicle.make, vehicle.model), searchRecalls(year, vehicle.make, vehicle.model)])
      .then(([complaints, recalls]) => live && setState({ complaints, recalls: recalls.recalls }))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [vehicle.year, vehicle.make, vehicle.model]);

  const categories = [...new Set(codes.flatMap(componentsForCode))];
  // NHTSA has overlapping category names ("Fuel system", "Fuel and propulsion"); describe them once.
  const SAME = { 'fuel and propulsion': 'fuel system', 'engine and cooling': 'engine' } as Record<string, string>;
  const names = [...new Set(categories.map((c) => componentName(c).toLowerCase()).map((n) => SAME[n] ?? n))].slice(0, 3);
  const systemNames = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? '';

  return (
    <Panel aria-labelledby="owner-reports-title">
      <PanelTitle>
        <span id="owner-reports-title">What NHTSA has on file for the {label}</span>
      </PanelTitle>
      <p className="mt-1 text-[0.9375rem] text-muted-foreground">
        Complaints owners filed with the US road safety agency, and safety recalls. Related means the {systemNames}, the
        systems these codes point at.
      </p>

      {!state && !failed && (
        <div className="mt-4">
          <Spinner label="Checking NHTSA records…" />
        </div>
      )}
      {failed && <p className="mt-4 text-[0.9375rem]">NHTSA's records could not be loaded right now.</p>}

      {state && (() => {
        const { complaints, recalls } = state;
        const related = complaints.complaints.filter((c) => c.components.some((k) => matchesComponents(k, categories)));
        const relatedRecalls = recalls.filter((r) => matchesComponents(r.component, categories));
        if (!complaints.total && !recalls.length) {
          return (
            <p className="mt-4 text-[0.9375rem]">
              NHTSA has no complaints or recalls on record under that name. Check the model name (for example CR-V or F-150).
            </p>
          );
        }
        const shown = showAll ? related.slice(0, 12) : related.slice(0, 3);
        return (
          <div className="mt-5 space-y-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {[
                ['Owner complaints', complaints.total.toLocaleString('en-US')],
                ['Related to these codes', related.length.toLocaleString('en-US')],
                ['Recalls', recalls.length.toLocaleString('en-US')],
                ['Related recalls', relatedRecalls.length.toLocaleString('en-US')],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="font-heading text-2xl font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>

            {complaints.byComponent.length > 0 && (
              <div>
                <h3 className="mb-2 font-bold">Most reported problems on this car</h3>
                <ul className="space-y-1.5">
                  {complaints.byComponent.slice(0, 5).map((c) => {
                    const pct = (c.count / complaints.byComponent[0].count) * 100;
                    const isRelated = categories.includes(c.component);
                    return (
                      <li key={c.component} className="grid grid-cols-[minmax(0,11rem)_1fr_3rem] items-center gap-3 text-[0.9375rem]">
                        <span className={cn('truncate', isRelated && 'font-bold')}>{c.label}</span>
                        <span className="h-2.5 rounded-full bg-muted">
                          <span
                            className={cn('block h-full rounded-full', isRelated ? 'bg-sign-yellow' : 'bg-slate-400')}
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </span>
                        <span className="text-right tabular-nums">{c.count}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-sm text-muted-foreground">Yellow bars are systems related to your codes.</p>
              </div>
            )}

            {relatedRecalls.length > 0 && (
              <div>
                <h3 className="mb-2 font-bold">Recalls on related systems</h3>
                <ul className="space-y-2">
                  {relatedRecalls.slice(0, 4).map((r) => (
                    <li key={r.campaignNumber} className="rounded-lg border border-border p-3 text-[0.9375rem]">
                      <p className="font-semibold">
                        {r.component.replace(/:/g, ' › ')}
                        {(r.parkIt || r.parkOutside) && <span className="ml-2 text-sign-red">{r.parkIt ? 'Do not drive' : 'Park outside'}</span>}
                      </p>
                      <p className="mt-1 line-clamp-2 text-muted-foreground">{r.summary}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Campaign {r.campaignNumber}, reported {formatDate(r.reportDate)}. Recall repairs are free at a dealer.
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {related.length > 0 && (
              <div>
                <h3 className="mb-2 font-bold">What owners report about these systems</h3>
                <ul className="space-y-3">
                  {shown.map((c) => (
                    <li key={c.id} className="border-l-2 border-border pl-3 text-[0.9375rem]">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(c.date)}
                        {c.crash ? ', crash reported' : ''}
                        {c.fire ? ', fire reported' : ''}
                      </p>
                      <p className="mt-0.5 line-clamp-4">{c.summary}</p>
                    </li>
                  ))}
                </ul>
                {related.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className={cn('mt-3 cursor-pointer rounded-sm text-[0.9375rem] font-bold text-sign-green underline underline-offset-4 dark:text-foreground', focusRing)}
                  >
                    {showAll ? 'Show fewer' : `Show more owner reports (${Math.min(related.length, 12) - 3} more)`}
                  </button>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Complaints are unverified owner reports. To check open recalls on your exact car, use the{' '}
              <Link to="/recalls" className={cn('rounded-sm underline underline-offset-4', focusRing)}>
                recall check
              </Link>{' '}
              or your VIN at nhtsa.gov.
            </p>
          </div>
        );
      })()}
    </Panel>
  );
}
