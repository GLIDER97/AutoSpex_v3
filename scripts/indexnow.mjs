// Submits URLs to IndexNow (Bing, Yandex, Seznam, Naver and others) after a deploy.
//
//   node scripts/indexnow.mjs https://www.myautospex.com/codes/p0300 /codes/p0171 ...
//   node scripts/indexnow.mjs --all        every URL in the live sitemap
//
// The key is the file name of public/<32 hex chars>.txt, which Vercel serves at the
// site root so search engines can verify it. Submit only after the deploy is live.
import { readdirSync, readFileSync } from 'node:fs';

const HOST = 'www.myautospex.com';
const SITE = `https://${HOST}`;

const keyFile = readdirSync(new URL('../public/', import.meta.url)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file (public/<32 hex>.txt) found');
const key = readFileSync(new URL(`../public/${keyFile}`, import.meta.url), 'utf8').trim();

let urls = process.argv.slice(2);
if (urls.includes('--all')) {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
urls = [...new Set(urls.map((u) => (u.startsWith('http') ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`)))].filter((u) =>
  u.startsWith(SITE),
);
if (!urls.length) {
  console.error('Usage: node scripts/indexnow.mjs <url-or-path> ... | --all');
  process.exit(1);
}

// The key file must be live before engines will accept the submission.
const live = await fetch(`${SITE}/${keyFile}`);
if (!live.ok || (await live.text()).trim() !== key) throw new Error(`Key file ${SITE}/${keyFile} is not live yet`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${keyFile}`, urlList: urls.slice(0, 10000) }),
});
// 200 = accepted, 202 = accepted pending key check; anything else is a problem.
console.log(`IndexNow: HTTP ${res.status} for ${urls.length} URL(s)`);
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
