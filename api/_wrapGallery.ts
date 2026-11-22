// Wrap gallery storage (docs/WRAP-GALLERY.md), in the Neon Postgres database connected to the
// Vercel project (DATABASE_URL), next to the usage counters in api/_limits.ts.
//
// - Every wrap preview drawn from scratch (no visitor photo) is saved once per unique design:
//   the visitor's year/make/model text and the chosen options, plus 1200 and 640 px WebP files.
//   Nothing about the visitor is kept. Previews of a visitor's own photo are never saved.
// - Every preview, with or without a photo, adds 1 to anonymous daily counts of the options chosen
//   (finish, color, coverage, extras): the data behind "what wraps people try" on the gallery.
// - The daily growth run lists new designs (api/wraps.ts), looks at each one and publishes the good
//   ones by adding them to data/wraps/gallery.json. Only published designs are linked anywhere.
// - Storage is capped (MAX_DESIGNS, PER_DAY) so the free database tier can't fill up.
// If the database isn't configured, nothing is saved and the wrap tool works as before.
import { neon } from '@neondatabase/serverless';
import { COVERAGE, FINISHES, WRAP_EXTRAS, type SizeId, type WrapChoice } from './_wrap.js';

const MAX_DESIGNS = 2_500;
const PER_DAY = 80;

export interface GalleryCandidate {
  vehicle: string;
  size: SizeId;
  choice: WrapChoice;
  fromPhoto: boolean;
}

type Sql = ReturnType<typeof neon>;
let sql: Sql | null = null;
let ready: Promise<unknown> | null = null;

async function db(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!sql) {
    sql = neon(url);
    ready = Promise.all([
      sql`CREATE TABLE IF NOT EXISTS wrap_designs (
        id serial PRIMARY KEY,
        created_at timestamptz NOT NULL DEFAULT now(),
        combo text NOT NULL UNIQUE,
        vehicle text NOT NULL,
        size text NOT NULL,
        coverage text NOT NULL,
        finish text NOT NULL,
        color_name text NOT NULL,
        color_hex text NOT NULL,
        extras text NOT NULL DEFAULT '',
        width integer NOT NULL,
        height integer NOT NULL,
        img_large bytea NOT NULL,
        img_small bytea NOT NULL
      )`,
      sql`CREATE TABLE IF NOT EXISTS wrap_choice_counts (
        day date NOT NULL,
        kind text NOT NULL,
        value text NOT NULL,
        count integer NOT NULL DEFAULT 0,
        PRIMARY KEY (day, kind, value)
      )`,
    ]);
    ready.catch(() => {
      sql = null;
      ready = null;
    });
  }
  await ready;
  return sql;
}

const label = (c: WrapChoice) => {
  const finish = FINISHES.find((f) => f.id === c.finish)!.label.toLowerCase();
  const coverage = COVERAGE.find((x) => x.id === c.coverage)!.label.toLowerCase();
  return `${c.color.name.toLowerCase()} ${['chrome', 'carbon', 'colorShift'].includes(c.finish) ? '' : `${finish} `}${coverage}`;
};

