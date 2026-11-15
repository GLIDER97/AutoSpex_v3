// Browser client for /api/places (api/places.ts): repair and wrap shops near a
// ZIP code from Google Places, with a Google Maps search link as the fallback.

export interface Shop {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  reviews: number;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  openNow: boolean | null;
  temporarilyClosed: boolean;
}

/** Service ids the server understands (api/places.ts SERVICES), with page labels. */
export const REPAIR_SERVICES = [
  { id: 'general', label: 'General repair' },
  { id: 'diagnostics', label: 'Check engine light and diagnostics' },
  { id: 'brakes', label: 'Brakes' },
  { id: 'transmission', label: 'Transmission' },
  { id: 'tires', label: 'Tires and alignment' },
  { id: 'oil', label: 'Oil change and maintenance' },
  { id: 'ev', label: 'Hybrid and electric cars' },
  { id: 'body', label: 'Body work and collision' },
] as const;

export type ShopService = (typeof REPAIR_SERVICES)[number]['id'] | 'wrap';

export interface ShopSearch {
  shops: Shop[];
  /** The same search on Google Maps. */
  mapsUrl: string;
  /** True when the site has no Places key yet: show the Maps link instead. */
  unavailable: boolean;
  error?: string;
}

const mapsSearch = (service: string, zip: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${service} near ${zip}`)}`;

export async function searchShops(zip: string, service: ShopService): Promise<ShopSearch> {
  const fallback = mapsSearch(service === 'wrap' ? 'car wrap shop' : 'auto repair shop', zip);
  let res: Response;
  try {
    res = await fetch(`/api/places?zip=${encodeURIComponent(zip)}&service=${encodeURIComponent(service)}`);
  } catch {
    return { shops: [], mapsUrl: fallback, unavailable: true, error: 'Shop search could not be reached. Check your connection.' };
  }
  const body = await res.json().catch(() => null);
  const mapsUrl = typeof body?.mapsUrl === 'string' ? body.mapsUrl : fallback;
  if (res.ok && Array.isArray(body?.shops)) return { shops: body.shops, mapsUrl, unavailable: false };
  if (res.status === 400) return { shops: [], mapsUrl, unavailable: false, error: body?.error ?? 'Check the ZIP code.' };
  if (res.status === 503 && body?.error === 'not_configured') return { shops: [], mapsUrl, unavailable: true };
  return { shops: [], mapsUrl, unavailable: true, error: body?.error ?? 'Shop search is unavailable right now.' };
}

/**
 * Ranks by rating weighted by review count, so a 4.9 from 8 reviews doesn't
 * beat a 4.7 from 600 (Bayesian average toward a typical 4.3 over 25 reviews).
 */
export const weightedRating = (s: Shop) => (s.rating === null ? 0 : (s.rating * s.reviews + 4.3 * 25) / (s.reviews + 25));
