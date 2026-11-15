// A small list of every article (title, description, date, image, linked tools).
//
// In production it is embedded in each prerendered page as
// <script id="article-index" type="application/json"> by scripts/prerender.mjs,
// so the homepage, the blog list, related guides and tool pages can link to
// articles without downloading any article code. During the build-time render
// the same list is read from globalThis (set by entry-server.tsx), so the
// server and browser render identical links.
import { useEffect, useState } from 'react';

export interface ArticleSummary {
  slug: string;
  title: string;
  description: string;
  category?: string;
  author?: string;
  /** Publication day as YYYY-MM-DD. */
  day?: string;
  /** Publication time as YYYY-MM-DDTHH:mm:ss, used to order articles published on the same day. */
  published?: string;
  /** Featured image URL. */
  image?: string;
  /** Tool paths the article links to, most-linked first, such as "/vin-lookup". */
  tools: string[];
}

declare global {
  // eslint-disable-next-line no-var
  var __ARTICLE_INDEX__: ArticleSummary[] | undefined;
}

let cache: ArticleSummary[] | null = null;

export function readArticleIndex(): ArticleSummary[] {
  if (typeof document === 'undefined') return globalThis.__ARTICLE_INDEX__ ?? [];
  if (cache) return cache;
  const el = document.getElementById('article-index');
  try {
    cache = el?.textContent ? (JSON.parse(el.textContent) as ArticleSummary[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

/** "2026-02-15T20:10:00" or "Feb 15, 2026 14:00:00" -> "2026-02-15" (the calendar date as written). */
export function toDay(value?: string): string | undefined {
  if (!value) return undefined;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "2026-02-15T20:10:00" or "Feb 15, 2026 14:00:00" -> "2026-02-15T20:10:00", for sorting. */
export function toPublished(value?: string): string | undefined {
  if (!value) return undefined;
  const iso = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}(?::\d{2})?))?/.exec(value);
  if (iso) return `${iso[1]}T${(iso[2] ?? '00:00:00').padEnd(8, ':00')}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${toDay(value)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-02-15" -> "Feb 15, 2026". Same output in every time zone. */
export function formatDay(day?: string): string {
  if (!day) return '';
  const [y, m, d] = day.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function sortNewestFirst(list: ArticleSummary[]): ArticleSummary[] {
  return [...list].sort((a, b) => (b.published ?? b.day ?? '').localeCompare(a.published ?? a.day ?? ''));
}

/** Articles that share the most tools (then category) with the given one, newest first on ties. */
export function relatedArticles(slug: string, list: ArticleSummary[], count = 3): ArticleSummary[] {
  const current = list.find((a) => a.slug === slug);
  if (!current) return [];
  return sortNewestFirst(list)
    .filter((a) => a.slug !== slug)
    .map((a) => ({
      a,
      score: a.tools.filter((t) => current.tools.includes(t)).length * 2 + (a.category && a.category === current.category ? 1 : 0),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, count)
    .map((x) => x.a);
}

/** Guides that link to a tool: those where it is the most-linked tool first, then newest. */
export function guidesForTool(path: string, list: ArticleSummary[], count = 4): ArticleSummary[] {
  return sortNewestFirst(list.filter((a) => a.tools.includes(path)))
    .sort((a, b) => a.tools.indexOf(path) - b.tools.indexOf(path))
    .slice(0, count);
}

/**
 * The article list for rendering. In `npm run dev` (no prerender) the embedded
 * list is missing, so it is loaded from the posts after the first render instead.
 */
export function useArticleIndex(): ArticleSummary[] {
  const [list, setList] = useState<ArticleSummary[]>(readArticleIndex);
  useEffect(() => {
    if (!import.meta.env.DEV || list.length > 0) return;
    const modules = import.meta.glob<Record<string, any>>('./posts/*.tsx', { import: 'meta' });
    Promise.all(
      Object.entries(modules).map(async ([path, load]) => {
        const meta = await load();
        return {
          slug: path.split('/').pop()!.replace(/\.tsx$/, ''),
          title: meta.title,
          description: meta.description ?? '',
          category: meta.category,
          author: meta.authorName,
          day: toDay(meta.date),
          published: toPublished(meta.date),
          image: meta.featuredImage,
          tools: [],
        } as ArticleSummary;
      }),
    ).then(setList);
  }, [list.length]);
  return list;
}
