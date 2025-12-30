import React, { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    canonical?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description, canonical }) => {
    useEffect(() => {
        // Update Title
        document.title = title + " | AutoSpex";

        // Update Meta Description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            if (description) {
                metaDesc.setAttribute('content', description);
            }
        } else if (description) {
            const meta = document.createElement('meta');
            meta.name = "description";
            meta.content = description;
            document.head.appendChild(meta);
        }

        // Update Canonical URL
        let linkCanonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            if (linkCanonical) {
                linkCanonical.setAttribute('href', canonical);
            } else {
                linkCanonical = document.createElement('link');
                linkCanonical.setAttribute('rel', 'canonical');
                linkCanonical.setAttribute('href', canonical);
                document.head.appendChild(linkCanonical);
            }
        }
    }, [title, description, canonical]);

    return null;
};

export default SEO;
