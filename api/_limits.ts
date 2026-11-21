// Daily usage caps that hold across every server instance, stored in the Neon
// Postgres database connected to the Vercel project (DATABASE_URL).
//
// Each paid call (AI text, AI image, uncached Google Places search) counts
// against a site-wide daily cap and a per-visitor daily cap. Visitors are
// identified only by a salted hash of their IP address, and rows older than
// 30 days are deleted. If the database isn't configured or can't be reached,
// per-instance in-memory caps apply instead, so the site keeps working; the
// provider-side spending limits stay the final backstop.
//
// The same database also keeps shared AI answers that are identical for every
// visitor (coupons, toolkits) so they are paid for about twice a day, not on
// every page view.
//
// Caps can be changed in Vercel with these environment variables:
//   AI_DAILY_TEXT_LIMIT (default 1500)     AI_DAILY_TEXT_PER_VISITOR (default 80)
//   AI_DAILY_IMAGE_LIMIT (default 150)     AI_DAILY_IMAGE_PER_VISITOR (default 12)
//   PLACES_DAILY_LIMIT (default 30)        PLACES_DAILY_PER_VISITOR (default 5)
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export type UsageKind = 'text' | 'image' | 'places';

const DEFAULTS: Record<UsageKind, { site: number; visitor: number }> = {
  text: { site: 1500, visitor: 80 },
  image: { site: 150, visitor: 12 },
  // 30 a day stays inside Google's free monthly Places (Text Search Enterprise) usage, about 1,000 searches a month.
  places: { site: 30, visitor: 5 },
};

const ENV: Record<UsageKind, { site: string; visitor: string }> = {
  text: { site: 'AI_DAILY_TEXT_LIMIT', visitor: 'AI_DAILY_TEXT_PER_VISITOR' },
  image: { site: 'AI_DAILY_IMAGE_LIMIT', visitor: 'AI_DAILY_IMAGE_PER_VISITOR' },
  places: { site: 'PLACES_DAILY_LIMIT', visitor: 'PLACES_DAILY_PER_VISITOR' },
};

function limitsFor(kind: UsageKind) {
  const read = (name: string, fallback: number) => {
    const n = Number(process.env[name]);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  };
  return { site: read(ENV[kind].site, DEFAULTS[kind].site), visitor: read(ENV[kind].visitor, DEFAULTS[kind].visitor) };
}

/** A stable, non-reversible visitor id: salted SHA-256 of the IP, truncated. */
export function visitorId(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT || process.env.DATABASE_URL || 'local-development';
  return createHash('sha256').update(`${salt}|${ip}`).digest('hex').slice(0, 32);
}

const today = () => new Date().toISOString().slice(0, 10);

// --- Database ---------------------------------------------------------------------

type Sql = ReturnType<typeof neon>;
let sql: Sql | null = null;
let ready: Promise<unknown> | null = null;

function database(): Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!sql) {
    sql = neon(url);
    ready = Promise.all([
      sql`CREATE TABLE IF NOT EXISTS usage_counters (
        day date NOT NULL,
        bucket text NOT NULL,
        count integer NOT NULL DEFAULT 0,
        PRIMARY KEY (day, bucket)
      )`,
      sql`CREATE TABLE IF NOT EXISTS shared_answers (
        key text PRIMARY KEY,
        body text NOT NULL,
        expires_at timestamptz NOT NULL
      )`,
    ]);
    // A failed setup is retried on the next request instead of failing forever.
    ready.catch(() => {
      sql = null;
      ready = null;
    });
  }
  return sql;
}

// --- In-memory fallback (per server instance) ---------------------------------------

const memory = new Map<string, number>();
function bumpMemory(bucket: string): number {
  const key = `${today()}|${bucket}`;
  if (memory.size > 20_000) {
    const prefix = `${today()}|`;
    for (const k of memory.keys()) if (!k.startsWith(prefix)) memory.delete(k);
  }
  const next = (memory.get(key) ?? 0) + 1;
  memory.set(key, next);
  return next;
}

// --- Public API ----------------------------------------------------------------------

export interface DailyResult {
  ok: boolean;
  /** Which cap was hit, when ok is false. */
  scope?: 'site' | 'visitor';
}

/**
 * Counts one use of `kind` for this visitor and the whole site, and says whether
 * it is within today's caps. Call it only right before spending money.
 */
export async function takeDaily(kind: UsageKind, ip: string): Promise<DailyResult> {
  const { site, visitor } = limitsFor(kind);
  const siteBucket = `site:${kind}`;
  const visitorBucket = `visitor:${kind}:${visitorId(ip)}`;

  let siteCount: number;
  let visitorCount: number;
  const db = database();
  try {
    if (!db) throw new Error('DATABASE_URL is not set');
    await ready;
    const day = today();
    const rows = (await db`
      INSERT INTO usage_counters (day, bucket, count)
      VALUES (${day}, ${siteBucket}, 1), (${day}, ${visitorBucket}, 1)
      ON CONFLICT (day, bucket) DO UPDATE SET count = usage_counters.count + 1
      RETURNING bucket, count`) as { bucket: string; count: number }[];
    siteCount = Number(rows.find((r) => r.bucket === siteBucket)?.count ?? 0);
    visitorCount = Number(rows.find((r) => r.bucket === visitorBucket)?.count ?? 0);
    // Keep at most 30 days of counters (and of hashed visitor ids).
    if (Math.random() < 0.01) {
      db`DELETE FROM usage_counters WHERE day < CURRENT_DATE - 30`.catch(() => {});
    }
  } catch (err) {
    if (db) console.error('limits: database unavailable, using in-memory caps', err instanceof Error ? err.message : err);
    siteCount = bumpMemory(siteBucket);
    visitorCount = bumpMemory(visitorBucket);
  }

  if (siteCount > site) return { ok: false, scope: 'site' };
  if (visitorCount > visitor) return { ok: false, scope: 'visitor' };
  return { ok: true };
}

// --- Shared answers ---------------------------------------------------------------------

const memoryAnswers = new Map<string, { body: string; expires: number }>();

/** A stored answer for `key` that hasn't expired, or null. */
export async function getShared(key: string): Promise<string | null> {
  const local = memoryAnswers.get(key);
  if (local && local.expires > Date.now()) return local.body;
  const db = database();
  if (!db) return null;
  try {
    await ready;
    const rows = (await db`SELECT body, expires_at FROM shared_answers WHERE key = ${key} AND expires_at > now()`) as {
      body: string;
      expires_at: string | Date;
    }[];
    if (!rows[0]) return null;
    memoryAnswers.set(key, { body: rows[0].body, expires: new Date(rows[0].expires_at).getTime() });
    return rows[0].body;
  } catch (err) {
    console.error('limits: could not read shared answer', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Stores an answer every visitor can reuse for `seconds`. */
export async function putShared(key: string, body: string, seconds: number): Promise<void> {
  memoryAnswers.set(key, { body, expires: Date.now() + seconds * 1000 });
  const db = database();
  if (!db) return;
  try {
    await ready;
    await db`
      INSERT INTO shared_answers (key, body, expires_at)
      VALUES (${key}, ${body}, now() + make_interval(secs => ${seconds}))
      ON CONFLICT (key) DO UPDATE SET body = EXCLUDED.body, expires_at = EXCLUDED.expires_at`;
  } catch (err) {
    console.error('limits: could not store shared answer', err instanceof Error ? err.message : err);
  }
}
