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
    title: 'MyAutoSpex: Free OBD2 Code Decoder, VIN Lookup & Car Cost Tools',
    rawTitle: true,
    description:
      'Free car tools for drivers: decode check engine light codes, look up VIN specs, check recalls, audit repair quotes and estimate insurance, MPG and ownership costs.',
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
    title: 'Car Recall Check by VIN or Model',
    description:
      'Check safety recalls for your car by VIN or year, make and model with NHTSA data: do-not-drive warnings first, the free fix, and what to tell the dealer.',
    priority: 0.8,
  },
  {
    path: '/maintenance-validator',
    title: 'Car Repair Quote Checker: Are You Being Overcharged?',
    description:
      "Check a mechanic's repair quote against fair price ranges for parts and labor, and find out if you are being overcharged before you pay.",
    priority: 0.8,
  },
  {
    path: '/insurance-estimator',
    title: 'Car Insurance Cost Estimator (US)',
    description:
      'Estimate a fair monthly car insurance premium for your state, age, record, credit and car, see exactly why, and which changes save the most.',
    priority: 0.8,
  },
  {
    path: '/mpg-calculator',
    title: 'Fuel Cost & MPG Calculator',
    description:
      'Trip and monthly gas costs using your car’s official EPA rating, a check of whether your real MPG is normal and what the gap costs, and two cars compared.',
    priority: 0.8,
  },
  {
    path: '/affordability-predictor',
    title: 'Car Affordability Calculator & True Price Predictor',
    description:
      'Find out how much car you can really afford. Estimate the out-the-door price, monthly payment and total loan cost before you visit the dealer.',
    priority: 0.8,
  },
  {
    path: '/value-shock-calculator',
    title: "What's My Car Worth? Value & Depreciation Calculator",
    description:
      'Your car’s private-sale, trade-in and dealer value today, what it loses per day, its value over the next five years and the best time to sell.',
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
    title: 'Vanity Plate Ideas Generator',
    description:
      "Clever personalized plate ideas that fit your state's character limit, with a plate preview, a misread check, a DMV rejection flag and an availability link.",
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
    title: 'Car Service Prices & Coupons',
    description:
      'Fair prices for oil changes, brakes, batteries and other service in your state, the upsells to skip, and where to find real coupons.',
    priority: 0.6,
  },
  {
    path: '/diy-toolkits',
    title: 'DIY Car Repair Planner',
    description:
      'How hard common car jobs are, how long they take, what you save over a shop, the tools you need and when to call a pro.',
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
    title: 'About Us',
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
