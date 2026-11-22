// Daily wrap gallery review (docs/WRAP-GALLERY.md). Run by the daily growth run after the deploy is live.
//
//   NODE_USE_ENV_PROXY=1 node scripts/wraps/review.mjs fetch <dir>
//       Downloads designs saved since the last review (metadata and 640 px images) into <dir>, writes
//       <dir>/new.json and a numbered contact sheet <dir>/sheet.jpg to look at, and refreshes
//       data/wraps/stats.json (anonymous option counts, last 90 days).
//   node scripts/wraps/review.mjs publish <dir> <id>:<year>:<make>:<model> [...]
//       Adds the approved designs to data/wraps/gallery.json with the vehicle name cleaned up
//       (year may be empty). Only designs that pass the checklist in docs/WRAP-GALLERY.md.
//   node scripts/wraps/review.mjs done <dir>
//       Marks everything fetched as reviewed (data/wraps/review-state.json), published or not.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SITE = 'https://www.myautospex.com';
const root = new URL('../../', import.meta.url);
const stateFile = new URL('data/wraps/review-state.json', root);
const galleryFile = new URL('data/wraps/gallery.json', root);
const statsFile = new URL('data/wraps/stats.json', root);
const readJson = async (file, fallback) => JSON.parse(await fs.readFile(file, 'utf8').catch(() => JSON.stringify(fallback)));

const COVERAGE_WORDS = { full: 'full wrap', roof: 'roof wrap', hood: 'hood wrap', stripes: 'racing stripes', chromeDelete: 'chrome delete' };
const finishWord = (f) => (f === 'chrome' || f === 'carbon' ? '' : f === 'colorShift' ? 'color shift' : f);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const [cmd, dirArg, ...rest] = process.argv.slice(2);
if (!cmd || !dirArg) {
  console.error('Usage: review.mjs fetch|publish|done <dir> [...]');
  process.exit(1);
}
const dir = path.resolve(dirArg);
await fs.mkdir(dir, { recursive: true });
const state = await readJson(stateFile, { lastReviewedId: 0 });

if (cmd === 'fetch') {
  const res = await fetch(`${SITE}/api/wraps?after=${state.lastReviewedId}&limit=100`);
  if (!res.ok) throw new Error(`/api/wraps: HTTP ${res.status}`);
  const body = await res.json();
  if (!body.configured) console.log('The database is not configured on the site: nothing is being saved yet.');

  // Anonymous option counts for the gallery chart.
  if (body.stats) {
    const c = body.stats.counts;
    const total = Object.values(c.source ?? {}).reduce((a, b) => a + b, 0);
    const stats = { asOf: new Date().toISOString().slice(0, 10), days: body.stats.days, total, finish: c.finish ?? {}, color: c.color ?? {}, coverage: c.coverage ?? {}, extra: c.extra ?? {} };
    await fs.writeFile(statsFile, `${JSON.stringify(stats, null, 1)}\n`);
    console.log(`stats: ${total} previews in the last ${stats.days} days`);
  }

  const designs = body.designs ?? [];
  const tiles = [];
  for (const [i, d] of designs.entries()) {
    const img = await fetch(`${SITE}/images/wraps/v/${d.id}/review-640.webp`);
    if (!img.ok) continue;
    const file = path.join(dir, `${d.id}.webp`);
    await fs.writeFile(file, Buffer.from(await img.arrayBuffer()));
    const label = Buffer.from(
      `<svg width="320" height="40"><rect width="320" height="40" fill="black" opacity="0.7"/><text x="8" y="27" font-size="20" font-family="sans-serif" fill="white">#${d.id} ${d.vehicle.slice(0, 22).replace(/[<&>]/g, '')}</text></svg>`,
    );
    tiles.push({ input: await sharp(file).resize(320, 213).composite([{ input: label, top: 0, left: 0 }]).toBuffer(), left: (i % 4) * 320, top: Math.floor(i / 4) * 213 });
  }
  await fs.writeFile(path.join(dir, 'new.json'), `${JSON.stringify(designs, null, 1)}\n`);
  if (tiles.length) {
    await sharp({ create: { width: 1280, height: Math.ceil(tiles.length / 4) * 213, channels: 3, background: '#ffffff' } })
      .composite(tiles)
      .jpeg({ quality: 80 })
      .toFile(path.join(dir, 'sheet.jpg'));
  }
  console.log(`${designs.length} new design(s) since #${state.lastReviewedId}${tiles.length ? `; contact sheet: ${path.join(dir, 'sheet.jpg')}` : ''}`);
  for (const d of designs) console.log(`#${d.id} ${d.vehicle} | ${d.finish} ${d.color.name} | ${d.coverage} | extras: ${d.extras.join(', ') || 'none'}`);
}

if (cmd === 'publish') {
  const fetched = await readJson(path.join(dir, 'new.json'), []);
  const gallery = await readJson(galleryFile, { designs: [] });
  for (const arg of rest) {
    const [id, year, make, ...modelParts] = arg.split(':');
    const model = modelParts.join(':').trim();
    const d = fetched.find((x) => String(x.id) === id);
    if (!d || !make || !model) throw new Error(`Bad entry "${arg}": use <id>:<year>:<make>:<model> for a fetched design`);
    if (gallery.designs.some((g) => g.id === d.id)) continue;
    let slug = slugify(`${year} ${make} ${model} ${finishWord(d.finish)} ${d.color.name} ${COVERAGE_WORDS[d.coverage]}`);
    if (gallery.designs.some((g) => g.slug === slug)) slug = `${slug}-${d.id}`;
    gallery.designs.push({
      slug,
      source: 'visitor',
      id: d.id,
      created: d.created.slice(0, 10),
      ...(year ? { year: Number(year) } : {}),
      make: make.trim(),
      model,
      size: d.size,
      coverage: d.coverage,
      finish: d.finish,
      color: d.color,
      extras: d.extras,
      width: d.width,
      height: d.height,
    });
    console.log(`published #${d.id} as /wrap-gallery/${slug}`);
  }
  await fs.writeFile(galleryFile, `${JSON.stringify(gallery, null, 1)}\n`);
}

if (cmd === 'done') {
  const fetched = await readJson(path.join(dir, 'new.json'), []);
  const last = Math.max(state.lastReviewedId, ...fetched.map((d) => d.id));
  await fs.writeFile(stateFile, `${JSON.stringify({ lastReviewedId: last, reviewedOn: new Date().toISOString().slice(0, 10) }, null, 1)}\n`);
  console.log(`reviewed up to #${last}`);
}
