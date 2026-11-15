// A short contact form that saves a lead (utils/leadStorage.ts) with the
// tool's inputs attached, so a partner can follow up with a real quote.
import React, { useState } from 'react';
import { saveLead } from '../../utils/leadStorage';
import { Field, Notice, Panel, PanelTitle, PrimaryButton, inputClass } from './kit';

export default function LeadPanel({
  id,
  title,
  intro,
  cta,
  sentText,
  sheet,
  source,
  details,
  className,
}: {
  id: string;
  title: string;
  intro: string;
  cta: string;
  sentText: string;
  /** leadStorage file name, which picks the Google Sheet tab. */
  sheet: string;
  source: string;
  /** The tool inputs to send along with the contact details. */
  details: () => Record<string, unknown>;
  className?: string;
}) {
  const [lead, setLead] = useState({ name: '', email: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(false);
    try {
      await saveLead(sheet, {
        timestamp: new Date().toISOString(),
        contactName: lead.name,
        contactEmail: lead.email,
        contactPhone: lead.phone,
        ...details(),
        source,
      });
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel aria-labelledby={`${id}-title`} className={className}>
      <PanelTitle>
        <span id={`${id}-title`}>{title}</span>
      </PanelTitle>
      <p className="mt-1 text-[0.9375rem] text-muted-foreground">{intro}</p>
      {sent ? (
        <Notice tone="success" className="mt-4" title="Request sent">
          {sentText}
        </Notice>
      ) : (
        <form onSubmit={send} className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Full name" htmlFor={`${id}-name`}>
            <input id={`${id}-name`} required autoComplete="name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Email" htmlFor={`${id}-email`}>
            <input id={`${id}-email`} required type="email" autoComplete="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Phone" htmlFor={`${id}-phone`}>
            <input id={`${id}-phone`} required type="tel" autoComplete="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} className={inputClass} />
          </Field>
          <div className="sm:col-span-3">
            <PrimaryButton type="submit" loading={sending}>
              {cta}
            </PrimaryButton>
            {error && <p className="mt-2 text-[0.9375rem] font-semibold text-sign-red dark:text-red-300" role="alert">That didn't go through. Please try again.</p>}
            <p className="mt-2 text-sm text-muted-foreground">We share these details only with the partner who contacts you about this request.</p>
          </div>
        </form>
      )}
    </Panel>
  );
}
