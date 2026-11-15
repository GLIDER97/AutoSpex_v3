// Shop cards for /api/places results: real Google ratings, review counts,
// open-now status, phone, website and directions. Used by the mechanic finder
// and the wrap visualizer.
import React, { useState } from 'react';
import { ExternalLink, Globe, MapPin, Phone, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { weightedRating, type Shop, type ShopSearch } from '../../utils/places';
import { Notice, focusRing } from './kit';

const linkButton = cn(
  'inline-flex h-10 min-w-0 cursor-pointer pointer-coarse:h-11 items-center justify-center gap-1.5 rounded-lg border border-input bg-card px-3 text-[0.9375rem] font-semibold',
  'transition-colors hover:bg-muted',
  focusRing,
);

function ShopCard({ shop }: { shop: Shop }) {
  return (
    <li className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5">
      <h3 className="font-heading text-lg leading-snug font-extrabold">{shop.name}</h3>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem]">
        {shop.rating !== null ? (
          <span className="inline-flex items-center gap-1">
            <Star className="size-4 fill-sign-yellow text-[#b07800]" aria-hidden="true" />
            <strong>{shop.rating.toFixed(1)}</strong>
            <span className="text-muted-foreground">
              ({shop.reviews.toLocaleString('en-US')} {shop.reviews === 1 ? 'review' : 'reviews'})
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">No Google reviews yet</span>
        )}
        {shop.temporarilyClosed ? (
          <span className="font-semibold text-sign-red dark:text-red-300">Temporarily closed</span>
        ) : shop.openNow === true ? (
          <span className="font-semibold text-sign-green dark:text-emerald-300">Open now</span>
        ) : shop.openNow === false ? (
          <span className="text-muted-foreground">Closed now</span>
        ) : null}
      </p>
      {shop.rating !== null && shop.reviews < 20 && (
        <p className="mt-1 text-sm text-muted-foreground">Few reviews, so the rating can swing a lot.</p>
      )}
      {shop.address && (
        <p className="mt-2 flex gap-1.5 text-[0.9375rem] text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {shop.address}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {shop.phone && (
          <a href={`tel:${shop.phone.replace(/[^\d+]/g, '')}`} className={linkButton}>
            <Phone className="size-4" aria-hidden="true" />
            {shop.phone}
          </a>
        )}
        {shop.website && (
          <a href={shop.website} target="_blank" rel="noopener noreferrer nofollow" className={linkButton}>
            <Globe className="size-4" aria-hidden="true" />
            Website
            <span className="sr-only"> of {shop.name} (opens in a new tab)</span>
          </a>
        )}
        {shop.mapsUrl && (
          <a href={shop.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkButton}>
            <ExternalLink className="size-4" aria-hidden="true" />
            Reviews and directions
            <span className="sr-only"> for {shop.name} on Google Maps (opens in a new tab)</span>
          </a>
        )}
      </div>
    </li>
  );
}

export default function ShopResults({ result, what, zip }: { result: ShopSearch; what: string; zip: string }) {
  const [order, setOrder] = useState<'match' | 'rating'>('match');

  if (result.error && !result.unavailable) return <Notice tone="error">{result.error}</Notice>;

  if (result.unavailable || result.shops.length === 0) {
    return (
      <Notice tone={result.error ? 'warning' : 'info'} title={result.shops.length === 0 && !result.unavailable ? 'No shops found' : undefined}>
        {result.error && <p>{result.error}</p>}
        <p>
          <a href={result.mapsUrl} target="_blank" rel="noopener noreferrer" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
            See {what} near {zip} on Google Maps
          </a>
          , with ratings, reviews and hours.
        </p>
      </Notice>
    );
  }

  const shops = order === 'rating' ? [...result.shops].sort((a, b) => weightedRating(b) - weightedRating(a)) : result.shops;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.9375rem] text-muted-foreground" role="status">
          {result.shops.length} {what} near {zip}
        </p>
        <div className="inline-flex rounded-lg border border-input p-0.5" role="group" aria-label="Sort shops">
          {(
            [
              ['match', 'Best match'],
              ['rating', 'Top rated'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={order === id}
              onClick={() => setOrder(id)}
              className={cn(
                'cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold pointer-coarse:min-h-11',
                order === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                focusRing,
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {order === 'rating' && (
        <p className="mt-2 text-sm text-muted-foreground">Ranked by rating weighted by review count: a 4.7 from 600 reviews beats a 4.9 from 8.</p>
      )}
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops.map((s) => (
          <ShopCard key={s.id || s.name} shop={s} />
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        Listings, ratings and hours from Google.{' '}
        <a href={result.mapsUrl} target="_blank" rel="noopener noreferrer" className={cn('rounded-sm font-semibold underline underline-offset-4', focusRing)}>
          See more on Google Maps
        </a>
        . Call ahead to confirm hours and prices.
      </p>
    </div>
  );
}
