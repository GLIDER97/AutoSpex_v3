# SEO setup

## How pages reach Google

`npm run build` does three things:

1. `vite build` builds the browser app into `dist/`.
2. `vite build --ssr entry-server.tsx` builds a server copy of the app into `dist-ssr/`.
3. `node scripts/prerender.mjs` renders every page to its own HTML file, so search engines
   and AI crawlers get the full text, links and metadata without running JavaScript:
   - `dist/<page>.html` and `dist/article/<slug>.html`, each with a unique title, meta
     description, canonical URL, Open Graph tags and JSON-LD structured data
   - `dist/sitemap.xml` listing every page and article
   - `dist/robots.txt` pointing to the sitemap
   - `dist/404.html`, which Vercel serves with a real 404 status for unknown URLs
   - `dist/llms.txt`, a plain-language list of the tools and guides for AI assistants
   - a small article list in every page (`<script id="article-index">`), read by
     `Article/articleIndex.ts` for "Latest guides", the blog list, "Related guides" under each
     article and "Guides for this tool" under each tool, so none of those load article code

Pages without their own image share `public/og-image.png` (1200×630) on social media.

`vercel.json` turns on `cleanUrls`, so `dist/blog.html` is served at `/blog`.

## Adding or changing pages

- **New article:** add `Article/posts/<slug>.tsx` with an `export const meta = {...}` block,
  like the existing posts (see `Article/AI_blog_prompt.txt`). The file name is the URL
  (`/article/<slug>`). It is added to the blog, the sitemap and the prerender automatically.
  - Give it a `seoTitle` of 47 characters or less and a description of 160 or less.
  - Link to at least one tool with `<a href="/tool-path">`: the build reads those links and
    lists the article under "Guides for this tool" on that tool's page.
  - Use WebP images no wider than 1200 px, with `width`, `height` and `loading="lazy"`.
- **New tool or info page:** add the route in `routes.tsx` **and** an entry (path, title,
  description) in `seo/site.ts`. Pages missing from `seo/site.ts` are not prerendered and
  return a 404 on Vercel.
- The site URL (`https://www.myautospex.com`) lives in `seo/site.ts`.

## Google Search Console

The site is verified as the URL-prefix property `https://www.myautospex.com/`.

After each deploy that adds pages:

1. In Search Console, open **Sitemaps**, enter `sitemap.xml` and click **Submit** (once; Google
   re-reads it afterwards).
2. For new or important pages, paste the URL into **URL inspection** at the top and click
   **Request indexing**.

## Claude SEO plugin

This repo enables the [claude-seo](https://github.com/AgriciDaniel/claude-seo) plugin in
`.claude/settings.json`. When you open the project in Claude Code and trust the folder, it
offers to install it. Then run:

```
/seo setup
/seo audit https://www.myautospex.com
```

To give it Search Console data on your own machine, run `/seo google setup` and follow its
steps (a Google Cloud service account added as a user on the Search Console property).
