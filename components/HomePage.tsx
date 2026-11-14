import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'motion/react';
import { cn } from '@/lib/utils';
import type { OBDCodeData } from '../types';
import { CATEGORY_BY_ID, TOOL_CATEGORIES, type Tool } from '../data/tools';
import { SignMarker } from './brand';

// Same format the fault code decoder accepts: P, B, C or U plus four or more hex digits.
const CODE_PATTERN = /^[PCBU][0-9A-F]{4,}$/;
const COMMON_CODES = ['P0420', 'P0300', 'P0171', 'P0455', 'P0128'];

const decoderLink = (code: string) => `/fault-code-decoder?code=${encodeURIComponent(code)}`;

// "Safe to Drive" -> "Safe to drive"; "$800 - $2500" -> "$800 to $2,500".
const sentenceCase = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();
const formatCost = (text: string) =>
  text.replace(/\d{4,}/g, (n) => Number(n).toLocaleString('en-US')).replace(/\s*-\s*/g, ' to ');

const focusRing = 'outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring';

// ---------------------------------------------------------------------------
// Hero: the check engine code lookup, set on a green guide sign.
// ---------------------------------------------------------------------------

function CodeLookup() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [codes, setCodes] = useState<Record<string, OBDCodeData> | null>(null);
  const loading = useRef(false);

  // The built-in code list loads only once someone starts typing.
  const loadCodes = () => {
    if (codes || loading.current) return;
    loading.current = true;
    import('../data/obdCodes').then((mod) => setCodes(mod.INITIAL_OBD_DATABASE));
  };

  const code = value.replace(/\s+/g, '').toUpperCase();
  const known = codes?.[code];
  const complete = code.length >= 5;
  const valid = CODE_PATTERN.test(code);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) navigate(decoderLink(code));
  };

  let preview: React.ReactNode = null;
  let previewKey = 'none';
  if (complete && !valid) {
    previewKey = 'invalid';
    preview = <p>Codes start with P, B, C or U, then four characters. For example: P0420.</p>;
  } else if (known) {
    previewKey = code;
    preview = (
      <div className="flex gap-3">
        <span className="h-fit rounded-md bg-white px-2 py-0.5 font-mono text-sm font-semibold text-sign-green">{code}</span>
        <div>
          <p className="font-bold text-white">{known.title}</p>
          <p className="mt-0.5">
            {known.severity} severity. {sentenceCase(known.safetyStatus)}. Typical repair {formatCost(known.repairCostEstimate)}.
          </p>
        </div>
      </div>
    );
  } else if (valid && codes) {
    previewKey = 'lookup';
    preview = <p>Press Decode for the full explanation of {code}.</p>;
  }

  return (
    <div>
      <form onSubmit={submit} className="max-w-xl">
        <label htmlFor="obd-code" className="mb-2 block text-[0.9375rem] font-semibold text-white">
          Code from your scanner
        </label>
        <div className="flex gap-2">
          <input
            id="obd-code"
            name="code"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            onFocus={loadCodes}
            placeholder="P0420"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={10}
            aria-describedby="obd-code-preview"
            className="h-14 w-0 min-w-0 flex-1 rounded-lg bg-white px-4 font-mono text-xl font-semibold tracking-[0.08em] text-sign-ink placeholder:text-slate-400 outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sign-yellow"
          />
          <button
            type="submit"
            className="h-14 shrink-0 cursor-pointer rounded-lg bg-sign-yellow px-6 text-lg font-extrabold text-sign-ink transition-colors hover:bg-[#ffd83d] outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Decode
          </button>
        </div>
        <div id="obd-code-preview" aria-live="polite" className="text-[0.9375rem] leading-normal text-white">
          <AnimatePresence initial={false} mode="popLayout">
            {preview && (
              <m.div
                key={previewKey}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4">{preview}</div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </form>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[0.9375rem] text-white">Common codes:</span>
        {COMMON_CODES.map((c) => (
          <Link
            key={c}
            to={decoderLink(c)}
            className="rounded-md border border-white/70 px-2.5 py-1 font-mono text-[0.9375rem] font-semibold text-white transition-colors hover:bg-white hover:text-sign-green outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sign-yellow"
          >
            {c}
          </Link>
        ))}
      </div>
    </div>
  );
}

// The other jobs people most often arrive with.
const OTHER_START_POINTS: { tool: Tool; category: keyof typeof CATEGORY_BY_ID }[] = [
  { tool: CATEGORY_BY_ID.money.tools[0], category: 'money' }, // repair quote checker
  { tool: CATEGORY_BY_ID.warnings.tools[1], category: 'warnings' }, // recall check
  { tool: CATEGORY_BY_ID.warnings.tools[2], category: 'warnings' }, // VIN decoder
];

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        {/* The guide sign: green panel, white inset border, rounded corners. */}
        <div className="min-w-0 rounded-[1.375rem] bg-sign-green p-1.5 lg:col-span-8">
          <div className="sign-inset rounded-2xl px-6 py-9 sm:px-10 sm:py-12">
            <h1
              id="hero-title"
              className="text-balance font-heading text-[2.75rem] leading-[1.02] font-extrabold tracking-[-0.02em] text-white sm:text-[3.5rem] lg:text-[4rem]"
            >
              Check engine light on?
            </h1>
            <p className="mt-5 max-w-[52ch] text-lg leading-normal text-white sm:text-[1.1875rem]">
              Type the code from your scanner to find out what it means, how serious it is and what the repair should
              cost. Free, and no account needed.
            </p>
            <div className="mt-8">
              <CodeLookup />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center lg:col-span-4">
          <h2 className="font-heading text-2xl font-extrabold tracking-[-0.01em]">Not a warning light?</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {OTHER_START_POINTS.map(({ tool, category }) => (
              <li key={tool.path}>
                <Link to={tool.path} className={cn('group flex gap-3 py-4 hover:bg-muted/60', focusRing)}>
                  <SignMarker category={category} className="mt-0.5" />
                  <span>
                    <span className="block text-[1.0625rem] font-bold group-hover:underline group-hover:underline-offset-4">
                      {tool.name}
                    </span>
                    <span className="mt-0.5 block text-[0.9375rem] leading-snug text-muted-foreground">{tool.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Every tool, grouped by sign color.
// ---------------------------------------------------------------------------

function ToolGroup({ categoryId }: { categoryId: keyof typeof CATEGORY_BY_ID }) {
  const category = CATEGORY_BY_ID[categoryId];
  return (
    <div>
      <h3 className="flex items-center gap-2.5 text-lg font-extrabold">
        <SignMarker category={category.id} />
        {category.name}
      </h3>
      <ul className="mt-3 border-t border-border">
        {category.tools.map(({ name, path, description, icon: Icon }) => (
          <li key={path} className="border-b border-border">
            <Link to={path} className={cn('group flex items-start gap-4 px-1 py-4 hover:bg-muted/60', focusRing)}>
              <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>
                <span className="block text-[1.0625rem] font-bold group-hover:underline group-hover:underline-offset-4">
                  {name}
                </span>
                <span className="mt-0.5 block text-[0.9375rem] leading-snug text-muted-foreground">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToolDirectory() {
  const toolCount = TOOL_CATEGORIES.reduce((n, c) => n + c.tools.length, 0);
  return (
    <section aria-labelledby="tools-title" className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 id="tools-title" className="font-heading text-[2rem] leading-tight font-extrabold tracking-[-0.015em] sm:text-4xl">
            All {toolCount} tools
          </h2>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">
            Color-coded like road signs: yellow for warnings, green for money decisions, blue for help nearby and brown
            for fun.
          </p>
        </div>
        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-12">
            <ToolGroup categoryId="warnings" />
            <ToolGroup categoryId="services" />
          </div>
          <div className="space-y-12">
            <ToolGroup categoryId="money" />
            <ToolGroup categoryId="fun" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Where the answers come from.
// ---------------------------------------------------------------------------

const SOURCES = [
  { label: 'Recalls', detail: "NHTSA's official recall database, searched live." },
  { label: 'VIN details', detail: "NHTSA's vehicle database (vPIC)." },
  { label: 'Fuel economy', detail: 'Official EPA ratings from fueleconomy.gov.' },
  {
    label: 'Code explanations and price estimates',
    detail: "Written by Google's Gemini AI. Use them to prepare for the shop, not as a quote.",
  },
  {
    label: 'Your contact details',
    detail: 'No account needed. We only share your details with a partner if you send a quote form.',
  },
];

function Sources() {
  return (
    <section aria-labelledby="sources-title" className="border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <h2 id="sources-title" className="font-heading text-[2rem] leading-tight font-extrabold tracking-[-0.015em] sm:text-4xl">
            Where the answers come from
          </h2>
          <p className="mt-3 max-w-[46ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
            Some answers are official US government data. Others are AI estimates. Here is which is which.
          </p>
        </div>
        <dl className="border-t border-border lg:col-span-7">
          {SOURCES.map((s) => (
            <div key={s.label} className="grid gap-1 border-b border-border py-4 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-6">
              <dt className="font-bold">{s.label}</dt>
              <dd className="text-muted-foreground">{s.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Latest guides (only each article's `meta` export is loaded here).
// ---------------------------------------------------------------------------

interface ArticleMeta {
  title: string;
  description?: string;
  date?: string;
}

const articleMeta = import.meta.glob<ArticleMeta>('../Article/posts/*.tsx', { eager: true, import: 'meta' });

const LATEST_ARTICLES = Object.entries(articleMeta)
  .filter(([, meta]) => meta?.title)
  .map(([path, meta]) => ({
    slug: path.split('/').pop()!.replace(/\.tsx$/, ''),
    title: meta.title,
    description: meta.description ?? '',
    date: meta.date ? new Date(meta.date) : null,
  }))
  .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
  .slice(0, 3);

function LatestGuides() {
  return (
    <section aria-labelledby="guides-title" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="guides-title" className="font-heading text-[2rem] leading-tight font-extrabold tracking-[-0.015em] sm:text-4xl">
            Latest guides
          </h2>
          <Link to="/blog" className={cn('rounded-sm font-bold text-sign-green underline underline-offset-4 dark:text-white', focusRing)}>
            All articles
          </Link>
        </div>
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {LATEST_ARTICLES.map((a) => (
            <li key={a.slug} className="border-t border-border pt-4">
              {a.date && (
                <time dateTime={a.date.toISOString()} className="text-sm text-muted-foreground">
                  {a.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                </time>
              )}
              <h3 className="mt-1 text-[1.1875rem] leading-snug font-extrabold">
                <Link to={`/article/${a.slug}`} className={cn('rounded-sm hover:underline hover:underline-offset-4', focusRing)}>
                  {a.title}
                </Link>
              </h3>
              <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{a.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const HomePage: React.FC = () => (
  <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <Hero />
      <ToolDirectory />
      <Sources />
      <LatestGuides />
    </MotionConfig>
  </LazyMotion>
);

export default HomePage;