/** Counts the options of one preview, then saves the design if it is eligible. Never throws. */
export async function recordWrap(candidate: GalleryCandidate, imageBase64: string): Promise<void> {
  try {
    const q = await db();
    if (!q) return;
    const { choice } = candidate;
    const values: [string, string][] = [
      ['source', candidate.fromPhoto ? 'photo' : 'drawn'],
      ['finish', choice.finish],
      ['color', `${choice.finish}:${choice.color.name}`],
      ['coverage', choice.coverage],
      ...choice.extras.map((x) => ['extra', x] as [string, string]),
    ];
    for (const [kind, value] of values) {
      await q`INSERT INTO wrap_choice_counts (day, kind, value, count) VALUES (CURRENT_DATE, ${kind}, ${value}, 1)
        ON CONFLICT (day, kind, value) DO UPDATE SET count = wrap_choice_counts.count + 1`;
    }

    // Only previews drawn from scratch for a named vehicle can be published.
    const vehicle = candidate.vehicle.trim().replace(/\s+/g, ' ');
    if (candidate.fromPhoto || !vehicle) return;
    const hex = choice.color.hex.join(',').toLowerCase();
    const extras = [...choice.extras].sort().join(',');
    const combo = [vehicle.toLowerCase(), choice.coverage, choice.finish, choice.color.name.toLowerCase(), hex, extras].join('|');

    const [{ total, today, seen }] = (await q`SELECT
        (SELECT count(*)::int FROM wrap_designs) AS total,
        (SELECT count(*)::int FROM wrap_designs WHERE created_at >= date_trunc('day', now())) AS today,
        (SELECT count(*)::int FROM wrap_designs WHERE combo = ${combo}) AS seen`) as { total: number; today: number; seen: number }[];
    if (seen > 0 || total >= MAX_DESIGNS || today >= PER_DAY) return;

    const title = `${vehicle}: ${label(choice)} (AI wrap preview)`;
    const extrasText = WRAP_EXTRAS.filter((x) => choice.extras.includes(x.id)).map((x) => x.label.toLowerCase());
    const caption = `AI-generated preview of a ${vehicle} with a ${label(choice)}${extrasText.length ? `, ${extrasText.join(', ')}` : ''}. Made with the MyAutoSpex Wrap Designer.`;
    // Loaded only here, so text tools don't pay sharp's start-up cost.
    const { encodeWrap } = await import('./_wrapImage.js');
    const img = await encodeWrap(Buffer.from(imageBase64, 'base64'), { title, caption });
    await q`INSERT INTO wrap_designs (combo, vehicle, size, coverage, finish, color_name, color_hex, extras, width, height, img_large, img_small)
      VALUES (${combo}, ${vehicle}, ${candidate.size}, ${choice.coverage}, ${choice.finish}, ${choice.color.name}, ${hex}, ${extras},
              ${img.width}, ${img.height}, decode(${img.large.toString('base64')}, 'base64'), decode(${img.small.toString('base64')}, 'base64'))
      ON CONFLICT (combo) DO NOTHING`;
  } catch (err) {
    console.error('wrap gallery: could not record a preview', err instanceof Error ? err.message : err);
  }
}

export interface DesignRow {
  id: number;
  created: string;
  vehicle: string;
  size: string;
  coverage: string;
  finish: string;
  color: { name: string; hex: string[] };
  extras: string[];
  width: number;
  height: number;
}

/** Saved designs after `after` (by id), oldest first: metadata only. */
export async function listDesigns(after: number, limit: number): Promise<DesignRow[] | null> {
  const q = await db();
  if (!q) return null;
  const rows = (await q`SELECT id, created_at, vehicle, size, coverage, finish, color_name, color_hex, extras, width, height
    FROM wrap_designs WHERE id > ${after} ORDER BY id LIMIT ${limit}`) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as number,
    created: new Date(r.created_at as string).toISOString(),
    vehicle: r.vehicle as string,
    size: r.size as string,
    coverage: r.coverage as string,
    finish: r.finish as string,
    color: { name: r.color_name as string, hex: String(r.color_hex).split(',') },
    extras: r.extras ? String(r.extras).split(',') : [],
    width: r.width as number,
    height: r.height as number,
  }));
}

/** Option counts over the last `days` days, for the "what wraps people try" chart. */
export async function choiceStats(days: number): Promise<{ days: number; counts: Record<string, Record<string, number>> } | null> {
  const q = await db();
  if (!q) return null;
  const rows = (await q`SELECT kind, value, sum(count)::int AS n FROM wrap_choice_counts
    WHERE day > CURRENT_DATE - ${days}::int GROUP BY kind, value`) as { kind: string; value: string; n: number }[];
  const counts: Record<string, Record<string, number>> = {};
  for (const r of rows) (counts[r.kind] ??= {})[r.value] = r.n;
  return { days, counts };
}

/** One saved image: 'large' (1200 px) or 'small' (640 px) WebP. */
export async function designImage(id: number, size: 'large' | 'small'): Promise<Buffer | null> {
  const q = await db();
  if (!q) return null;
  // Sent as base64 text: the plainest way through the HTTP driver.
  const rows = (size === 'large'
    ? await q`SELECT encode(img_large, 'base64') AS img FROM wrap_designs WHERE id = ${id}`
    : await q`SELECT encode(img_small, 'base64') AS img FROM wrap_designs WHERE id = ${id}`) as { img: string }[];
  return rows[0] ? Buffer.from(rows[0].img.replace(/\s/g, ''), 'base64') : null;
}
