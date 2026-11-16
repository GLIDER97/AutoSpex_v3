// Daily caps: the SQL counters (run on PGlite, an in-process Postgres), the
// memory store used in development, and how takeDailyQuota reads limits and
// fails closed.
import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { clientKey } from '../api/_shared';
import {
  callerHash,
  memoryStore,
  secondsUntilReset,
  setCounterStore,
  sqlStore,
  takeDailyQuota,
  type CounterStore,
  type Query,
} from '../api/_usage';

let db: PGlite;
let query: Query;

beforeAll(async () => {
  db = new PGlite();
  query = async (text, params) => (await db.query<Record<string, unknown>>(text, params)).rows;
});

const caller = (key: string, limit: number) => ({ key, limit });

describe('sqlStore (Postgres)', () => {
  it('creates its table and counts up to each limit', async () => {
    const store = sqlStore(query);
    const day = '2026-11-16';
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await store.consume(day, caller('ip:a', 3), caller('site:t1', 10)));
    expect(results).toEqual(['ok', 'ok', 'ok', 'caller']);
    // A refused caller doesn't use up the site's allowance.
    const [row] = await query(`SELECT count FROM usage_counters WHERE day = $1 AND key = 'site:t1'`, [day]);
    expect(row.count).toBe(3);
  });

  it('stops everyone once the site-wide limit is reached', async () => {
    const store = sqlStore(query);
    const day = '2026-11-16';
    expect(await store.consume(day, caller('ip:b', 5), caller('site:t2', 2))).toBe('ok');
    expect(await store.consume(day, caller('ip:c', 5), caller('site:t2', 2))).toBe('ok');
    expect(await store.consume(day, caller('ip:d', 5), caller('site:t2', 2))).toBe('site');
    expect(await store.consume(day, caller('ip:b', 5), caller('site:t2', 2))).toBe('site');
  });

  it('starts again the next day', async () => {
    const store = sqlStore(query);
    expect(await store.consume('2026-11-16', caller('ip:e', 1), caller('site:t3', 1))).toBe('ok');
    expect(await store.consume('2026-11-16', caller('ip:e', 1), caller('site:t3', 1))).toBe('caller');
    expect(await store.consume('2026-11-17', caller('ip:e', 1), caller('site:t3', 1))).toBe('ok');
  });

  it('never goes over the limit under concurrent requests from many instances', async () => {
    // Separate store objects stand in for separate function instances sharing one database.
    const instances = Array.from({ length: 5 }, () => sqlStore(query));
    const outcomes = await Promise.all(
      Array.from({ length: 60 }, (_, i) => instances[i % 5].consume('2026-11-18', caller(`ip:${i % 7}`, 100), caller('site:t4', 25))),
    );
    expect(outcomes.filter((o) => o === 'ok')).toHaveLength(25);
    const [row] = await query(`SELECT count FROM usage_counters WHERE day = '2026-11-18' AND key = 'site:t4'`, []);
    expect(row.count).toBe(25);
  });

  it('creates the table on first use, also when instances race to create it', async () => {
    const fresh = new PGlite();
    const freshQuery: Query = async (text, params) => (await fresh.query<Record<string, unknown>>(text, params)).rows;
    let creates = 0;
    // Another instance creates the table between our failed count and our CREATE.
    const racing: Query = async (text, params) => {
      if (text.startsWith('CREATE') && creates++ === 0) {
        await freshQuery(text, params);
        throw Object.assign(new Error('duplicate key value violates unique constraint "pg_type_typname_nsp_index"'), { code: '23505' });
      }
      return freshQuery(text, params);
    };
    expect(await sqlStore(racing).consume('2026-11-19', caller('ip:f', 1), caller('site:t5', 1))).toBe('ok');
    expect(await sqlStore(freshQuery).consume('2026-11-19', caller('ip:f', 1), caller('site:t5', 1))).toBe('caller');
  });

  it('passes on other database errors (the caller then fails closed)', async () => {
    const down: Query = async () => {
      throw Object.assign(new Error('Connection terminated'), { code: '57P01' });
    };
    await expect(sqlStore(down).consume('2026-11-19', caller('ip:g', 1), caller('site:t6', 1))).rejects.toThrow('Connection terminated');
  });
});

