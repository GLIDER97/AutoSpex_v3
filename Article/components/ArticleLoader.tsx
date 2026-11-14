import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import NotFound from '../../components/NotFound';

// One lazily loaded component per post. The URL slug must equal the file
// name: /article/vin-lemon-check-2026 -> posts/vin-lemon-check-2026.tsx.
// React.lazy (rather than loading in an effect) lets the build-time
// prerender wait for the article and write its full text into the HTML.
const modules = import.meta.glob<{ default: React.ComponentType }>('../posts/*.tsx');

const ARTICLES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {};
for (const [path, load] of Object.entries(modules)) {
    const slug = path.split('/').pop()!.replace(/\.tsx$/, '');
    ARTICLES[slug] = React.lazy(load);
}

const ArticleSpinner = () => (
    <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
);

const ArticleLoader: React.FC = () => {
    const { slug = '' } = useParams<{ slug: string }>();
    const Article = ARTICLES[slug];

    // Unknown slugs get a real "not found" page instead of a redirect to the
    // homepage, which Google treats as a soft 404.
    if (!Article) return <NotFound />;

    return (
        <Suspense fallback={<ArticleSpinner />}>
            <Article />
        </Suspense>
    );
};

export default ArticleLoader;
