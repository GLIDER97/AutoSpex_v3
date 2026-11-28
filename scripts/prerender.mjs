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

const { render, ARTICLES, ARTICLE_INDEX, TOOLS, CODE_PAGES, carsCsv, CARS_CSV, EMBEDS, studyCsv, SUV_STUDY_CSV, SUV_STUDY_PATH, STUDY_AS_OF, STUDY_ROWS, insuranceCsv, insuranceFacts, INSURANCE_CSV, INSURANCE_PATH, CPI_AS_OF, monthName, spendingCsv, spendingFacts, AVERAGE_COST_CSV, AVERAGE_COST_PATH, SPENDING_AS_OF, WRAP_DESIGNS, designPath, designImage, designTitle, designSeoTitle, designDescription, designAlt, vehicleOf, coverageLabel, finishLabel, VEHICLES, vehiclePath, vehicleName, vehicleCsvPath, vehicleCsv, vehicleSeoTitle, vehicleDescription, STATIC_PAGES, NOT_FOUND_META, SITE_URL, SITE_NAME, formatTitle, absoluteUrl, pageImageFor, pageShareImageSrc } =
  await import(pathToFileURL(ssrEntry).href);

// A page's own studio photo (data/pageImages.ts) as its share image; pages without one use the default.
const pageShareImage = (routePath) => {
  const img = pageImageFor(routePath);
  return img ? absoluteUrl(pageShareImageSrc(img.file)) : undefined;
};

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
  logo: `${SITE_URL}/icon-512.png`,
};

// Share image for pages without their own (public/og-image.png, 1200x630).
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

