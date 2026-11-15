// Single source of truth for SEO metadata.
// Used by the client (document head updates on navigation) and by
// scripts/prerender.mjs (static HTML, sitemap.xml and robots.txt at build time).

export const SITE_URL = 'https://www.myautospex.com';
export const SITE_NAME = 'MyAutoSpex';

export interface PageMeta {
  path: string;
  /** Page title without the " | MyAutoSpex" suffix. */
  title: string;
  description: string;
  /** Use the title as-is (no brand suffix). */
  rawTitle?: boolean;
  /** Keep the page out of the sitemap and search results. */
  noindex?: boolean;
  /** Sitemap priority, 0.0 to 1.0. */
  priority?: number;
}

export const STATIC_PAGES: PageMeta[] = [
  {
    path: '/',
    title: 'Free OBD2 Code Decoder, VIN Lookup & Car Tools',
    description:
      'Free car tools: decode check engine light codes, look up VIN specs, check recalls, audit repair quotes and estimate insurance, MPG and ownership costs.',
    priority: 1.0,
  },
  {
    path: '/fault-code-decoder',
    title: 'OBD-II Fault Code Decoder & Repair Cost Guide',
    description:
      'Translate check engine light (OBD-II) codes into plain English. Get the severity, likely causes, DIY fixes and estimated repair costs for your vehicle.',
    priority: 0.9,
  },
  {
    path: '/vin-lookup',
    title: 'Free VIN Decoder & Vehicle Specs Lookup',
    description:
      'Decode any 17-digit VIN for free. See the make, model, year, engine, trim and factory specs, plus what to check before you buy a used car.',
    priority: 0.9,
  },
  {
    path: '/recalls',
    title: 'Vehicle Recalls & Safety Alerts (NHTSA Data)',
    description:
      'Check for open safety recalls and manufacturer alerts on your car using official NHTSA data, and learn what to do next.',
    priority: 0.8,
  },
  {
    path: '/maintenance-validator',
    title: 'Car Repair Quote Checker: Are You Overcharged?',
    description:
      "Check a mechanic's repair quote against fair price ranges for parts and labor, and find out if you are being overcharged before you pay.",
    priority: 0.8,
  },
  {
    path: '/insurance-estimator',
    title: 'Car Insurance Cost Estimator (US)',
    description:
      'Estimate a fair monthly car insurance premium for your vehicle, age, ZIP code and driving record, and see which factors raise or lower your rate.',
    priority: 0.8,
  },
  {
    path: '/mpg-calculator',
    title: 'MPG Calculator & Fuel Cost Analyzer',
    description:
      'Calculate your real MPG, fuel cost per mile and the true daily cost of your commute, with practical tips to cut what you spend on gas.',
    priority: 0.8,
  },
  {
    path: '/affordability-predictor',
    title: 'Car Affordability Calculator & Price Predictor',
    description:
      'Find out how much car you can really afford. Estimate the out-the-door price, monthly payment and total loan cost before you visit the dealer.',
    priority: 0.8,
  },
  {
    path: '/value-shock-calculator',
    title: 'Car Depreciation Calculator: Resale Value Check',
    description:
      'See how fast your car is losing value per day, month and year, and estimate what it will be worth when you sell it or trade it in.',
    priority: 0.8,
  },
  {
    path: '/ownership-calculator',
    title: 'Total Cost of Car Ownership (TCO) Calculator',
    description:
      'Estimate the 5-year cost of owning a car: depreciation, fuel, insurance, maintenance, repairs and financing, all in one report.',
    priority: 0.8,
  },
  {
    path: '/plate-generator',
    title: 'AI Vanity License Plate Generator',
    description:
      "Generate clever vanity license plate ideas for your car with AI, based on your model, your personality and your state's character limits.",
    priority: 0.7,
  },
  {
    path: '/wrap-designer',
    title: 'Car Wrap Visualizer: See a Wrap on Your Own Car',
    description:
      'Upload a photo of your car and preview any wrap color and finish on it, with a before and after view, typical 2026 prices and wrap shops near you.',
    priority: 0.7,
  },
  {
    path: '/mechanic-finder',
    title: 'Find Trusted Local Mechanics Near You',
    description:
      'Repair shops near your ZIP code with Google ratings, review counts, open-now status and phone numbers, plus the questions to ask before you book.',
    priority: 0.7,
  },
  {
    path: '/coupons',
    title: 'Car Service Coupons & Maintenance Deals',
    description:
      'Find current savings on oil changes, brakes, tires and diagnostics from national service networks in your area.',
    priority: 0.6,
  },
  {
    path: '/diy-toolkits',
    title: 'DIY Car Repair Guides & Essential Toolkits',
    description:
      'Do-it-yourself car fixes with the exact tools and parts you need, from OBD-II scanners to roadside safety essentials.',
    priority: 0.7,
  },
  {
    path: '/blog',
    title: 'Car Repair Guides & Ownership Articles',
    description:
      'Practical guides on check engine lights, OBD-II codes, used-car VIN checks, insurance, depreciation and saving money on car repairs.',
    priority: 0.9,
  },
  {
    path: '/about',
    title: 'About MyAutoSpex: Free Tools for Drivers',
    rawTitle: true,
    description:
      'MyAutoSpex builds free tools that help drivers understand fault codes, vehicle specs, repair quotes and the true cost of owning a car.',
    priority: 0.4,
  },
  {
    path: '/contact',
    title: 'Contact MyAutoSpex',
    description: 'Get in touch with the MyAutoSpex team with questions, feedback or partnership requests.',
    priority: 0.3,
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'How MyAutoSpex collects, uses and protects your information.',
    priority: 0.2,
  },
  {
    path: '/terms-of-service',
    title: 'Terms of Service',
    description: 'The terms that apply when you use MyAutoSpex tools and content.',
    priority: 0.2,
  },
  {
    path: '/cookie-policy',
    title: 'Cookie Policy',
    description: 'How MyAutoSpex uses cookies and similar technologies.',
    priority: 0.2,
  },
];

export const NOT_FOUND_META: PageMeta = {
  path: '/404',
  title: 'Page Not Found',
  description: 'The page you were looking for does not exist.',
  noindex: true,
};

export function findStaticPage(pathname: string): PageMeta | undefined {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return STATIC_PAGES.find((p) => p.path === clean);
}

export function formatTitle(title: string, rawTitle?: boolean): string {
  return rawTitle ? title : `${title} | ${SITE_NAME}`;
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return SITE_URL + (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
}
