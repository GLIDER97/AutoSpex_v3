// Mechanic search: nearby repair shops from Google Places API (New), with
// real ratings, review counts, phone numbers and opening status.
// GET /api/places?zip=90210&service=brakes
//
// Needs GOOGLE_MAPS_API_KEY (server-only, restricted to Places API (New)).
// Without it the endpoint answers 503 with a free Google Maps search link,
// which the page shows instead. Results are cached by Vercel's CDN for 30
// minutes per ZIP and service (short enough to keep "open now" accurate), so
// repeat searches in that window cost nothing.
import { clientIp, createRateLimiter, isAllowedOrigin, json } from './_shared.js';

export const SERVICES: Record<string, string> = {
  general: 'auto repair shop',
  diagnostics: 'auto repair check engine light diagnostics',
  brakes: 'brake repair shop',
  transmission: 'transmission repair shop',
  tires: 'tire shop',
  oil: 'oil change',
  ev: 'hybrid and electric car repair',
  body: 'auto body shop',
  wrap: 'car wrap shop',
};

// Only the fields the page shows (Google bills by the fields requested).
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.currentOpeningHours.openNow',
  'places.businessStatus',
].join(',');

const rateLimit = createRateLimiter();

export async function GET(request: Request): Promise<Response> {
  if (!isAllowedOrigin(request)) return json({ error: 'Forbidden' }, 403);

  const url = new URL(request.url);
  const zip = url.searchParams.get('zip') ?? '';
  const service = url.searchParams.get('service') ?? 'general';
  if (!/^\d{5}$/.test(zip)) return json({ error: 'Enter a 5-digit US ZIP code.' }, 400);
  if (!Object.hasOwn(SERVICES, service)) return json({ error: 'Unknown service.' }, 400);

  const query = `${SERVICES[service]} near ${zip}, USA`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const retryAfter = rateLimit(clientIp(request), [
    { windowMs: 60_000, max: 10 },
    { windowMs: 60 * 60_000, max: 60 },
  ]);
  if (retryAfter > 0) return json({ error: 'Too many searches. Please wait a minute.', mapsUrl }, 429, { 'Retry-After': String(retryAfter) });

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return json({ error: 'not_configured', mapsUrl }, 503);

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELD_MASK },
      body: JSON.stringify({ textQuery: query, pageSize: 9, languageCode: 'en', regionCode: 'US' }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('api/places: Google Places error', res.status, JSON.stringify(body?.error ?? body).slice(0, 300));
      return json({ error: 'Shop search is unavailable right now.', mapsUrl }, 502);
    }
    const shops = (Array.isArray(body?.places) ? body.places : [])
      .filter((p: any) => p?.businessStatus !== 'CLOSED_PERMANENTLY')
      .map((p: any) => ({
        id: String(p.id ?? ''),
        name: String(p.displayName?.text ?? 'Repair shop'),
        address: String(p.formattedAddress ?? ''),
        rating: typeof p.rating === 'number' ? p.rating : null,
        reviews: typeof p.userRatingCount === 'number' ? p.userRatingCount : 0,
        phone: p.nationalPhoneNumber ? String(p.nationalPhoneNumber) : null,
        website: typeof p.websiteUri === 'string' && /^https?:\/\//.test(p.websiteUri) ? p.websiteUri : null,
        mapsUrl: typeof p.googleMapsUri === 'string' ? p.googleMapsUri : null,
        openNow: typeof p.currentOpeningHours?.openNow === 'boolean' ? p.currentOpeningHours.openNow : null,
        temporarilyClosed: p.businessStatus === 'CLOSED_TEMPORARILY',
      }));
    return json({ shops, mapsUrl }, 200, { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600' });
  } catch (err) {
    console.error('api/places: request failed', err instanceof Error ? err.message : err);
    return json({ error: 'Shop search is unavailable right now.', mapsUrl }, 502);
  }
}