// One wrap gallery design as schema.org ImageObject, with credit, license and "AI-generated" in plain words.
const WRAP_LICENSE = 'https://creativecommons.org/licenses/by/4.0/';
function wrapImageObject(d) {
  const page = absoluteUrl(designPath(d));
  return {
    '@type': 'ImageObject',
    '@id': `${page}#image`,
    url: page,
    contentUrl: absoluteUrl(designImage(d, 'large')),
    thumbnailUrl: absoluteUrl(designImage(d, 'small')),
    name: designTitle(d),
    caption: `${designAlt(d)}. AI-generated preview made with the MyAutoSpex Wrap Designer.`,
    description: designDescription(d),
    width: d.width,
    height: d.height,
    encodingFormat: 'image/webp',
    datePublished: d.created,
    creator: { '@type': 'Organization', name: 'MyAutoSpex', url: `${SITE_URL}/` },
    creditText: 'MyAutoSpex Wrap Designer (AI-generated)',
    copyrightNotice: 'MyAutoSpex, CC BY 4.0',
    license: WRAP_LICENSE,
    acquireLicensePage: `${page}#use-this-image`,
    isFamilyFriendly: true,
    keywords: [`${d.make} ${d.model} wrap`, `${finishLabel(d.finish).toLowerCase()} wrap`, `${d.color.name.toLowerCase()} car wrap`, coverageLabel(d.coverage).toLowerCase(), 'car wrap ideas'].join(', '),
    about: { '@type': 'Car', name: vehicleOf(d), brand: { '@type': 'Brand', name: d.make }, model: d.model, ...(d.year && { vehicleModelDate: String(d.year) }) },
  };
}

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
  const shareImage = pageShareImage(page.path);
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
  } else if (page.path === SUV_STUDY_PATH) {
    // Data study: the full table as CSV, and Article + Dataset markup so search and AI answers can cite it.
    const csvFile = path.join(distDir, SUV_STUDY_CSV.replace(/^\//, ''));
    await fs.mkdir(path.dirname(csvFile), { recursive: true });
    await fs.writeFile(csvFile, studyCsv());
    structuredData.push(
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Which used SUVs get the most owner complaints? NHTSA data for 20 popular SUVs, 2015–2022',
        description: page.description,
        datePublished: page.updated,
        dateModified: STUDY_AS_OF,
        author: { '@type': 'Organization', name: 'MyAutoSpex Editorial Team', url: `${SITE_URL}/editorial-policy` },
        publisher: ORGANIZATION,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        isBasedOn: 'https://www.nhtsa.gov/nhtsa-datasets-and-apis',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'NHTSA owner complaints for 20 popular SUVs, model-years 2015–2022',
        description: `Owner complaint counts by model-year, problem area and filing year, plus reported crashes, fires, injuries, deaths and recalls, for ${STUDY_ROWS.length} model-years.`,
        url: canonical,
        dateModified: STUDY_AS_OF,
        temporalCoverage: '2015/2022',
        creator: ORGANIZATION,
        isAccessibleForFree: true,
        isBasedOn: 'https://www.nhtsa.gov/nhtsa-datasets-and-apis',
        variableMeasured: ['Owner complaints', 'Problem area', 'Reported crashes', 'Reported fires', 'Recalls'],
        distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: absoluteUrl(SUV_STUDY_CSV) }],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Vehicle reports', item: `${SITE_URL}/cars` },
          { '@type': 'ListItem', position: 3, name: 'SUV owner complaints study', item: canonical },
        ],
      },
    );
  } else if (page.path === AVERAGE_COST_PATH) {
    // Silo 1 supporting page: BLS household spending on car insurance as CSV, Article + Dataset + Breadcrumb markup.
    const csvFile = path.join(distDir, AVERAGE_COST_CSV.replace(/^\//, ''));
    await fs.mkdir(path.dirname(csvFile), { recursive: true });
    await fs.writeFile(csvFile, spendingCsv());
    const f = spendingFacts();
    structuredData.push(
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'What is the average car insurance cost? What US households spend, by region, age and income',
        description: page.description,
        datePublished: page.updated,
        dateModified: SPENDING_AS_OF,
        author: { '@type': 'Organization', name: 'MyAutoSpex Editorial Team', url: `${SITE_URL}/editorial-policy` },
        publisher: ORGANIZATION,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        isBasedOn: 'https://www.bls.gov/cex/',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: `US household spending on vehicle insurance, ${f.first}–${f.year} (BLS Consumer Expenditure Surveys)`,
        description: `Mean annual spending on vehicle insurance per household: all households ($${f.latest} in ${f.year}) and by region, age of the household head and income fifth.`,
        url: canonical,
        dateModified: SPENDING_AS_OF,
        temporalCoverage: `${f.first}/${f.year}`,
        creator: ORGANIZATION,
        isAccessibleForFree: true,
        isBasedOn: 'https://www.bls.gov/cex/',
        variableMeasured: ['Annual household spending on vehicle insurance (USD)'],
        distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: absoluteUrl(AVERAGE_COST_CSV) }],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Car insurance calculator', item: `${SITE_URL}/insurance-estimator` },
          { '@type': 'ListItem', position: 3, name: 'Average cost', item: canonical },
        ],
      },
    );
  } else if (page.path === '/cars') {
    // The hub's comparison table as a CSV next to the page.
    const csvFile = path.join(distDir, CARS_CSV.replace(/^\//, ''));
    await fs.mkdir(path.dirname(csvFile), { recursive: true });
    await fs.writeFile(csvFile, carsCsv());
    structuredData.push(
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Vehicle reports',
        url: canonical,
        description: page.description,
        publisher: { '@id': ORGANIZATION['@id'] },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: VEHICLES.length,
          itemListElement: VEHICLES.map((v, i) => ({ '@type': 'ListItem', position: i + 1, name: vehicleName(v), url: absoluteUrl(vehiclePath(v)) })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Owner complaints, recalls, crash ratings and fuel economy by model-year',
        description: page.description,
        url: canonical,
        dateModified: VEHICLES.map((v) => v.asOf).sort().pop(),
        creator: ORGANIZATION,
        isAccessibleForFree: true,
        isBasedOn: ['https://www.nhtsa.gov/nhtsa-datasets-and-apis', 'https://www.fueleconomy.gov/feg/ws/'],
        distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: absoluteUrl(CARS_CSV) }],
      },
    );
  } else if (page.path === '/wrap-gallery') {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Car wrap gallery',
      url: canonical,
      description: page.description,
      publisher: { '@id': ORGANIZATION['@id'] },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: WRAP_DESIGNS.length,
        itemListElement: WRAP_DESIGNS.map((d, i) => ({ '@type': 'ListItem', position: i + 1, item: wrapImageObject(d) })),
      },
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
        ...(shareImage && { image: shareImage }),
        publisher: { '@id': ORGANIZATION['@id'] },
      });
    }
    if (page.path === INSURANCE_PATH) {
      // The insurance guide's price data (BLS CPI) as a CSV next to the page, and Dataset markup so it can be cited.
      const csvFile = path.join(distDir, INSURANCE_CSV.replace(/^\//, ''));
      await fs.mkdir(path.dirname(csvFile), { recursive: true });
      await fs.writeFile(csvFile, insuranceCsv());
      const f = insuranceFacts();
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: `US car insurance prices, ${monthName(f.first)} to ${monthName(f.latest)} (BLS consumer price index)`,
        description: `Monthly consumer price index values for motor vehicle insurance, compared with all items, car maintenance and repair, new and used vehicles and gasoline, with car insurance up ${f.fiveYearInsurance}% in the five years to ${monthName(f.latest)}.`,
        url: canonical,
        dateModified: CPI_AS_OF,
        temporalCoverage: `${f.first}/${f.latest}`,
        creator: ORGANIZATION,
        isAccessibleForFree: true,
        isBasedOn: 'https://www.bls.gov/cpi/',
        variableMeasured: ['Consumer price index, motor vehicle insurance', 'Consumer price index, all items'],
        distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: absoluteUrl(INSURANCE_CSV) }],
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
  const galleryImage = page.path === '/wrap-gallery' && WRAP_DESIGNS[0] ? absoluteUrl(designImage(WRAP_DESIGNS[0], 'share')) : undefined;
  await writePage(page.path, {
    title: formatTitle(page.title, page.rawTitle),
    description: page.description,
    canonical,
    noindex: page.noindex,
    image: galleryImage ?? shareImage,
    structuredData,
  });
  count++;
  if (!page.noindex && page.sitemap !== false)
    sitemapEntries.push({
      loc: canonical,
      lastmod:
        page.path === '/wrap-gallery'
          ? [page.updated, ...WRAP_DESIGNS.map((d) => d.created)].sort().pop()
          : page.path === '/cars'
            ? [page.updated, ...VEHICLES.map((v) => v.asOf)].sort().pop()
            : page.updated,
      priority: page.priority,
      images: page.path === '/wrap-gallery' ? WRAP_DESIGNS.map((d) => absoluteUrl(designImage(d, 'large'))) : undefined,
    });
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
  const shareImage = pageShareImage(routePath);
  await writePage(routePath, {
    title: formatTitle(page.seoTitle),
    description: page.description,
    canonical,
    type: 'article',
    image: shareImage,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: `${page.code}: ${page.title}`,
        description: page.description,
        about: { '@type': 'Thing', name: `OBD-II trouble code ${page.code}` },
        dateModified: page.reviewed,
        ...(shareImage && { image: [shareImage] }),
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
          { '@type': 'ListItem', position: 2, name: 'Check engine codes', item: `${SITE_URL}/codes` },
          { '@type': 'ListItem', position: 3, name: page.code, item: canonical },
        ],
      },
    ],
  });
  count++;
  sitemapEntries.push({ loc: canonical, lastmod: page.reviewed, priority: 0.8 });
}

