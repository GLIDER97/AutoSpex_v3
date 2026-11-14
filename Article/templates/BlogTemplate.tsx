import React from 'react';

// Interfaces for strict type checking
interface BlogMeta {
    title: string;
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

// "2026-02-15T20:10:00" -> "Feb 15, 2026". Falls back to the raw string if it can't be parsed.
function formatDate(value: string): { label: string; iso?: string } {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { label: value };
    return {
        label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d),
        // Local date parts (like the label) so the server and browser agree in every time zone.
        iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    };
}

const BlogTemplate: React.FC<BlogTemplateProps> = ({ meta, children }) => {
    const date = formatDate(meta.date);
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-6 sm:px-8 lg:px-12">
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">

                {/* Standardized Header */}
                <header className="px-6 pt-12 pb-10 sm:px-12 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 tracking-wide uppercase">
                            {meta.category || 'Article'}
                        </span>
                        <time dateTime={date.iso} className="text-sm text-slate-500 dark:text-slate-400 font-medium">Updated {date.label}</time>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                        {meta.title}
                    </h1>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {meta.authorName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">{meta.authorName}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{meta.authorRole}</div>
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
        </div>
    );
};

export default BlogTemplate;
