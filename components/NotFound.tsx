import React from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO';
import { NOT_FOUND_META } from '../seo/site';

const NotFound: React.FC = () => (
  <div className="w-full max-w-2xl mx-auto py-20 text-center">
    <SEO title={NOT_FOUND_META.title} description={NOT_FOUND_META.description} noindex />
    <p className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">404</p>
    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
      Page not found
    </h1>
    <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
      The page you were looking for does not exist or has moved.
    </p>
    <div className="flex flex-wrap justify-center gap-3">
      <Link to="/" className="px-5 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold">
        Go to the homepage
      </Link>
      <Link to="/fault-code-decoder" className="px-5 py-3 rounded-full border border-slate-300 dark:border-slate-700 font-bold">
        Decode a fault code
      </Link>
      <Link to="/blog" className="px-5 py-3 rounded-full border border-slate-300 dark:border-slate-700 font-bold">
        Read the blog
      </Link>
    </div>
  </div>
);

export default NotFound;
