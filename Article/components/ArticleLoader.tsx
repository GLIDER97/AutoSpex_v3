import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ArticleLoader: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [Component, setComponent] = useState<React.ComponentType | null>(null);

    useEffect(() => {
        const loadArticle = async () => {
            try {
                // Dynamic import of all posts in the posts directory
                // eagerly: false ensures we only load what we need
                const modules = import.meta.glob('../posts/*.tsx');

                // Construct the expected file path key
                // Use a naming convention where slug matches filename
                // e.g. /article/FreeObd2CodeDecoderPost matches FreeObd2CodeDecoderPost.tsx
                // OR we can make a map. For now, strict filename matching is simplest for "AI Ready".
                const matchingModuleKey = Object.keys(modules).find(key =>
                    key.toLowerCase().includes(slug?.toLowerCase() || '')
                );

                if (matchingModuleKey && modules[matchingModuleKey]) {
                    const mod = await modules[matchingModuleKey]() as { default: React.ComponentType };
                    setComponent(() => mod.default);
                } else {
                    console.error(`Article not found: ${slug}`);
                    navigate('/'); // Or to a 404 page
                }
            } catch (error) {
                console.error("Failed to load article", error);
                navigate('/');
            }
        };

        if (slug) {
            loadArticle();
        }
    }, [slug, navigate]);

    if (!Component) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Component />
        </Suspense>
    );
};

export default ArticleLoader;
