import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { focusRing } from './tool/kit';
import { formatDay, guidesForTool, useArticleIndex, type ArticleSummary } from '../Article/articleIndex';
import { TOOL_CATEGORIES } from '../data/tools';

interface GuideListProps {
  id: string;
  heading: string;
  articles: ArticleSummary[];
  /** Show a link to the full blog list next to the heading. */
  showAllLink?: boolean;
  className?: string;
}

/** A row of article links: used for "Latest guides", "Related guides" and the guides under each tool. */
const GuideList: React.FC<GuideListProps> = ({ id, heading, articles, showAllLink, className }) => {
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby={id} className={cn('w-full', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id={id} className="font-heading text-[1.75rem] leading-tight font-extrabold tracking-[-0.015em] sm:text-[2rem]">
          {heading}
        </h2>
        {showAllLink && (
          <Link to="/blog" className={cn('rounded-sm font-bold text-sign-green underline underline-offset-4 dark:text-white', focusRing)}>
            All articles
          </Link>
        )}
      </div>
      <ul className="mt-6 grid gap-8 md:grid-cols-3">
        {articles.map((a) => (
          <li key={a.slug} className="border-t border-border pt-4">
            {a.day && (
              <time dateTime={a.day} className="text-sm text-muted-foreground">
                {formatDay(a.day)}
              </time>
            )}
            <h3 className="mt-1 text-[1.1875rem] leading-snug font-extrabold">
              <Link to={`/article/${a.slug}`} className={cn('rounded-sm hover:underline hover:underline-offset-4', focusRing)}>
                {a.title}
              </Link>
            </h3>
            <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{a.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default GuideList;

const TOOL_PATHS = new Set(TOOL_CATEGORIES.flatMap((c) => c.tools.map((t) => t.path)));

/** Under each tool page: the guides that link to that tool. */
export const ToolGuides: React.FC<{ path: string }> = ({ path }) => {
  const articles = useArticleIndex();
  if (!TOOL_PATHS.has(path)) return null;
  return <GuideList id="tool-guides" heading="Guides for this tool" articles={guidesForTool(path, articles, 3)} className="mt-20" />;
};
