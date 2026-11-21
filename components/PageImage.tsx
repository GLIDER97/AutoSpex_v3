import React from 'react';
import { cn } from '@/lib/utils';
import { PAGE_IMAGE_HEIGHT, PAGE_IMAGE_WIDTH, pageImageFor, pageImageSrc } from '../data/pageImages';

/**
 * The page's studio photo (data/pageImages.ts), or nothing if the path has none.
 * It is the first image on its page, so it loads with high priority (React also adds a preload).
 */
export function PageImage({ path, sizes, className }: { path: string; sizes: string; className?: string }) {
  const image = pageImageFor(path);
  if (!image) return null;
  return (
    <img
      src={pageImageSrc(image.file, 1200)}
      srcSet={`${pageImageSrc(image.file, 640)} 640w, ${pageImageSrc(image.file, 1200)} 1200w`}
      sizes={sizes}
      width={PAGE_IMAGE_WIDTH}
      height={PAGE_IMAGE_HEIGHT}
      alt={image.alt}
      fetchPriority="high"
      decoding="async"
      className={cn('block w-full rounded-xl bg-muted object-cover', className)}
    />
  );
}

export default PageImage;
