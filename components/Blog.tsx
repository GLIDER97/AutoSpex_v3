import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { focusRing } from './tool/kit';
import { formatDay, sortNewestFirst, useArticleIndex } from '../Article/articleIndex';

const Blog: React.FC = () => {
  // From the small article index embedded in the page, so no article code is downloaded here.
  const posts = sortNewestFirst(useArticleIndex());
  const [lead, ...rest] = posts;

  return (
    <div className="w-full max-w-6xl">
      <header className="mb-10 max-w-3xl">
        <h1 className="font-heading text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.02em] sm:text-5xl">Car ownership guides</h1>
        <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
          Plain-English guides to warning lights, repair costs, insurance and buying smart. Written by the MyAutoSpex Editorial Team,{' '}
          <Link to="/editorial-policy" className={cn('font-semibold text-foreground underline underline-offset-4', focusRing)}>
            reviewed before publishing
          </Link>
          .
        </p>
      </header>

      {posts.length === 0 && <p className="text-muted-foreground">New guides are on the way.</p>}

      {lead && (
        <Link
          to={`/article/${lead.slug}`}
          className={cn('group grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-[1.2fr_1fr]', focusRing)}
        >
          <img
            src={lead.image}
            alt=""
            width={1200}
            height={675}
            fetchPriority="high"
            decoding="async"
            className="aspect-video size-full object-cover md:aspect-auto md:min-h-80"
          />
          <div className="flex flex-col justify-center p-6 sm:p-8">
            {lead.day && <p className="text-sm text-muted-foreground">{formatDay(lead.day)}</p>}
            <h2 className="mt-2 font-heading text-[1.75rem] leading-tight font-extrabold tracking-[-0.015em] group-hover:underline group-hover:underline-offset-4">
              {lead.title}
            </h2>
            <p className="mt-3 text-muted-foreground">{lead.description}</p>
            <p className="mt-5 font-semibold">Read the guide →</p>
          </div>
        </Link>
      )}

      <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((post, i) => (
          <li key={post.slug}>
            <Link to={`/article/${post.slug}`} className={cn('group block rounded-xl', focusRing)}>
              <img
                src={post.image}
                alt=""
                width={1200}
                height={675}
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
                className="aspect-video w-full rounded-xl border border-border object-cover"
              />
              {post.day && <p className="mt-4 text-sm text-muted-foreground">{formatDay(post.day)}</p>}
              <h2 className="mt-1 text-lg leading-snug font-bold group-hover:underline group-hover:underline-offset-4">{post.title}</h2>
              <p className="mt-2 line-clamp-3 text-[0.9375rem] text-muted-foreground">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Blog;
