// Product suggestions in the site's flat panel style. Text only: no star ratings,
// prices or product photos, which go stale and which Amazon allows only through
// its own tools. Every link is marked sponsored and the disclosure is always shown.
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { focusRing } from './kit';

export interface ProductPick {
  name: string;
  /** What it's for, in one plain sentence. */
  use: string;
  url: string;
}

export function ProductPicks({
  id,
  title,
  intro,
  items,
  className,
}: {
  id: string;
  title: string;
  intro?: string;
  items: ProductPick[];
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn('mt-16', className)}>
      <h2 id={id} className="font-heading text-2xl font-extrabold">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-[62ch] text-muted-foreground">{intro}</p>}
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <li key={p.name} className="flex flex-col rounded-xl border border-border bg-card p-5">
            <h3 className="font-bold leading-snug">{p.name}</h3>
            <p className="mt-1.5 flex-1 text-[0.9375rem] text-muted-foreground">{p.use}</p>
            <a
              href={p.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className={cn('mt-4 inline-flex items-center gap-1.5 self-start font-semibold underline underline-offset-4', focusRing)}
            >
              See it on Amazon
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        Affiliate links: as an Amazon Associate, MyAutoSpex may earn from qualifying purchases, at no extra cost to you. Picks aren't paid
        placements.
      </p>
    </section>
  );
}
