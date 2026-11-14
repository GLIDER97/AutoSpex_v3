import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { absoluteUrl, formatTitle } from '../seo/site';

interface SEOProps {
    title: string;
    description?: string;
    /** Absolute or root-relative canonical URL. Defaults to the current path. */
    canonical?: string;
    /** Use the title as-is, without the " | MyAutoSpex" suffix. */
    rawTitle?: boolean;
    noindex?: boolean;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

/**
 * Keeps the document head in sync during client-side navigation.
 * The initial HTML for every page is generated at build time by
 * scripts/prerender.mjs, so crawlers see the same tags without running JS.
 */
const SEO: React.FC<SEOProps> = ({ title, description, canonical, rawTitle, noindex }) => {
    const { pathname } = useLocation();

    useEffect(() => {
        const fullTitle = formatTitle(title, rawTitle);
        document.title = fullTitle;
        upsertMeta('property', 'og:title', fullTitle);

        if (description) {
            upsertMeta('name', 'description', description);
            upsertMeta('property', 'og:description', description);
        }

        const robots = document.head.querySelector('meta[name="robots"]');
        if (noindex) {
            upsertMeta('name', 'robots', 'noindex, follow');
        } else if (robots) {
            robots.remove();
        }

        let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (noindex) {
            link?.remove();
        } else {
            const href = absoluteUrl(canonical || pathname);
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }
            link.setAttribute('href', href);
            upsertMeta('property', 'og:url', href);
        }
    }, [title, description, canonical, rawTitle, noindex, pathname]);

    return null;
};

export default SEO;
