// Helpers shared by the server functions in api/. Files starting with "_" are
// not deployed as endpoints of their own.

export class BadRequest extends Error {}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function onlyKeys(value: Record<string, unknown>, allowed: string[], label: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new BadRequest(`${label}.${key} is not allowed`);
  }
}

// --- Origin check -----------------------------------------------------------

// Hosts allowed besides the host the site is served from (which covers
// production, Vercel previews and local dev). Add more with
// ALLOWED_ORIGINS="https://example.com,https://other.example".
const DEFAULT_ALLOWED_HOSTS = ['www.myautospex.com', 'myautospex.com'];

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** True for requests made by the site's own pages (stops other websites using our endpoints). */
export function isAllowedOrigin(request: Request): boolean {
  const callerHost = hostOf(request.headers.get('origin')) ?? hostOf(request.headers.get('referer'));
  if (!callerHost) {
    // Same-origin GET requests may carry neither header; browsers still send Sec-Fetch-Site.
    return request.headers.get('sec-fetch-site') === 'same-origin';
  }
  const servedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (callerHost === servedHost) return true;
  const extra = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => hostOf(origin.trim()))
    .filter((host): host is string => Boolean(host));
  return [...DEFAULT_ALLOWED_HOSTS, ...extra].includes(callerHost);
}

// --- Rate limit -------------------------------------------------------------

export function clientIp(request: Request): string {
  return request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

/**
 * Per-IP fixed-window limiter, counted per function instance (in memory). A
 * speed bump rather than a hard quota: also cap spending at the API provider.
 * Returns the seconds to wait when a limit is exceeded, or 0.
 */
export function createRateLimiter() {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string, limits: { windowMs: number; max: number }[]): number => {
    const now = Date.now();
    if (hits.size > 10_000) {
      for (const [k, entry] of hits) if (entry.resetAt <= now) hits.delete(k);
    }
    let retryAfterMs = 0;
    for (const { windowMs, max } of limits) {
      const k = `${key}|${windowMs}`;
      let entry = hits.get(k);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(k, entry);
      }
      entry.count++;
      if (entry.count > max) retryAfterMs = Math.max(retryAfterMs, entry.resetAt - now);
    }
    return Math.ceil(retryAfterMs / 1000);
  };
}
