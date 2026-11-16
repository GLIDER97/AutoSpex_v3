// Daily usage caps that hold across every function instance, counted in the
// Neon Postgres database (DATABASE_URL). Each request takes one unit from two
// counters for the current UTC day: the caller's (a salted hash of their IP
// address, never the address itself) and the whole site's. When either is
// used up the request is refused until midnight UTC.
//
// Limits (Vercel environment variables, whole numbers; 0 turns a feature off):
//   AI_TEXT_DAILY_LIMIT          text answers per day, site-wide       (default 2000)
//   AI_TEXT_DAILY_LIMIT_PER_IP   text answers per day, per visitor     (default 100)
//   AI_IMAGE_DAILY_LIMIT         wrap previews per day, site-wide      (default 150)
//   AI_IMAGE_DAILY_LIMIT_PER_IP  wrap previews per day, per visitor    (default 15)
//   PLACES_DAILY_LIMIT           Google shop searches per day, site-wide (default 300)
//   PLACES_DAILY_LIMIT_PER_IP    Google shop searches per day, per visitor (default 30)
//
// Without DATABASE_URL, deployed functions refuse paid calls (fail closed);
// `npm run dev` counts in memory instead.
import { createHmac } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { clientKey } from './_shared.js';

export type Bucket = 'ai-text' | 'ai-image' | 'places';

const LIMITS: Record<Bucket, { site: [string, number]; caller: [string, number] }> = {
  'ai-text': { site: ['AI_TEXT_DAILY_LIMIT', 2000], caller: ['AI_TEXT_DAILY_LIMIT_PER_IP', 100] },
  'ai-image': { site: ['AI_IMAGE_DAILY_LIMIT', 150], caller: ['AI_IMAGE_DAILY_LIMIT_PER_IP', 15] },
  places: { site: ['PLACES_DAILY_LIMIT', 300], caller: ['PLACES_DAILY_LIMIT_PER_IP', 30] },
};

function limitFromEnv([name, fallback]: [string, number]): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    console.error(`usage: ${name} must be a whole number; using ${fallback}`);
    return fallback;
  }
  return n;
}

export const dailyLimits = (bucket: Bucket) => ({ site: limitFromEnv(LIMITS[bucket].site), caller: limitFromEnv(LIMITS[bucket].caller) });

/** Today's date in UTC, YYYY-MM-DD. */
export const utcDay = (now = new Date()) => now.toISOString().slice(0, 10);

