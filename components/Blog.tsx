
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ArrowRight } from './Icons';
import { formatDay, sortNewestFirst, useArticleIndex } from '../Article/articleIndex';

const Blog: React.FC = () => {
  // From the small article index embedded in the page, so no article code is downloaded here.
  const posts = sortNewestFirst(useArticleIndex());

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-bold text-blue-600 dark:text-blue-400 mb-8 shadow-xs">
          <BookOpen className="w-4 h-4" />
          Articles & Guides
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
          Blog & <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600">
            Resources
          </span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl leading-relaxed font-medium">
          Expert insights, guides, and tips to help you understand your vehicle better and save on repairs.
        </p>
      </div>

      {/* Blog Grid - 3×3 Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {posts.map((post, i) => (
          <Link
            key={post.slug}
            to={`/article/${post.slug}`}
            className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
          >
            {/* Featured Image */}
            <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
              <img
                src={post.image}
                alt={post.title}
                // The first row is on screen at load; the rest load as the reader scrolls.
                loading={i < 3 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined}
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  // Fallback placeholder
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBQbGFjZWhvbGRlcjwvdGV4dD48L3N2Zz4=';
                }}
              />
              {/* Date Badge */}
              {post.day && (
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  {formatDay(post.day)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-6">
              {/* Title */}
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {post.title}
              </h2>

              {/* Excerpt */}
              <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 flex-1">
                {post.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-200">Author:</span>
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:gap-3 transition-all">
                  Read More <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No articles yet</h3>
          <p className="text-slate-500 dark:text-slate-500">Check back soon for new content!</p>
        </div>
      )}
    </div>
  );
};

export default Blog;
