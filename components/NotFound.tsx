import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import SEO from './SEO';
import { PageImage } from './PageImage';
import { focusRing } from './tool/kit';
import { NOT_FOUND_META } from '../seo/site';

const button = 'inline-flex h-11 items-center justify-center rounded-lg px-5 text-base font-bold transition-colors';

const NotFound: React.FC = () => (
  <div className="mx-auto w-full max-w-2xl py-8 text-center sm:py-12">
    <SEO title={NOT_FOUND_META.title} description={NOT_FOUND_META.description} noindex />
    <PageImage path="/404" sizes="(min-width: 640px) 32rem, 100vw" className="mx-auto mb-10 aspect-video max-w-lg" />
    <h1 className="font-heading text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.02em] sm:text-5xl">Page not found</h1>
    <p className="mt-4 text-lg leading-relaxed text-muted-foreground">The page you were looking for doesn't exist or has moved.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link to="/" className={cn(button, 'bg-sign-green text-white hover:bg-sign-green-strong', focusRing)}>
        Go to the homepage
      </Link>
      <Link to="/fault-code-decoder" className={cn(button, 'border border-input bg-card hover:bg-muted', focusRing)}>
        Decode a fault code
      </Link>
      <Link to="/blog" className={cn(button, 'border border-input bg-card hover:bg-muted', focusRing)}>
        Read the guides
      </Link>
    </div>
  </div>
);

export default NotFound;