/** Seconds until the counters reset (midnight UTC). */
export function secondsUntilReset(now = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

// --- Stores ---------------------------------------------------------------------

export interface Counter {
  key: string;
  limit: number;
}

/** 'ok' when a unit was taken from both counters; otherwise which counter is used up. */
export type Outcome = 'ok' | 'caller' | 'site';

export interface CounterStore {
  consume(day: string, caller: Counter, site: Counter): Promise<Outcome>;
}

export type Query = (text: string, params: unknown[]) => Promise<Record<string, unknown>[]>;

export const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS usage_counters (
  day date NOT NULL,
  key text NOT NULL,
  count integer NOT NULL,
  PRIMARY KEY (day, key)
)`;

// One statement, so it is atomic under concurrency: the caller's counter goes
// up only while it is under its limit, and the site's counter goes up only if
// the caller's did and the site is under its limit. A NULL in the result marks
// the counter that is used up.
export const CONSUME = `WITH caller AS (
  INSERT INTO usage_counters AS u (day, key, count) VALUES ($1::date, $2::text, 1)
  ON CONFLICT (day, key) DO UPDATE SET count = u.count + 1 WHERE u.count < $3::int
  RETURNING u.count
), site AS (
  INSERT INTO usage_counters AS u (day, key, count)
  SELECT $1::date, $4::text, 1 WHERE EXISTS (SELECT 1 FROM caller)
  ON CONFLICT (day, key) DO UPDATE SET count = u.count + 1 WHERE u.count < $5::int
  RETURNING u.count
)
SELECT (SELECT count FROM caller) AS caller, (SELECT count FROM site) AS site`;

export const CLEANUP = `DELETE FROM usage_counters WHERE day < $1::date - 7`;

const errorCode = (err: unknown) => (typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : '');
// 42P01: the table doesn't exist yet. 42P07 / 23505: another instance created it at the same moment.
const isMissingTable = (err: unknown) => errorCode(err) === '42P01' || /relation "usage_counters" does not exist/.test(String(err));
const isAlreadyCreated = (err: unknown) => ['42P07', '23505'].includes(errorCode(err)) || /already exists|duplicate key/.test(String(err));

/** Counters in a Postgres table (Neon in production; tests pass PGlite). The table is created on first use. */
export function sqlStore(query: Query): CounterStore {
  return {
    async consume(day, caller, site) {
      const params = [day, caller.key, caller.limit, site.key, site.limit];
      let rows: Record<string, unknown>[];
      try {
        rows = await query(CONSUME, params);
      } catch (err) {
        if (!isMissingTable(err)) throw err;
        await query(CREATE_TABLE, []).catch((createErr) => {
          if (!isAlreadyCreated(createErr)) throw createErr;
        });
        rows = await query(CONSUME, params);
      }
      const [row] = rows;
      if (row?.caller == null) return 'caller';
      if (row.site == null) return 'site';
      // Now and then, drop counters older than a week.
      if (Math.random() < 0.01) query(CLEANUP, [day]).catch((err) => console.error('usage: cleanup failed', err));
      return 'ok';
    },
  };
}

/** Counters in this process's memory: only for `npm run dev` and tests. */
export function memoryStore(): CounterStore {
  const counts = new Map<string, number>();
  const take = (key: string, limit: number) => {
    const n = counts.get(key) ?? 0;
    if (n >= limit) return false;
    counts.set(key, n + 1);
    return true;
  };
  return {
    async consume(day, caller, site) {
      if (!take(`${day}|${caller.key}`, caller.limit)) return 'caller';
      if (!take(`${day}|${site.key}`, site.limit)) return 'site';
      return 'ok';
    },
  };
}

let store: CounterStore | null | undefined;

function getStore(): CounterStore | null {
  if (store !== undefined) return store;
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = neon(url);
    store = sqlStore((text, params) => sql.query(text, params) as Promise<Record<string, unknown>[]>);
  } else if (process.env.VERCEL) {
    console.error('usage: DATABASE_URL is not set, so paid calls are refused');
    store = null;
  } else {
    store = memoryStore();
  }
  return store;
}

/** Replaces the store (tests). Pass undefined to pick it from the environment again. */
export function setCounterStore(next: CounterStore | null | undefined) {
  store = next;
}

// --- Taking a unit ----------------------------------------------------------------------

/** A salted hash of the caller's IP address (or /64 network for IPv6), different every day. */
export function callerHash(request: Request, day: string): string {
  const secret = process.env.USAGE_HASH_SECRET || process.env.DATABASE_URL || 'local-dev';
  return createHmac('sha256', secret).update(`${day}|${clientKey(request)}`).digest('base64url').slice(0, 22);
}

/** Why a request was refused: the caller's or the site's allowance is used up, or the counters can't be reached. */
export interface QuotaRefusal {
  reason: 'caller' | 'site' | 'unavailable';
  retryAfter: number;
}

/** Takes one unit of today's allowance for this caller and the site. Returns null when it was taken. */
export async function takeDailyQuota(request: Request, bucket: Bucket, now = new Date()): Promise<QuotaRefusal | null> {
  const day = utcDay(now);
  const limits = dailyLimits(bucket);
  const retryAfter = secondsUntilReset(now);
  if (limits.site <= 0) return { reason: 'site', retryAfter };
  if (limits.caller <= 0) return { reason: 'caller', retryAfter };
  const counters = getStore();
  if (!counters) return { reason: 'unavailable', retryAfter: 300 };
  try {
    const outcome = await counters.consume(day, { key: `${bucket}:ip:${callerHash(request, day)}`, limit: limits.caller }, { key: `${bucket}:site`, limit: limits.site });
    if (outcome === 'ok') return null;
    if (outcome === 'site') console.warn(`usage: the site-wide daily limit for ${bucket} (${limits.site}) is used up`);
    return { reason: outcome, retryAfter };
  } catch (err) {
    // Fail closed: without the counters there is no cap.
    console.error('usage: counter database error', err instanceof Error ? err.message : err);
    return { reason: 'unavailable', retryAfter: 300 };
  }
}