// Vehicle report pages (data/vehicles/), each with its CSV download.
for (const v of VEHICLES) {
  const routePath = vehiclePath(v);
  const canonical = absoluteUrl(routePath);
  const csvPath = vehicleCsvPath(v);
  const csvFile = path.join(distDir, csvPath.replace(/^\//, ''));
  await fs.mkdir(path.dirname(csvFile), { recursive: true });
  await fs.writeFile(csvFile, vehicleCsv(v));
  const name = vehicleName(v);
  const description = vehicleDescription(v);
  await writePage(routePath, {
    title: formatTitle(vehicleSeoTitle(v)),
    description,
    canonical,
    type: 'article',
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: `${name} owner complaints, recalls, crash ratings and fuel economy`,
        description,
        url: canonical,
        dateModified: v.asOf,
        creator: ORGANIZATION,
        isBasedOn: Object.values(v.sources),
        isAccessibleForFree: true,
        keywords: [`${name} problems`, `${name} recalls`, `${name} complaints`, `${name} MPG`, `${name} safety rating`],
        variableMeasured: ['Owner complaints by component', 'Owner complaints by year filed', 'Recalls', 'NHTSA crash ratings', 'EPA fuel economy'],
        distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: absoluteUrl(csvPath) }],
        about: {
          '@type': 'Car',
          name,
          brand: { '@type': 'Brand', name: v.make },
          model: v.model,
          vehicleModelDate: String(v.year),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Vehicle reports', item: `${SITE_URL}/cars` },
          { '@type': 'ListItem', position: 3, name, item: canonical },
        ],
      },
    ],
  });
  count++;
  sitemapEntries.push({ loc: canonical, lastmod: v.asOf, priority: 0.8 });
}

