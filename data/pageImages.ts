// One studio photo per page, made to docs/IMAGE-STYLE.md (style 1: studio catalog, style 2: brand color-block).
// Files are 16:9 in public/images/pages/: <file>-1200.webp (1200x675) and <file>-640.webp (640x360) for the page, and
// <file>-share.jpg (1200x675) for social share previews, since some apps don't show WebP there.
// Articles keep their own images (owner's call, 21 Nov 2026), so they are not listed here.
// scripts/prerender.mjs also uses these as each page's share image (og:image).

export interface PageImage {
  file: string;
  /** Describes what the photo shows, for screen readers and image search. */
  alt: string;
}

export const PAGE_IMAGE_WIDTH = 1200;
export const PAGE_IMAGE_HEIGHT = 675;

export const PAGE_IMAGES: Record<string, PageImage> = {
  // Tools
  '/fault-code-decoder': { file: 'fault-code-decoder', alt: 'A handheld OBD2 code scanner with its cable and 16-pin plug' },
  '/vin-lookup': { file: 'vin-lookup', alt: 'A car key fob with a blank key tag beside a brass magnifying glass' },
  '/recalls': { file: 'recalls', alt: 'A red emergency warning triangle next to a plain cardboard parts box' },
  '/maintenance-validator': { file: 'maintenance-validator', alt: 'A clipboard with blank paper, a pen and a socket wrench' },
  '/insurance-estimator': { file: 'insurance-estimator', alt: 'A closed black umbrella standing beside a car key fob' },
  '/mpg-calculator': { file: 'mpg-calculator', alt: 'A fuel pump nozzle with its curved black hose' },
  '/affordability-predictor': { file: 'affordability-predictor', alt: 'A grey piggy bank with a car key fob beside it' },
  '/value-shock-calculator': { file: 'value-shock-calculator', alt: 'An hourglass with running sand next to a car key fob' },
  '/ownership-calculator': { file: 'ownership-calculator', alt: 'A fuel nozzle, a bottle of motor oil, a tire and a car key' },
  '/plate-generator': { file: 'plate-generator', alt: 'A blank aluminum license plate with mounting screws and a screwdriver' },
  '/wrap-designer': { file: 'wrap-designer', alt: 'Rolls of blue, black and orange vinyl car wrap film with a squeegee' },
  '/mechanic-finder': { file: 'mechanic-finder', alt: 'A chrome ratchet and a set of combination wrenches' },
  '/coupons': { file: 'coupons', alt: 'Wiper blades, an engine air filter and a bottle of motor oil with a blank tag' },
  '/diy-toolkits': { file: 'diy-toolkits', alt: 'A car maintenance kit: a socket set, a ratchet, an oil filter wrench, a funnel and gloves' },
  // Check engine code guides
  '/codes': { file: 'codes', alt: 'An oxygen sensor, a mass airflow sensor, an ignition coil and a spark plug' },
  '/codes/p0300': { file: 'code-p0300', alt: 'Four new spark plugs in front of ignition coil packs' },
  '/codes/p0171': { file: 'code-p0171', alt: 'A mass airflow sensor next to a cracked rubber vacuum hose' },
  '/codes/p0128': { file: 'code-p0128', alt: 'An engine thermostat with its gasket beside a coolant temperature sensor' },
  // Site pages. /codes/p0455, /codes/p0442, /about, /editorial-policy and /contact get theirs once the OpenRouter
  // balance is topped up (docs/owner-requests.md).
  '/404': { file: 'not-found', alt: 'A single orange traffic cone' },
};

export function pageImageSrc(file: string, width: 640 | 1200): string {
  return `/images/pages/${file}-${width}.webp`;
}

export function pageShareImageSrc(file: string): string {
  return `/images/pages/${file}-share.jpg`;
}

/** The image for a route path such as "/codes/P0300/", if it has one. */
export function pageImageFor(path: string): PageImage | undefined {
  const key = path.toLowerCase().replace(/\/+$/, '') || '/';
  return PAGE_IMAGES[key];
}
