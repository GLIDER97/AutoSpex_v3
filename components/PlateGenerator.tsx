import React, { useState } from 'react';
import { runTool } from '../utils/ai';
import type { VanityPlateItem, VanityPlateRequest } from '../types';
import { ProductPicks } from './tool/ProductPicks';
import { ChoiceGroup, Faq, Field, Notice, Panel, PanelTitle, PrimaryButton, ToolPage, inputClass } from './tool/kit';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
  'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const VIBES: VanityPlateRequest['vibe'][] = ['Funny', 'Punny', 'Minimalist', 'Aggressive', 'Intellectual'];

const FRAMES = [
  { name: 'Carbon fiber license plate frames', use: 'A slim, sporty frame that suits most cars.', url: 'https://Autospex.short.gy/bj8ZmK' },
  { name: 'Polished stainless steel frames', use: "Rust-proof and simple. Check it doesn't cover your state name or tags.", url: 'https://Autospex.short.gy/3C6GkX' },
  { name: 'Rhinestone license plate frames', use: 'For a plate that wants to be noticed.', url: 'https://Autospex.short.gy/H7Y5ym' },
];

const FAQS: [string, React.ReactNode][] = [
  [
    'How are the ideas made?',
    "An AI model (Anthropic's Claude) suggests short plates from your car, interests and the style you pick, using common plate tricks such as dropping vowels and swapping letters for numbers.",
  ],
  [
    'How many characters can a vanity plate have?',
    'Most states allow up to 7 characters on a standard plate, and some allow 8. Special-design plates often allow fewer. Your state DMV lists the exact rules.',
  ],
  [
    'Is my idea available?',
    "We can't check: availability lives in each state's DMV system. Most states have an online plate availability search, and the DMV can reject plates it considers offensive even if they're free.",
  ],
  [
    'How much does a vanity plate cost?',
    'It depends on the state: typically a one-time fee plus a yearly renewal, from about $10 to over $100 a year.',
  ],
];

const PlateGenerator: React.FC = () => {
  const [request, setRequest] = useState<VanityPlateRequest>({ carModel: '', hobbies: '', vibe: 'Funny', state: 'California' });
  const [shownState, setShownState] = useState('');
  const [results, setResults] = useState<VanityPlateItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof VanityPlateRequest>(key: K) => (value: VanityPlateRequest[K]) => setRequest((r) => ({ ...r, [key]: value }));

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.carModel.trim() || !request.hobbies.trim()) {
      setError('Enter your car and a few interests.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // The prompt and schema are written on the server (api/_aiTools.ts, "plates").
      const response = await runTool('plates', {
        carModel: request.carModel.trim(),
        state: request.state,
        hobbies: request.hobbies.trim(),
        vibe: request.vibe,
      });
      const plates = JSON.parse(response.text || '{}').plates;
      if (!Array.isArray(plates) || !plates.length) throw new Error('empty');
      setResults(plates);
      setShownState(request.state);
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'empty' && !/JSON/.test(err.message) ? err.message : "Ideas couldn't be made right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPage
      category="fun"
      title="Vanity plate ideas"
      intro="Short, personal plate ideas from your car, your interests and your style. Check availability with your state DMV before you order."
      sources="Ideas suggested by AI (Anthropic's Claude). Availability isn't checked."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,25rem)_1fr]">
        <Panel className="self-start">
          <form onSubmit={generate} className="space-y-5">
            <Field label="Your car" htmlFor="plate-car">
              <input id="plate-car" value={request.carModel} onChange={(e) => set('carModel')(e.target.value)} placeholder="Mazda MX-5" maxLength={60} className={inputClass} />
            </Field>
            <Field label="Interests" htmlFor="plate-hobbies" hint="A few words: hobbies, job, pets, music.">
              <input id="plate-hobbies" value={request.hobbies} onChange={(e) => set('hobbies')(e.target.value)} placeholder="Hiking, coffee, jazz" maxLength={120} className={inputClass} />
            </Field>
            <Field label="State" htmlFor="plate-state">
              <select id="plate-state" value={request.state} onChange={(e) => set('state')(e.target.value)} className={inputClass}>
                {US_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <ChoiceGroup legend="Style" name="vibe" value={request.vibe} onChange={set('vibe')} options={VIBES.map((v) => ({ id: v, label: v }))} />
            <PrimaryButton type="submit" loading={loading} className="w-full">
              {loading ? 'Thinking…' : results ? 'Get new ideas' : 'Get plate ideas'}
            </PrimaryButton>
            {error && <Notice tone="error">{error}</Notice>}
          </form>
        </Panel>

        <div aria-live="polite">
          {!results ? (
            <Panel className="flex min-h-64 flex-col justify-center">
              <PanelTitle>Ideas you can check right away</PanelTitle>
              <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                You'll get six ideas of up to 7 characters, each with what it means. Copy your favorites into your state DMV's plate
                availability search.
              </p>
            </Panel>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {results.map((item) => (
                <li key={item.plate} className="rounded-xl border border-border bg-card p-5">
                  <div className="mx-auto flex max-w-64 flex-col items-center rounded-lg border-2 border-foreground/80 bg-white px-4 pt-1.5 pb-2 text-[#14213d] shadow-xs">
                    <span className="text-[0.6875rem] font-bold tracking-[0.2em] uppercase">{shownState}</span>
                    <span className="font-mono text-3xl font-bold tracking-[0.12em]">{item.plate.toUpperCase()}</span>
                  </div>
                  <p className="mt-3 text-[0.9375rem]">{item.meaning}</p>
                  {item.category && <p className="mt-1 text-sm text-muted-foreground">{item.category}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {results && (
        <ProductPicks id="frames" title="Frames for your new plate" intro="Make sure a frame doesn't cover the state name, registration stickers or plate number: most states require them to be visible." items={FRAMES} />
      )}
      <Faq id="plate-faq" title="Questions about vanity plates" items={FAQS} />
    </ToolPage>
  );
};

export default PlateGenerator;
