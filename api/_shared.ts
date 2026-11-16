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

/**
 * True for requests made by the site's own pages. This stops other websites'
 * pages from using our endpoints in their visitors' browsers, but a script can
 * send any Origin header, so it is not a security boundary: the endpoints
 * accept only fixed tools (api/_tools.ts) and enforce daily caps (api/_usage.ts).
 */
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

// On Vercel these headers are set by the platform (a client's own values are overwritten).
export function clientIp(request: Request): string {
  return (
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

/** Expands an IPv6 address to its 8 groups, or returns null. */
function ipv6Groups(ip: string): string[] | null {
  if (!ip.includes(':')) return null;
  const [head, tail = ''] = ip.split('::');
  const parse = (part: string) => (part ? part.split(':') : []);
  const left = parse(head);
  const right = parse(tail);
  if (ip.includes('::')) {
    const missing = 8 - left.length - right.length;
    if (missing < 0) return null;
    return [...left, ...Array(missing).fill('0'), ...right];
  }
  return left.length === 8 ? left : null;
}

/**
 * Who is calling, for rate limits: the IPv4 address, or the /64 network of an
 * IPv6 address (one home or phone usually gets a whole /64).
 */
export function clientKey(request: Request): string {
  const ip = clientIp(request).toLowerCase();
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return mapped[1];
  const groups = ipv6Groups(ip.split('%')[0]);
  if (!groups) return ip;
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':')}::/64`;
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
