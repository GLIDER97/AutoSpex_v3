import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import SEO from '../../components/SEO';
import GuideList from '../../components/GuideList';
import { SignMarker } from '../../components/brand';
import { focusRing } from '../../components/tool/kit';
import { formatDay, relatedArticles, toDay, useArticleIndex } from '../articleIndex';

interface BlogMeta {
  title: string;
  /** Shorter title for search results (about 47 characters or less); falls back to `title`. */
  seoTitle?: string;
  description: string;
  date: string;
  authorName: string;
  authorRole: string;
  category?: string;
}

interface BlogTemplateProps {
  meta: BlogMeta;
  children: React.ReactNode;
}

// The posts were written with their own Tailwind classes (slate text, blue links, heavy headings).
// These descendant rules outrank those single-class utilities, so every article reads in the
// site's own type scale and colors without editing each post.
const BODY = cn(
  'mt-10 text-[1.125rem] leading-[1.75] text-foreground/90',
  '[&_p]:mb-5 [&_p]:leading-[1.75] [&_p]:text-foreground/90',
  '[&_li]:leading-[1.7] [&_li]:text-foreground/90 [&_ul]:my-5 [&_ol]:my-5',
  '[&_h2]:mt-14 [&_h2]:mb-5 [&_h2]:font-heading [&_h2]:text-[1.75rem] [&_h2]:leading-tight [&_h2]:font-extrabold [&_h2]:tracking-[-0.015em] [&_h2]:text-foreground',
  '[&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:font-heading [&_h3]:text-[1.3125rem] [&_h3]:leading-snug [&_h3]:font-extrabold [&_h3]:text-foreground',
  '[&_a]:font-semibold [&_a]:text-sign-green [&_a]:underline [&_a]:underline-offset-4 dark:[&_a]:text-[#4cc38a]',
  '[&_strong]:text-foreground',
  // `dark:` utilities in the posts carry an extra class, so the dark theme needs its own overrides.
  'dark:[&_p]:text-foreground/90 dark:[&_li]:text-foreground/90 dark:[&_h2]:text-foreground dark:[&_h3]:text-foreground dark:[&_strong]:text-foreground',
  '[&_figure]:my-10 [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_img]:shadow-none',
  '[&_table]:my-6 [&_table]:w-full [&_table]:text-[0.9375rem] [&_th]:text-left [&_th]:font-bold [&_td]:border-t [&_td]:border-border [&_td]:py-2 [&_th]:py-2',
);

const BlogTemplate: React.FC<BlogTemplateProps> = ({ meta, children }) => {
  const { slug = '' } = useParams<{ slug: string }>();
  // The calendar date as written in `meta.date`, formatted the same in every time zone.
  const day = toDay(meta.date);
  const related = relatedArticles(slug, useArticleIndex());

  return (
    <div className="w-full max-w-6xl">
      {/* Title, description and canonical for every article (prerendered into the HTML as well). */}
      <SEO title={meta.seoTitle || meta.title} description={meta.description} />

      <article className="mx-auto max-w-[44rem]">
        <nav aria-label="Breadcrumb" className="text-[0.9375rem] text-muted-foreground">
          <Link to="/blog" className={cn('font-semibold text-foreground underline-offset-4 hover:underline', focusRing)}>
            Guides
          </Link>
          <span aria-hidden="true" className="mx-2">
            ›
          </span>
          <span>{meta.category && meta.category !== 'Articles & Guides' ? meta.category : 'Car ownership'}</span>
        </nav>

        <h1 className="mt-4 font-heading text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl">{meta.title}</h1>
        <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{meta.description}</p>

        <div className="mt-8 flex items-center gap-3 border-y border-border py-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card">
            <SignMarker category="warnings" className="size-6" />
          </span>
          <div className="min-w-0 text-[0.9375rem]">
            <p className="font-bold">{meta.authorName}</p>
            <p className="text-muted-foreground">
              <time dateTime={day}>Updated {day ? formatDay(day) : meta.date}</time>
              <span aria-hidden="true" className="mx-1.5">
                ·
              </span>
              <Link to="/editorial-policy" className={cn('underline underline-offset-4 hover:text-foreground', focusRing)}>
                How we write our guides
              </Link>
            </p>
          </div>
        </div>

        <div className={BODY}>{children}</div>

        <aside className="mt-14 rounded-xl border border-border bg-card p-5 text-[0.9375rem] text-muted-foreground">
          General information, not a diagnosis or a quote. Prices vary by region, vehicle and shop. Spot a mistake?{' '}
          <Link to="/contact" className={cn('font-semibold text-foreground underline underline-offset-4', focusRing)}>
            Tell us
          </Link>
          .
        </aside>
      </article>

      {/* Links to other articles, so each guide is reachable from the others. */}
      <GuideList id="related-guides" heading="Related guides" articles={related} className="mx-auto mt-14 max-w-[44rem]" />
    </div>
  );
};

export default BlogTemplate;