// Wrap gallery designs (data/wraps/gallery.json): one page per published preview.
for (const d of WRAP_DESIGNS) {
  const routePath = designPath(d);
  const canonical = absoluteUrl(routePath);
  await writePage(routePath, {
    title: formatTitle(designSeoTitle(d)),
    description: designDescription(d),
    canonical,
    type: 'article',
    image: absoluteUrl(designImage(d, 'share')),
    structuredData: [
      { '@context': 'https://schema.org', ...wrapImageObject(d), mainEntityOfPage: { '@type': 'WebPage', '@id': canonical } },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Wrap gallery', item: `${SITE_URL}/wrap-gallery` },
          { '@type': 'ListItem', position: 3, name: designTitle(d), item: canonical },
        ],
      },
    ],
  });
  count++;
  sitemapEntries.push({ loc: canonical, lastmod: d.created, priority: 0.6, images: [absoluteUrl(designImage(d, 'large'))] });
}

// Embeddable charts: iframe pages for other sites. Not indexed; canonical points to the page each chart comes from.
for (const [id, e] of Object.entries(EMBEDS)) {
  await writePage(`/embed/chart/${id}`, {
    title: formatTitle(e.title.length > 60 ? `${e.title.slice(0, 57)}…` : e.title, true),
    // Kept to 160 characters: the takeaway, then the source if it fits.
    description: [`${e.title}. Source: ${e.source}. From ${SITE_NAME}.`, `${e.title}. From ${SITE_NAME}.`, e.title].find((d) => d.length <= 160) ?? `${e.title.slice(0, 159)}…`,
    canonical: absoluteUrl(e.page),
    noindex: true,
  });
  count++;
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapEntries
  .map(
    (e) =>
      `  <url>\n    <loc>${escapeHtml(e.loc)}</loc>\n${e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : ''}${
        e.priority != null ? `    <priority>${e.priority.toFixed(1)}</priority>\n` : ''
      }${(e.images ?? []).map((src) => `    <image:image>\n      <image:loc>${escapeHtml(src)}</image:loc>\n    </image:image>\n`).join('')}  </url>`,
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
    line('All check engine code guides', '/codes', 'Every code guide, grouped by system.'),
    ...CODE_PAGES.map((p) => line(`${p.code}: ${p.title}`, `/codes/${p.code.toLowerCase()}`, p.description)),
    '',
    '## Data studies (original analysis of government data, with CSV)',
    '',
    line(
      'How much has car insurance gone up? (BLS price data)',
      INSURANCE_PATH,
      `US car insurance prices from the BLS consumer price index, ${monthName(insuranceFacts().first)} to ${monthName(insuranceFacts().latest)}: trend, yearly changes and other driving costs, with a car insurance calculator. CSV: ${absoluteUrl(INSURANCE_CSV)}`,
    ),
    line(
      'What is the average car insurance cost? (BLS household spending)',
      AVERAGE_COST_PATH,
      `What US households spend on car insurance a year and a month, ${spendingFacts().first}–${spendingFacts().year}, by region, age and income. CSV: ${absoluteUrl(AVERAGE_COST_CSV)}`,
    ),
    line('Which used SUVs get the most owner complaints? (2015–2022)', SUV_STUDY_PATH, `NHTSA complaint counts for 20 popular SUVs by model-year, model, problem area and filing year. CSV: ${absoluteUrl(SUV_STUDY_CSV)}`),
    '',
    '## Vehicle reports (NHTSA and EPA data, refreshed weekly)',
    '',
    line('All vehicle reports', '/cars', `Model-years compared by owner complaints, engine share and recalls. CSV: ${absoluteUrl(CARS_CSV)}`),
    ...VEHICLES.map((v) => line(`${vehicleName(v)}: problems, recalls and safety ratings`, vehiclePath(v), `${vehicleDescription(v)} CSV: ${absoluteUrl(vehicleCsvPath(v))}`)),
    '',
    '## Car wrap gallery (AI wrap previews, free to reuse with credit under CC BY 4.0)',
    '',
    line('Car wrap gallery', '/wrap-gallery', 'Wrap colors, finishes and coverage on real models, filterable by finish and coverage.'),
    ...WRAP_DESIGNS.map((d) => line(designTitle(d), designPath(d), `Image: ${absoluteUrl(designImage(d, 'large'))}`)),
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
