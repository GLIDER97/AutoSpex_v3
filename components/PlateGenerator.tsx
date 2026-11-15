import React, { useEffect, useState } from 'react';
import { Copy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATES } from '../utils/insurance';
import { VIBES, cleanPlate, plateIdeas, readability, type PlateIdea, type Vibe } from '../utils/plates';
import { useReveal, Faq, Field, Notice, Panel, PanelTitle, PrimaryButton, SecondaryButton, Spinner, ToolPage, focusRing, inputClass } from './tool/kit';

/** A generic plate (no real state artwork) with the state name on top. */
function Plate({ text, state, mirror = false, className }: { text: string; state: string; mirror?: boolean; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`License plate reading ${text.split('').join(' ')}${mirror ? ', mirrored' : ''}`}
      className={cn('@container relative mx-auto aspect-[2/1] w-full max-w-[17rem] rounded-xl border-2 border-sign-ink/80 bg-white p-2 shadow-sm', className)}
    >
      <div className={cn('flex h-full flex-col items-center justify-between rounded-md border border-sign-ink/25 px-2 py-1', mirror && '-scale-x-100')}>
        <span className="text-xs font-bold tracking-[0.2em] text-sign-blue uppercase">{state || 'Your state'}</span>
        <span className="font-heading text-[min(2.6rem,13cqw)] leading-none font-extrabold tracking-[0.06em] whitespace-pre text-sign-ink">{text || ' '}</span>
        <span className="h-3" />
      </div>
    </div>
  );
}

const FAQS: [string, string][] = [
  [
    'How many characters can a vanity plate have?',
    'Most states allow up to 7 characters on a standard passenger plate, some allow 8, and a few or certain plate designs only 6. Spaces usually count. Pick your limit above and every idea will fit it.',
  ],
  [
    'How do I check if a plate is available?',
    "Your state DMV's website has a personalized plate search; the link with your ideas opens that search. Availability changes daily, so check right before you apply.",
  ],
  [
    'How much does a vanity plate cost?',
    'Usually $25 to $100 on top of normal registration, often renewed every year. Specialty plate designs with a personalized message can cost more.',
  ],
  [
    'Why would the DMV reject my plate?',
    'States reject plates that could be read as profanity, drugs, violence, sexual content or hate, including when read backwards or with numbers as letters. Ideas the AI thinks might be read that way are flagged.',
  ],
  [
    'Why check how it reads in a mirror?',
    'The driver ahead sees your plate in their rear-view mirror, reversed. Some plates are designed to read in the mirror; for the rest it shows how the plate looks to the person in front of you.',
  ],
];

const FRAMES = [
  { name: 'Carbon fiber plate frames', url: 'https://Autospex.short.gy/bj8ZmK' },
  { name: 'Polished stainless steel frames', url: 'https://Autospex.short.gy/3C6GkX' },
  { name: 'Rhinestone plate frames', url: 'https://Autospex.short.gy/H7Y5ym' },
];

function loadSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('savedPlates') ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 30) : [];
  } catch {
    return [];
  }
}

