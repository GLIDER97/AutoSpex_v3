import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TOOL_CATEGORIES } from '../data/tools';
import { SignMarker, Wordmark } from './brand';

const FEEDBACK_URL = 'https://forms.gle/XtuvETokH5R83r1q7';

const linkClass = cn(
  'rounded-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
  'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
);

const COMPANY_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/editorial-policy', label: 'Editorial policy' },
  { to: '/blog', label: 'Articles' },
  { to: '/codes', label: 'Check engine code guides' },
  { to: '/wrap-gallery', label: 'Car wrap gallery' },
  { to: '/privacy-policy', label: 'Privacy policy' },
  { to: '/terms-of-service', label: 'Terms of service' },
  { to: '/cookie-policy', label: 'Cookie policy' },
];

const Footer: React.FC = () => {
  return (
    <footer className="relative z-20 border-t border-border bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(5,1fr)]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" aria-label="MyAutoSpex home" className={cn('inline-block', linkClass)}>
              <Wordmark />
            </Link>
            <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed">
              Free tools that explain car problems and car costs in plain English. No account needed.
            </p>
            <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className={cn('mt-4 inline-block text-[0.9375rem] font-semibold text-foreground underline underline-offset-4', linkClass)}>
              Send feedback
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-5">
            {TOOL_CATEGORIES.map((category) => (
              <div key={category.id}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <SignMarker category={category.id} className="size-4" />
                  {category.name}
                </h2>
                <ul className="space-y-2 text-[0.9375rem]">
                  {category.tools.map((tool) => (
                    <li key={tool.path}>
                      <Link to={tool.path} className={linkClass}>
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h2 className="mb-3 text-sm font-bold text-foreground">MyAutoSpex</h2>
              <ul className="space-y-2 text-[0.9375rem]">
                {COMPANY_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-sm text-slate-600 dark:text-slate-400 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} MyAutoSpex</p>
          <p className="max-w-[60ch]">
            Estimates are for information only. Have a qualified mechanic confirm a diagnosis before you pay for a repair.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
