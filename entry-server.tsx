// Server entry used only at build time by scripts/prerender.mjs.
// It renders a route to static HTML so search engines and AI crawlers get
// real content, links and metadata without having to run JavaScript.
import React from 'react';
import { Writable } from 'node:stream';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import App from './App';

export { SITE_URL, SITE_NAME, STATIC_PAGES, NOT_FOUND_META, formatTitle, absoluteUrl } from './seo/site';

export interface ArticleMeta {
  slug: string;
  title: string;
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
