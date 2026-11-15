import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../../components/SEO';
import GuideList from '../../components/GuideList';
import { formatDay, relatedArticles, toDay, useArticleIndex } from '../articleIndex';

// Interfaces for strict type checking
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

const BlogTemplate: React.FC<BlogTemplateProps> = ({ meta, children }) => {
    const { slug = '' } = useParams<{ slug: string }>();
    // The calendar date as written in `meta.date`, formatted the same in every time zone.
    const day = toDay(meta.date);
    const related = relatedArticles(slug, useArticleIndex());

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-6 sm:px-8 lg:px-12">
            {/* Title, description and canonical for every article (prerendered into the HTML as well). */}
            <SEO title={meta.seoTitle || meta.title} description={meta.description} />

            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">

                {/* Standardized Header */}
                <header className="px-6 pt-12 pb-10 sm:px-12 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 tracking-wide uppercase">
                            {meta.category || 'Article'}
                        </span>
                        <time dateTime={day} className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Updated {day ? formatDay(day) : meta.date}
                        </time>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                        {meta.title}
                    </h1>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src="/favicon.svg" alt="" width={48} height={48} className="w-12 h-12 rounded-full bg-white p-1.5 shadow-md" />
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">{meta.authorName}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {meta.authorRole}
                                    <span aria-hidden="true" className="mx-1.5">·</span>
                                    <Link to="/editorial-policy" className="underline underline-offset-2 hover:text-slate-900 dark:hover:text-white">
                                        How we write our guides
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Article Content Wrapper with Standardized Typography */}
                {/* Added leading-loose for better line spacing and overridden img margins */}
                <article className="prose prose-lg prose-slate dark:prose-invert max-w-none px-6 py-10 sm:px-12 prose-p:!leading-loose prose-li:!leading-relaxed space-y-6">
                    {children}
                </article>

            </div>

            {/* Links to other articles, so each guide is reachable from the others. */}
            <GuideList id="related-guides" heading="Related guides" articles={related} className="max-w-3xl mx-auto mt-14" />
        </div>
    );
};

export default BlogTemplate;
