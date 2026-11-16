import React, { useEffect, useRef, useState } from 'react';
import { Download, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cleanName, imageDataUrl, runAiTool } from '../utils/ai';
import { searchShops, type ShopSearch } from '../utils/places';
import {
  CARE,
  COVERAGE,
  CUSTOM_COLOR,
  FINISHES,
  SIZES,
  choiceLabel,
  nearestAspect,
  preparePhoto,
  wrapCost,
  type CoverageId,
  type FinishId,
  type PreparedPhoto,
  type SizeId,
  type WrapColor,
} from '../utils/wrap';
import {
  Faq,
  FactList,
  Field,
  Notice,
  Panel,
  PanelTitle,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  ToolPage,
  VehicleFields,
  focusRing,
  inputClass,
  moneyRange,
  rememberZip,
  rememberedZip,
  type Vehicle,
} from './tool/kit';
import ShopResults from './tool/ShopResults';

interface Render {
  id: number;
  src: string;
  /** The photo it was made from (null when the car was drawn from its name). */
  before: PreparedPhoto | null;
  label: string;
}

const MAX_RENDERS = 6;

const swatchBackground = (finish: FinishId, color: WrapColor): React.CSSProperties => {
  const [a, b] = color.hex;
  if (b) return { background: `linear-gradient(135deg, ${a} 15%, ${b} 85%)` };
  if (finish === 'chrome') return { background: `linear-gradient(135deg, ${a} 0%, #ffffff 45%, ${a} 55%, #00000055 100%)`, backgroundColor: a };
  if (finish === 'carbon')
    return { background: `repeating-linear-gradient(45deg, ${a} 0 3px, #ffffff22 3px 4px), repeating-linear-gradient(-45deg, ${a} 0 3px, #00000033 3px 4px)`, backgroundColor: a };
  if (finish === 'metallic') return { background: `radial-gradient(circle at 30% 30%, #ffffff66, transparent 55%), ${a}` };
  if (finish === 'gloss') return { background: `radial-gradient(circle at 30% 25%, #ffffffaa 0 8%, transparent 30%), ${a}` };
  return { background: a };
};