export default function PlateGenerator() {
  const [state, setState] = useState('');
  const [maxChars, setMaxChars] = useState(7);
  const [car, setCar] = useState('');
  const [about, setAbout] = useState('');
  const [vibe, setVibe] = useState<Vibe>('Clever');
  const [ideas, setIdeas] = useState<PlateIdea[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [own, setOwn] = useState('');
  const [mirror, setMirror] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [copied, setCopied] = useState('');
  const results = useReveal<HTMLDivElement>();

  useEffect(() => setSaved(loadSaved()), []);
  const toggleSave = (plate: string) =>
    setSaved((s) => {
      const next = s.includes(plate) ? s.filter((p) => p !== plate) : [plate, ...s].slice(0, 30);
      try {
        localStorage.setItem('savedPlates', JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });

  const stateName = STATES.find((s) => s.code === state)?.name ?? '';
  const dmvSearch = (plate: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`${stateName || 'state'} DMV personalized plate availability check ${plate}`)}`;

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car.trim() && !about.trim()) {
      setError('Tell us about your car or about you (or both).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const list = await plateIdeas({ car: car.trim(), about: about.trim(), vibe, state: stateName, maxChars });
      if (!list.length) throw new Error('No ideas came back. Please try again.');
      setIdeas(list);
      results.reveal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The ideas could not be made. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ownPlate = cleanPlate(own).slice(0, 10);
  const ownCheck = ownPlate ? readability(ownPlate) : null;

  const copy = (plate: string) =>
    navigator.clipboard?.writeText(plate).then(() => {
      setCopied(plate);
      setTimeout(() => setCopied(''), 1500);
    });

  return (
    <ToolPage
      category="fun"
      title="Vanity plate ideas"
      intro="Clever personalized plate ideas that fit your state's character limit, with a preview, a check for letters people misread, a flag for ideas a DMV might reject, and a link to check availability."
      sources="AI (Anthropic's Claude) for the ideas; length and readability are checked on this page."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6">
          <Panel>
            <form onSubmit={generate} noValidate className="space-y-4">
              <div className="grid grid-cols-[1fr_7rem] gap-3">
                <Field label="State" htmlFor="plate-state">
                  <select id="plate-state" value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                    <option value="">Choose</option>
                    {STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Max length" htmlFor="plate-max">
                  <select id="plate-max" value={maxChars} onChange={(e) => setMaxChars(Number(e.target.value))} className={inputClass}>
                    {[6, 7, 8].map((m) => (
                      <option key={m} value={m}>
                        {m} chars
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Your car" htmlFor="plate-car" hint="Make, model or color, e.g. red Jeep Wrangler.">
                <input id="plate-car" value={car} onChange={(e) => setCar(e.target.value)} maxLength={80} className={inputClass} />
              </Field>
              <Field label="About you" htmlFor="plate-about" hint="Name, job, hobbies, pets, a favorite saying.">
                <textarea id="plate-about" value={about} onChange={(e) => setAbout(e.target.value)} maxLength={200} rows={2} className={cn(inputClass, 'h-auto py-2')} />
              </Field>
              <fieldset>
                <legend className="mb-2 text-[0.9375rem] font-semibold">Style</legend>
                <div className="flex flex-wrap gap-2">
                  {VIBES.map((v) => (
                    <label
                      key={v}
                      className={cn(
                        'inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-sm font-semibold pointer-coarse:min-h-11 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
                        vibe === v ? 'border-foreground bg-foreground text-background' : 'border-input hover:bg-muted',
                      )}
                    >
                      <input type="radio" name="vibe" value={v} checked={vibe === v} onChange={() => setVibe(v)} className="sr-only" />
                      {v}
                    </label>
                  ))}
                </div>
              </fieldset>
              <PrimaryButton type="submit" loading={loading} className="w-full">
                {ideas ? 'More ideas' : 'Get plate ideas'}
              </PrimaryButton>
              {error && <Notice tone="error">{error}</Notice>}
            </form>
          </Panel>

          <Panel aria-labelledby="own-title">
            <PanelTitle>
              <span id="own-title">Test your own idea</span>
            </PanelTitle>
            <Field label="Plate text" htmlFor="plate-own" className="mt-3">
              <input id="plate-own" autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={own} onChange={(e) => setOwn(e.target.value)} maxLength={12} className={cn(inputClass, 'font-heading font-bold tracking-wider uppercase')} />
            </Field>
            {ownPlate && (
              <div className="mt-4">
                <Plate text={ownPlate} state={stateName} mirror={mirror} />
                <p className={cn('mt-3 text-[0.9375rem]', ownPlate.length > maxChars && 'font-semibold text-sign-red dark:text-red-300')}>
                  {ownPlate.length} of {maxChars} characters{ownPlate.length > maxChars ? ': too long for the limit you picked.' : '.'} {ownCheck?.note}
                </p>
              </div>
            )}
          </Panel>
        </div>

        <div className="scroll-mt-20 space-y-6" aria-live="polite" ref={results.ref}>
          {loading && !ideas && <Spinner label="Thinking up plates…" />}
          {!ideas && !loading && (
            <Panel>
              <Plate text="GR8 DAY" state={stateName} />
              <p className="mt-4 text-center text-muted-foreground">Tell us about your car and yourself to get 12 ideas that fit your state's limit.</p>
            </Panel>
          )}
          {ideas && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-2xl font-extrabold">{ideas.length} ideas</h2>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[0.9375rem] font-semibold">
                  <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} className="size-4 accent-sign-green" />
                  Show as seen in a rear-view mirror
                </label>
              </div>
              <ul className={cn('grid gap-4 sm:grid-cols-2', loading && 'opacity-60')}>
                {ideas.map((idea) => {
                  const r = readability(idea.plate);
                  const isSaved = saved.includes(idea.plate);
                  return (
                    <li key={idea.plate} className="flex flex-col rounded-xl border border-border bg-card p-4">
                      <Plate text={idea.plate} state={stateName} mirror={mirror} />
                      <p className="mt-3 font-semibold">“{idea.reading}”</p>
                      <p className="text-[0.9375rem] text-muted-foreground">{idea.meaning}</p>
                      <p className={cn('mt-2 text-sm', r.easy ? 'text-muted-foreground' : 'font-semibold')}>{r.note}</p>
                      {idea.caution && <p className="mt-1 text-sm font-semibold text-sign-red dark:text-red-300">Might be rejected: {idea.caution}</p>}
                      <div className="mt-auto flex flex-wrap gap-2 pt-3">
                        <SecondaryButton type="button" className="h-9 px-3 text-sm pointer-coarse:h-11" aria-pressed={isSaved} onClick={() => toggleSave(idea.plate)}>
                          <Star className={cn('size-4', isSaved && 'fill-sign-yellow text-[#b07800]')} aria-hidden="true" />
                          {isSaved ? 'Saved' : 'Save'}
                          <span className="sr-only"> {idea.plate}</span>
                        </SecondaryButton>
                        <SecondaryButton type="button" className="h-9 px-3 text-sm pointer-coarse:h-11" onClick={() => copy(idea.plate)}>
                          <Copy className="size-4" aria-hidden="true" />
                          {copied === idea.plate ? 'Copied' : 'Copy'}
                          <span className="sr-only"> {idea.plate}</span>
                        </SecondaryButton>
                        <a
                          href={dmvSearch(idea.plate)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn('inline-flex h-9 items-center rounded-lg px-2 text-sm font-semibold underline underline-offset-4 pointer-coarse:h-11', focusRing)}
                        >
                          Check availability<span className="sr-only"> of {idea.plate} (opens a search)</span>
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {saved.length > 0 && (
            <Panel aria-labelledby="saved-title">
              <PanelTitle>
                <span id="saved-title">Your saved plates</span>
              </PanelTitle>
              <ul className="mt-3 flex flex-wrap gap-2">
                {saved.map((p) => (
                  <li key={p} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 font-heading font-bold tracking-wider">
                    {p}
                    <button type="button" onClick={() => toggleSave(p)} aria-label={`Remove ${p}`} className={cn('-my-1 -mr-2 flex size-8 cursor-pointer items-center justify-center rounded-sm text-lg text-muted-foreground hover:text-foreground pointer-coarse:size-11', focusRing)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">Saved on this device only.</p>
            </Panel>
          )}

          <Panel aria-labelledby="frames-title">
            <PanelTitle>
              <span id="frames-title">Finish the look</span>
            </PanelTitle>
            <ul className="mt-3 space-y-2 text-[0.9375rem]">
              {FRAMES.map((f) => (
                <li key={f.url}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer sponsored" className={cn('inline-flex items-center rounded-sm font-semibold underline underline-offset-4 pointer-coarse:min-h-11', focusRing)}>
                    {f.name}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">Affiliate links: we may earn a commission at no cost to you. Check your state's rules: frames must not cover the state name or tags.</p>
          </Panel>
        </div>
      </div>

      <Faq id="plate-faq" title="Questions about vanity plates" items={FAQS} />
    </ToolPage>
  );
}
