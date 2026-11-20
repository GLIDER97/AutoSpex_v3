// Build step: turn the single-page app into one static HTML file per route.
//
// Runs after `vite build` (client) and `vite build --ssr entry-server.tsx`.
// For every page it writes dist/<path>.html with:
//   - the fully rendered page content (text and links Google can crawl)
//   - a unique <title>, meta description, canonical URL and Open Graph tags
//   - JSON-LD structured data (Organization/WebSite, BlogPosting, breadcrumbs)
// It also writes dist/sitemap.xml, dist/robots.txt and dist/404.html.
// vercel.json ("cleanUrls") serves dist/blog.html at /blog, and so on.

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Use React's production server build (smaller output, no dev-only warnings).
process.env.NODE_ENV ??= 'production';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

const { render, ARTICLES, ARTICLE_INDEX, TOOLS, CODE_PAGES, STATIC_PAGES, NOT_FOUND_META, SITE_URL, SITE_NAME, formatTitle, absoluteUrl } =
  await import(pathToFileURL(ssrEntry).href);

const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON inside <script> must not be able to close the tag.
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function isoDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/favicon.svg`,
};

// Share image for pages without their own (public/og-image.png, 1200x630).
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function buildHead({ title, description, canonical, noindex, image = DEFAULT_IMAGE, type = 'website', structuredData = [] }) {
  const tags = [];
  // Indexable pages allow large image previews, which Google Discover needs to show a page with a big image.
  tags.push(`<meta name="robots" content="${noindex ? 'noindex, follow' : 'max-image-preview:large'}" />`);
  if (canonical) tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  tags.push(
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  );
  if (canonical) tags.push(`<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  if (image) tags.push(`<meta property="og:image" content="${escapeHtml(image)}" />`);
  tags.push(
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  );
  if (image) tags.push(`<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  for (const data of structuredData) tags.push(jsonLd(data));
  return tags.map((t) => `    ${t}`).join('\n');
}

function fillTemplate(head, bodyHtml) {
  let html = template;
  const replaceOnce = (pattern, replacement, label) => {
    if (!pattern.test(html)) throw new Error(`prerender: index.html is missing ${label}`);
    html = html.replace(pattern, () => replacement);
  };
  replaceOnce(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(head.title)}</title>`, '<title>');
  replaceOnce(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(head.description)}" />`,
    'the meta description',
  );
  // The article list the client reads for guide links (Article/articleIndex.ts).
  const index = `    <script id="article-index" type="application/json">${JSON.stringify(ARTICLE_INDEX).replace(/</g, '\\u003c')}</script>`;
  replaceOnce(/<\/head>/, `${buildHead(head)}\n${index}\n  </head>`, '</head>');
  replaceOnce(/<div id="root"><\/div>/, `<div id="root">${bodyHtml}</div>`, '<div id="root"></div>');
  return html;
}

function outputFile(routePath) {
  if (routePath === '/') return path.join(distDir, 'index.html');
  return path.join(distDir, `${routePath.replace(/^\//, '')}.html`);
}

async function writePage(routePath, head) {
  const body = await render(routePath);
  if (!body.trim()) throw new Error(`prerender: ${routePath} rendered empty HTML`);
  const file = outputFile(routePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, fillTemplate(head, body));
  return file;
}

const sitemapEntries = [];
let count = 0;

// Info and tool pages. The homepage is written last because index.html is the template.
const pages = [...STATIC_PAGES].sort((a, b) => (a.path === '/') - (b.path === '/'));
for (const page of pages) {
  const canonical = absoluteUrl(page.path === '/' ? '/' : page.path);
  const structuredData = [];
  if (page.path === '/') {
    structuredData.push({
      '@context': 'https://schema.org',
      '@graph': [
        ORGANIZATION,
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          publisher: { '@id': ORGANIZATION['@id'] },
        },
      ],
    });
  } else {
    const tool = TOOLS.find((t) => t.path === page.path);
    if (tool) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: tool.name,
        url: canonical,
        description: page.description,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (web browser)',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': ORGANIZATION['@id'] },
      });
    }
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: page.title, item: canonical },
      ],
    });
  }
  await writePage(page.path, {
    title: formatTitle(page.title, page.rawTitle),
    description: page.description,
    canonical,
    noindex: page.noindex,
    structuredData,
  });
  count++;
  if (!page.noindex && page.sitemap !== false) sitemapEntries.push({ loc: canonical, lastmod: page.updated, priority: page.priority });
}