/** Before/after comparison: drag (or use the arrow keys) to reveal the wrap. */
function CompareSlider({ before, after, label }: { before: PreparedPhoto; after: string; label: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div
      className="relative overflow-hidden rounded-lg bg-muted select-none has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring has-[input:focus-visible]:outline-solid"
      style={{ aspectRatio: `${before.width} / ${before.height}` }}
    >
      <img src={after} alt={`AI preview: ${label}`} className="absolute inset-0 size-full object-cover" />
      <img
        src={before.dataUrl}
        alt="Your photo before the wrap"
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 flex size-9 -translate-1/2 items-center justify-center rounded-full bg-white text-sm font-bold text-sign-ink shadow-md">
          ‹›
        </span>
      </div>
      <span className="pointer-events-none absolute top-2 left-2 rounded bg-black/65 px-2 py-0.5 text-xs font-bold text-white">Before</span>
      <span className="pointer-events-none absolute top-2 right-2 rounded bg-black/65 px-2 py-0.5 text-xs font-bold text-white">After</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
        aria-valuetext={`${pos}% before, ${100 - pos}% after`}
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

const BEFORE_YOU_WRAP: [string, string][] = [
  ['Check the paint first', 'Film sticks best to healthy factory paint. Over chips, peeling clear coat or a cheap respray it can lift, and removal can pull paint off.'],
  ['Ask for cast film by name', 'Premium cast film conforms to curves and lasts 5 to 7 years. Cheaper calendered film shrinks and cracks sooner.'],
  ['See a real sample in daylight', 'No screen or AI preview shows exactly how a film looks in the sun. Ask the shop for a swatch and hold it against your car.'],
  ['Ask about seams, jambs and warranty', 'Where will the seams be? Are door jambs included? How long is the install guaranteed against lifting and bubbles? 1 to 3 years is common.'],
  ['Check your state rules', 'Some states expect you to update the color on your registration after a full wrap, and some limit mirror-like chrome film. Check with your DMV.'],
  ['Leased car?', 'Wraps are usually fine on a lease and protect the paint, but have the film removed by a shop before you hand the car back.'],
];

const FAQS: [string, string][] = [
  [
    'Can I see the wrap on my own car?',
    'Yes. Upload a photo of your car and pick a film color, finish and coverage. The AI changes only the wrapped panels and keeps your car, wheels and background as they are.',
  ],
  [
    'How accurate is the preview?',
    "It's a realistic AI render, close enough to choose between colors and finishes. Small details such as reflections, badges or wheels can come out slightly different, so look at a physical film sample before you decide.",
  ],
  [
    'What happens to my photo?',
    "It's sent to our AI provider only to make your preview, and MyAutoSpex doesn't store it. Your previews stay in your browser until you leave the page.",
  ],
  [
    'How much does a car wrap cost?',
    'In 2026 a full color-change wrap from a professional shop typically costs $2,500 to $3,800 for a compact car, $3,000 to $4,500 for a midsize sedan and $3,800 to $6,000 for a large SUV or pickup. Color-shift film costs about a third more and chrome nearly twice as much. A roof or hood starts around $250.',
  ],
  [
    'Wrap or paint?',
    'A wrap costs less than a quality color-change paint job, comes off again and protects the original paint, which helps resale. Paint lasts longer: standard wrap films last 5 to 7 years, chrome 1 to 3.',
  ],
  ['How long does a wrap take?', 'A full wrap usually takes 2 to 5 days at a shop, including cleaning, removing handles and lights, and letting the film set. A roof or hood takes a few hours.'],
];

export default function WrapDesigner() {
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });

  const [coverage, setCoverage] = useState<CoverageId>('full');
  const [finish, setFinish] = useState<FinishId>('satin');
  const [color, setColor] = useState<WrapColor>(FINISHES[0].colors[3]);
  const [customHex, setCustomHex] = useState('#2f6f8f');

  const [renders, setRenders] = useState<Render[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const [size, setSize] = useState<SizeId>('sedan');
  const [zip, setZip] = useState('');
  const [shops, setShops] = useState<{ search: ShopSearch; zip: string } | null>(null);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLElement>(null);

  useEffect(() => setZip(rememberedZip()), []);

  const finishInfo = FINISHES.find((f) => f.id === finish)!;
  const standardFinish = finishInfo.colors === FINISHES[0].colors;
  const current = renders.find((r) => r.id === currentId) ?? null;
  const cost = wrapCost(coverage, finish, size);

  const chooseFinish = (id: FinishId) => {
    setFinish(id);
    const next = FINISHES.find((f) => f.id === id)!;
    if (!next.colors.some((c) => c.name === color.name) && !(color.name === 'Custom color' && next.colors === FINISHES[0].colors)) {
      setColor(next.colors[0]);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      setPhotoError('That file is not a photo. Use a JPEG or PNG.');
      return;
    }
    setPreparing(true);
    try {
      setPhoto(await preparePhoto(file));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "That photo couldn't be opened.");
    } finally {
      setPreparing(false);
    }
  };

  const render = async () => {
    const choice = { coverage, finish, color };
    setRendering(true);
    setRenderError(null);
    try {
      // Only the choices are sent; the server writes the image prompt.
      const hasCar = Boolean(vehicle.year && vehicle.make.trim() && vehicle.model.trim());
      const response = await runAiTool('wrap', {
        finish,
        color: color.name === CUSTOM_COLOR ? { name: CUSTOM_COLOR, hex: color.hex[0] } : { name: color.name },
        coverage,
        size,
        vehicle: !photo && hasCar ? { year: vehicle.year, make: cleanName(vehicle.make, 40), model: cleanName(vehicle.model, 60) } : undefined,
        ...(photo ? { photo: photo.base64, aspectRatio: nearestAspect(photo.width, photo.height) } : {}),
      });
      const src = imageDataUrl(response);
      if (!src) throw new Error('No picture came back. Please try again.');
      const next: Render = { id: Date.now(), src, before: photo, label: choiceLabel(choice) };
      setRenders((prev) => [next, ...prev].slice(0, MAX_RENDERS));
      setCurrentId(next.id);
      if (window.matchMedia('(max-width: 1023px)').matches) preview.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'The preview could not be made. Please try again.');
    } finally {
      setRendering(false);
    }
  };

  const findShops = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      setZipError('Enter a 5-digit US ZIP code.');
      return;
    }
    setZipError(null);
    rememberZip(zip);
    setShopsLoading(true);
    const search = await searchShops(zip, 'wrap');
    setShops({ search, zip });
    setShopsLoading(false);
  };

  const downloadName = (r: Render) =>
    `wrap-preview-${r.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.${r.src.startsWith('data:image/png') ? 'png' : r.src.startsWith('data:image/webp') ? 'webp' : 'jpg'}`;

  return (
    <ToolPage
      category="fun"
      title="See a wrap on your own car"
      intro="Upload a photo of your car, pick a film color, finish and coverage, and get a realistic preview with a before and after view. You'll also see what it costs for your size of car and find wrap shops near you."
      sources="AI image editing (Flux) for previews; typical 2026 US wrap shop prices for costs; Google Places for shops."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6">
          <Panel aria-labelledby="car-title">
            <PanelTitle>
              <span id="car-title">1. Your car</span>
            </PanelTitle>
            {photo ? (
              <div className="mt-4">
                <img src={photo.dataUrl} alt="Your car photo" className="w-full rounded-lg border border-border" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <SecondaryButton type="button" onClick={() => fileInput.current?.click()}>
                    <ImagePlus className="size-4" aria-hidden="true" />
                    Change photo
                  </SecondaryButton>
                  <SecondaryButton type="button" onClick={() => setPhoto(null)}>
                    <X className="size-4" aria-hidden="true" />
                    Remove
                  </SecondaryButton>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'mt-4 rounded-lg border-2 border-dashed border-input p-5 text-center transition-colors',
                  dragging && 'border-sign-green bg-sign-green/8',
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  onFile(e.dataTransfer.files?.[0]);
                }}
              >
                <PrimaryButton type="button" loading={preparing} onClick={() => fileInput.current?.click()}>
                  {!preparing && <ImagePlus className="size-5" aria-hidden="true" />}
                  Upload a photo of your car
                </PrimaryButton>
                <p className="mt-3 text-sm text-muted-foreground">or drop it here. Best: the whole car from the side or front corner, in daylight.</p>
              </div>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              tabIndex={-1}
              aria-label="Car photo"
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {photoError && (
              <Notice tone="error" className="mt-3">
                {photoError}
              </Notice>
            )}
            {!photo && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-3 text-[0.9375rem] font-semibold">No photo handy? We'll draw your model instead.</p>
                <VehicleFields value={vehicle} onChange={setVehicle} optionalLabel />
              </div>
            )}
            <p className="mt-4 text-sm text-muted-foreground">Your photo is used only to make the preview and isn't stored by MyAutoSpex.</p>
          </Panel>

          <Panel aria-labelledby="wrap-title">
            <PanelTitle>
              <span id="wrap-title">2. Your wrap</span>
            </PanelTitle>

            <fieldset className="mt-4">
              <legend className="mb-2 text-[0.9375rem] font-semibold">Coverage</legend>
              <div className="grid grid-cols-2 gap-2">
                {COVERAGE.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      'cursor-pointer rounded-lg border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
                      coverage === c.id ? 'border-sign-green bg-sign-green/8 ring-1 ring-sign-green' : 'border-input hover:bg-muted',
                    )}
                  >
                    <input type="radio" name="coverage" value={c.id} checked={coverage === c.id} onChange={() => setCoverage(c.id)} className="sr-only" />
                    <span className="block font-bold">{c.label}</span>
                    <span className="block text-sm text-muted-foreground">{c.detail}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="mb-2 text-[0.9375rem] font-semibold">Finish</legend>
              <div className="flex flex-wrap gap-2">
                {FINISHES.map((f) => (
                  <label
                    key={f.id}
                    className={cn(
                      'cursor-pointer rounded-full border px-3.5 py-1.5 text-[0.9375rem] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
                      finish === f.id ? 'border-foreground bg-foreground text-background' : 'border-input hover:bg-muted',
                    )}
                  >
                    <input type="radio" name="finish" value={f.id} checked={finish === f.id} onChange={() => chooseFinish(f.id)} className="sr-only" />
                    {f.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="mb-2 text-[0.9375rem] font-semibold">
                Color: <span className="font-normal">{color.name === 'Custom color' ? `custom ${color.hex[0]}` : color.name}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {finishInfo.colors.map((c) => (
                  <label
                    key={c.name}
                    title={c.name}
                    className={cn(
                      'size-10 cursor-pointer rounded-full border border-black/15 transition-transform hover:scale-105 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid dark:border-white/25',
                      color.name === c.name && 'ring-2 ring-foreground ring-offset-2 ring-offset-card',
                    )}
                    style={swatchBackground(finish, c)}
                  >
                    <input type="radio" name="color" checked={color.name === c.name} onChange={() => setColor(c)} className="sr-only" />
                    <span className="sr-only">{c.name}</span>
                  </label>
                ))}
                {standardFinish && (
                  <label
                    title="Custom color"
                    className={cn(
                      'relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-black/15 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid dark:border-white/25',
                      color.name === 'Custom color' && 'ring-2 ring-foreground ring-offset-2 ring-offset-card',
                    )}
                    style={{ background: color.name === 'Custom color' ? customHex : 'conic-gradient(#e53935, #fdd835, #43a047, #1e88e5, #8e24aa, #e53935)' }}
                  >
                    <input
                      type="color"
                      value={customHex}
                      onChange={(e) => {
                        setCustomHex(e.target.value);
                        setColor({ name: 'Custom color', hex: [e.target.value] });
                      }}
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                    />
                    <span className="sr-only">Custom color</span>
                  </label>
                )}
              </div>
            </fieldset>

            <PrimaryButton type="button" className="mt-5 w-full" loading={rendering} onClick={render}>
              {photo ? 'Show it on my car' : 'Draw my wrap'}
            </PrimaryButton>
            {renderError && (
              <Notice tone="error" className="mt-3">
                {renderError}
              </Notice>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel aria-labelledby="preview-title" ref={preview as React.Ref<HTMLElement>} className="scroll-mt-24">
            <PanelTitle>
              <span id="preview-title">Preview</span>
            </PanelTitle>
            <div className="mt-4" aria-busy={rendering}>
              {current ? (
                current.before ? (
                  <CompareSlider key={current.id} before={current.before} after={current.src} label={current.label} />
                ) : (
                  <img src={current.src} alt={`AI preview: ${current.label}`} className="w-full rounded-lg" />
                )
              ) : photo ? (
                <img src={photo.dataUrl} alt="Your car before the wrap" className="w-full rounded-lg" />
              ) : (
                <div className="flex aspect-[3/2] items-center justify-center rounded-lg border-2 border-dashed border-input p-6 text-center text-muted-foreground">
                  Upload a photo of your car, choose a wrap and your preview appears here.
                </div>
              )}
              {rendering && (
                <div className="mt-3">
                  <Spinner label={photo ? 'Wrapping your car… this usually takes 10 to 20 seconds.' : 'Drawing your car… this usually takes 10 to 20 seconds.'} />
                </div>
              )}
            </div>
            {current && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">{current.label}</p>
                <a
                  href={current.src}
                  download={downloadName(current)}
                  className={cn(
                    'inline-flex h-10 items-center gap-1.5 rounded-lg border border-input bg-card px-3 text-[0.9375rem] font-semibold hover:bg-muted',
                    focusRing,
                  )}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download
                </a>
              </div>
            )}
            {renders.length > 1 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-muted-foreground">Your previews</p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {renders.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={r.id === currentId}
                      aria-label={`Show ${r.label}`}
                      onClick={() => setCurrentId(r.id)}
                      className={cn(
                        'shrink-0 cursor-pointer overflow-hidden rounded-md border-2',
                        r.id === currentId ? 'border-foreground' : 'border-transparent opacity-80 hover:opacity-100',
                        focusRing,
                      )}
                    >
                      <img src={r.src} alt="" className="h-14 w-20 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {current && (
              <p className="mt-4 text-sm text-muted-foreground">
                AI preview: small details can differ from your car, and no screen matches real film in sunlight. Ask a shop for a sample before you decide.
              </p>
            )}
          </Panel>

          <Panel aria-labelledby="cost-title">
            <PanelTitle>
              <span id="cost-title">What it costs</span>
            </PanelTitle>
            <Field label="Vehicle size" htmlFor="wrap-size" className="mt-4 max-w-xs">
              <select id="wrap-size" value={size} onChange={(e) => setSize(e.target.value as SizeId)} className={inputClass}>
                {SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <p className="mt-5 text-[0.9375rem] text-muted-foreground">
              {COVERAGE.find((c) => c.id === coverage)!.label} in {finishInfo.label.toLowerCase()} film, installed by a shop
            </p>
            <p className="font-heading text-3xl font-extrabold tracking-[-0.01em]" aria-live="polite">
              {moneyRange(cost.pro[0], cost.pro[1])}
            </p>
            <FactList
              className="mt-4"
              items={[
                ['Film needed', `${cost.yards[0] === cost.yards[1] ? cost.yards[0] : `${cost.yards[0]} to ${cost.yards[1]}`} yards of 60-inch film`],
                ['Film only, to do it yourself', moneyRange(cost.film[0], cost.film[1])],
                ['Lasts', `${cost.years[0]} to ${cost.years[1]} years outdoors`],
                ...(coverage === 'full'
                  ? ([
                      ['Door jambs', 'Add $500 to $1,500 to wrap them too'],
                      ['Paint instead', 'A quality color-change paint job: $5,000 to $10,000 or more'],
                    ] as [string, string][])
                  : []),
                ['Care', CARE[finish]],
              ]}
            />
            <p className="mt-4 text-sm text-muted-foreground">Typical 2026 US prices for premium cast film. Prices vary by area and shop, so get two or three quotes.</p>
          </Panel>
        </div>
      </div>

      <Panel aria-labelledby="shops-title" className="mt-6">
        <PanelTitle>
          <span id="shops-title">Find wrap shops near you</span>
        </PanelTitle>
        <form noValidate onSubmit={findShops} className="mt-4 flex max-w-md items-end gap-3">
          <Field label="ZIP code" htmlFor="wrap-zip" className="flex-1">
            <input
              id="wrap-zip"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="e.g. 78701"
              aria-invalid={zipError ? true : undefined}
              aria-describedby={zipError ? 'wrap-zip-error' : undefined}
              className={inputClass}
            />
          </Field>
          <PrimaryButton type="submit" loading={shopsLoading}>
            Find shops
          </PrimaryButton>
        </form>
        {zipError && (
          <p id="wrap-zip-error" role="alert" className="mt-3 text-[0.9375rem] font-semibold text-sign-red dark:text-red-300">
            {zipError}
          </p>
        )}
        {shops && (
          <div className={cn('mt-5', shopsLoading && 'opacity-60')}>
            <ShopResults result={shops.search} what="wrap shops" zip={shops.zip} />
          </div>
        )}
      </Panel>

      <Panel aria-labelledby="before-title" className="mt-6">
        <PanelTitle>
          <span id="before-title">Before you wrap</span>
        </PanelTitle>
        <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
          {BEFORE_YOU_WRAP.map(([title, text]) => (
            <li key={title} className="text-[0.9375rem] leading-relaxed">
              <strong>{title}.</strong> <span className="text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Faq id="wrap-faq" title="Questions about car wraps" items={FAQS} />
    </ToolPage>
  );
}
