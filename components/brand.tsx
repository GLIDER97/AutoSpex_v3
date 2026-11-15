import React from 'react';
import { cn } from '@/lib/utils';
import type { ToolCategoryId } from '../data/tools';

/**
 * A tiny road sign that marks a tool category, in the shape and color the
 * category has on US roads: a yellow warning diamond, a green guide panel,
 * a blue service square and a brown recreation panel.
 */
export function SignMarker({ category, className }: { category: ToolCategoryId; className?: string }) {
  if (category === 'warnings') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className={cn('size-5 shrink-0', className)}>
        <rect x="3.6" y="3.6" width="12.8" height="12.8" rx="1.8" transform="rotate(45 10 10)" fill="#ffcd00" />
        <rect
          x="5.4"
          y="5.4"
          width="9.2"
          height="9.2"
          rx="1"
          transform="rotate(45 10 10)"
          fill="none"
          stroke="#16181a"
          strokeWidth="1.3"
        />
      </svg>
    );
  }
  const fill = { money: '#006b4f', services: '#1f4f96', fun: '#6e4428' }[category];
  const wide = category !== 'services';
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={cn('size-5 shrink-0', className)}>
      <rect x={wide ? 1 : 3} y={wide ? 4 : 3} width={wide ? 18 : 14} height={wide ? 12 : 14} rx="2.2" fill={fill} />
      <rect
        x={wide ? 2.7 : 4.7}
        y={wide ? 5.7 : 4.7}
        width={wide ? 14.6 : 10.6}
        height={wide ? 8.6 : 10.6}
        rx="1.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.1"
      />
    </svg>
  );
}

/** The MyAutoSpex wordmark: a warning diamond, like the check engine light it exists to explain. */
export function Wordmark({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <SignMarker category="warnings" className="size-7" />
      <span
        className={cn(
          'font-heading text-[1.3125rem] leading-none font-extrabold tracking-[-0.015em]',
          inverted ? 'text-white' : 'text-foreground',
        )}
      >
        MyAutoSpex
      </span>
    </span>
  );
}