// Articles.
for (const article of ARTICLES) {
  const routePath = `/article/${article.slug}`;
  const canonical = absoluteUrl(routePath);
  const image = article.featuredImage ? absoluteUrl(article.featuredImage) : undefined;
  const published = isoDate(article.date);
  await writePage(routePath, {
    title: formatTitle(article.seoTitle || article.title),
    description: article.description,
    canonical,
    image,
    type: 'article',
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.description,
        ...(image && { image: [image] }),
        ...(published && { datePublished: published, dateModified: published }),
        // Articles are credited to the editorial team (see /editorial-policy), so the author is an organization.
        author: article.authorName && !/MyAutoSpex/i.test(article.authorName)
          ? { '@type': 'Person', name: article.authorName }
          : { '@type': 'Organization', name: 'MyAutoSpex Editorial Team', url: `${SITE_URL}/editorial-policy` },
        ...(article.category && { articleSection: article.category }),
        publisher: ORGANIZATION,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
        ],
      },
    ],
  });
  count++;
  sitemapEntries.push({ loc: canonical, lastmod: published?.slice(0, 10), priority: 0.8 });
}

// OBD-II code pages (data/codePages.ts).
for (const page of CODE_PAGES) {
  const routePath = `/codes/${page.code.toLowerCase()}`;
  const canonical = absoluteUrl(routePath);
  await writePage(routePath, {
    title: formatTitle(page.seoTitle),
    description: page.description,
    canonical,
    type: 'article',
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: `${page.code}: ${page.title}`,
        description: page.description,
        about: { '@type': 'Thing', name: `OBD-II trouble code ${page.code}` },
        dateModified: page.reviewed,
        author: { '@type': 'Organization', name: 'MyAutoSpex Editorial Team', url: `${SITE_URL}/editorial-policy` },
        citation: page.sources.map((s) => s.url),
        publisher: ORGANIZATION,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Check engine codes', item: `${SITE_URL}/fault-code-decoder` },
          { '@type': 'ListItem', position: 3, name: page.code, item: canonical },
        ],
      },
    ],
  });
  count++;
  sitemapEntries.push({ loc: canonical, lastmod: page.reviewed, priority: 0.8 });
}

// 404 page: Vercel serves dist/404.html with a 404 status for unknown URLs.
{
  const body = await render('/__page-not-found__');
  await fs.writeFile(
    path.join(distDir, '404.html'),
    fillTemplate(
      { title: formatTitle(NOT_FOUND_META.title), description: NOT_FOUND_META.description, noindex: true },
      body,
    ),
  );
}

sitemapEntries.sort((a, b) => (b.priority ?? 0.5) - (a.priority ?? 0.5));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    (e) =>
      `  <url>\n    <loc>${escapeHtml(e.loc)}</loc>\n${e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : ''}${
        e.priority != null ? `    <priority>${e.priority.toFixed(1)}</priority>\n` : ''
      }  </url>`,
  )
  .join('\n')}
</urlset>
`;
await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap);

await fs.writeFile(
  path.join(distDir, 'robots.txt'),
  // Decoder lookups in the URL (?codes=...) run a paid AI request on load, so crawlers skip them.
  `User-agent: *\nAllow: /\nDisallow: /fault-code-decoder?\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
);

// llms.txt: a plain-language map of the site for AI assistants (https://llmstxt.org).
{
  const line = (name, path, description) => `- [${name}](${absoluteUrl(path)}): ${description}`;
  const home = STATIC_PAGES.find((p) => p.path === '/');
  const llms = [
    `# ${SITE_NAME}`,
    '',
    `> ${home.description}`,
    '',
    '## Tools',
    '',
    ...TOOLS.map((t) => line(t.name, t.path, t.description)),
    '',
    '## Guides',
    '',
    ...[...ARTICLE_INDEX].sort((a, b) => (b.published ?? '').localeCompare(a.published ?? '')).map((a) => line(a.title, `/article/${a.slug}`, a.description)),
    '',
    '## Check engine code guides',
    '',
    ...CODE_PAGES.map((p) => line(`${p.code}: ${p.title}`, `/codes/${p.code.toLowerCase()}`, p.description)),
    '',
    '## About',
    '',
    line('About MyAutoSpex', '/about', 'Who we are and what the tools do.'),
    line('Editorial policy', '/editorial-policy', 'How our guides are written, how AI is used and how to report a mistake.'),
    '',
  ].join('\n');
  await fs.writeFile(path.join(distDir, 'llms.txt'), llms);
}

console.log(`prerender: wrote ${count} pages, 404.html, sitemap.xml (${sitemapEntries.length} URLs), robots.txt and llms.txt`);