describe('memoryStore', () => {
  it('has the same rules as the SQL store', async () => {
    const store = memoryStore();
    expect(await store.consume('d', caller('a', 1), caller('s', 2))).toBe('ok');
    expect(await store.consume('d', caller('a', 1), caller('s', 2))).toBe('caller');
    expect(await store.consume('d', caller('b', 1), caller('s', 2))).toBe('ok');
    expect(await store.consume('d', caller('c', 1), caller('s', 2))).toBe('site');
  });
});

describe('takeDailyQuota', () => {
  const request = (ip = '203.0.113.7') => new Request('https://www.myautospex.com/api/ai', { headers: { 'x-real-ip': ip } });

  afterEach(() => {
    vi.unstubAllEnvs();
    setCounterStore(undefined);
  });

  it('uses the limits from the environment, per visitor and site-wide', async () => {
    setCounterStore(memoryStore());
    vi.stubEnv('AI_IMAGE_DAILY_LIMIT', '3');
    vi.stubEnv('AI_IMAGE_DAILY_LIMIT_PER_IP', '2');
    expect(await takeDailyQuota(request('198.51.100.1'), 'ai-image')).toBeNull();
    expect(await takeDailyQuota(request('198.51.100.1'), 'ai-image')).toBeNull();
    expect(await takeDailyQuota(request('198.51.100.1'), 'ai-image')).toMatchObject({ reason: 'caller' });
    expect(await takeDailyQuota(request('198.51.100.2'), 'ai-image')).toBeNull();
    expect(await takeDailyQuota(request('198.51.100.3'), 'ai-image')).toMatchObject({ reason: 'site' });
    // Text has its own allowance.
    expect(await takeDailyQuota(request('198.51.100.3'), 'ai-text')).toBeNull();
  });

  it('treats a limit of 0 as off, and ignores invalid values', async () => {
    setCounterStore(memoryStore());
    vi.stubEnv('PLACES_DAILY_LIMIT', '0');
    expect(await takeDailyQuota(request(), 'places')).toMatchObject({ reason: 'site' });
    vi.stubEnv('PLACES_DAILY_LIMIT', 'lots');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await takeDailyQuota(request(), 'places')).toBeNull();
  });

  it('fails closed on Vercel without a database, and when the database errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('VERCEL', '1');
    setCounterStore(undefined);
    expect(await takeDailyQuota(request(), 'ai-text')).toMatchObject({ reason: 'unavailable' });

    const broken: CounterStore = { consume: async () => Promise.reject(new Error('Neon is down')) };
    setCounterStore(broken);
    expect(await takeDailyQuota(request(), 'ai-text')).toMatchObject({ reason: 'unavailable' });
  });

  it('resets at midnight UTC', () => {
    expect(secondsUntilReset(new Date('2026-11-16T23:59:30Z'))).toBe(30);
    expect(secondsUntilReset(new Date('2026-11-16T00:00:00Z'))).toBe(86400);
  });
});

describe('caller identity', () => {
  const req = (headers: Record<string, string>) => new Request('https://x.test/', { headers });

  it('groups IPv6 addresses by /64 and unwraps IPv4-mapped addresses', () => {
    expect(clientKey(req({ 'x-real-ip': '2001:db8:1234:5678:aaaa:bbbb:cccc:dddd' }))).toBe('2001:db8:1234:5678::/64');
    expect(clientKey(req({ 'x-real-ip': '2001:db8:1234:5678::1' }))).toBe('2001:db8:1234:5678::/64');
    expect(clientKey(req({ 'x-real-ip': '2001:db8::1' }))).toBe('2001:db8:0:0::/64');
    expect(clientKey(req({ 'x-real-ip': '::ffff:192.0.2.5' }))).toBe('192.0.2.5');
    expect(clientKey(req({ 'x-forwarded-for': '192.0.2.9, 10.0.0.1' }))).toBe('192.0.2.9');
    expect(clientKey(req({ 'x-vercel-forwarded-for': '192.0.2.10', 'x-real-ip': '192.0.2.11' }))).toBe('192.0.2.10');
  });

  it('stores a salted hash that changes daily, never the address', () => {
    const r = req({ 'x-real-ip': '192.0.2.5' });
    const today = callerHash(r, '2026-11-16');
    expect(today).not.toContain('192');
    expect(today).toHaveLength(22);
    expect(callerHash(r, '2026-11-16')).toBe(today);
    expect(callerHash(r, '2026-11-17')).not.toBe(today);
  });
});
