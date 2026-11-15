// Server entry used only at build time by scripts/prerender.mjs.
// It renders a route to static HTML so search engines and AI crawlers get
// real content, links and metadata without having to run JavaScript.
import React from 'react';
import { Writable } from 'node:stream';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { TOOL_CATEGORIES } from './data/tools';
import { toDay, toPublished, type ArticleSummary } from './Article/articleIndex';

export { SITE_URL, SITE_NAME, STATIC_PAGES, NOT_FOUND_META, formatTitle, absoluteUrl } from './seo/site';

// Tool pages (name, path, one-line description), for WebApplication markup and llms.txt.
export const TOOLS = TOOL_CATEGORIES.flatMap((c) => c.tools.map((t) => ({ name: t.name, path: t.path, description: t.description })));

export interface ArticleMeta {
  slug: string;
  title: string;
  /** Shorter title for search results; falls back to `title`. */
  seoTitle?: string;
  description: string;
  date?: string;
  authorName?: string;
  authorRole?: string;
  category?: string;
  featuredImage?: string;
}

const postMeta = import.meta.glob<Omit<ArticleMeta, 'slug'> & { slug?: string }>('./Article/posts/*.tsx', {
  eager: true,
  import: 'meta',
});

// The slug is the file name, matching how Article/components/ArticleLoader.tsx resolves URLs.
export const ARTICLES: ArticleMeta[] = Object.entries(postMeta)
  .filter(([, meta]) => meta && meta.title)
  .map(([path, meta]) => ({ ...meta, slug: path.split('/').pop()!.replace(/\.tsx$/, '') }));

// Each post's source, used only here at build time to see which tools it links to.
const postSource = import.meta.glob<string>('./Article/posts/*.tsx', { eager: true, query: '?raw', import: 'default' });
const TOOL_PATHS = TOOL_CATEGORIES.flatMap((c) => c.tools.map((t) => t.path));

function linkedTools(slug: string): string[] {
  const source = postSource[`./Article/posts/${slug}.tsx`] ?? '';
  const hrefs = [...source.matchAll(/href="(\/[a-z0-9-]+)"/g)].map((m) => m[1]);
  // Most-linked tool first, so "Guides for this tool" can favour articles that are mainly about it.
  const count = (path: string) => hrefs.filter((h) => h === path).length;
  return TOOL_PATHS.filter((path) => count(path) > 0).sort((a, b) => count(b) - count(a) || hrefs.indexOf(a) - hrefs.indexOf(b));
}

// The list embedded in every page (see Article/articleIndex.ts). Set before any render.
export const ARTICLE_INDEX: ArticleSummary[] = ARTICLES.map((a) => ({
  slug: a.slug,
  title: a.title,
  description: a.description,
  category: a.category,
  author: a.authorName,
  day: toDay(a.date),
  published: toPublished(a.date),
  image: a.featuredImage,
  tools: linkedTools(a.slug),
}));
globalThis.__ARTICLE_INDEX__ = ARTICLE_INDEX;

export async function render(url: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <React.StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </React.StrictMode>,
    // Never move large sections into hidden <div>s that a script swaps in later:
    // crawlers that do not run JavaScript would see that content as hidden.
    { progressiveChunkSize: Number.MAX_SAFE_INTEGER },
  );

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });
    sink.on('finish', resolve);
    sink.on('error', reject);
    prelude.on('error', reject);
    prelude.pipe(sink);
  });
  return Buffer.concat(chunks).toString('utf8');
}
