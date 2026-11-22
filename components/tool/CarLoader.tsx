// The site's loading indicator: a car wheel (tire with tread, 5-spoke rim, yellow center cap) that spins,
// rolling over a moving road in the larger sizes. Drawn in SVG, so it is sharp at any size and costs nothing.
// It stops moving for people who ask their device to reduce motion (the label still says what is happening).
import React from 'react';
import { cn } from '@/lib/utils';

/** The wheel alone. Uses currentColor for the tire, so it works on any background (e.g. white on a green button). */
export function WheelIcon({ className, spin = true }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('shrink-0', spin && 'animate-[spin_0.9s_linear_infinite] motion-reduce:animate-none', className)}>
      {/* Tire and tread blocks (the tread makes the rotation easy to see). */}
      <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="8" />
      <circle cx="32" cy="32" r="30.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4.2 3.8" />
      {/* Rim */}
      <circle cx="32" cy="32" r="21.5" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.5" />
      {[0, 72, 144, 216, 288].map((a) => (
        <rect key={a} x="29.6" y="12" width="4.8" height="16" rx="2.4" fill="currentColor" fillOpacity="0.55" transform={`rotate(${a} 32 32)`} />
      ))}
      {/* Hub with the brand-yellow center cap and lug nuts */}
      <circle cx="32" cy="32" r="7.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="32" cy="32" r="4.2" fill="var(--color-sign-yellow)" />
      {[36, 108, 180, 252, 324].map((a) => (
        <circle key={a} cx="32" cy="25.6" r="1.1" fill="var(--color-sign-yellow)" transform={`rotate(${a} 32 32)`} />
      ))}
    </svg>
  );
}

const SIZES = {
  md: { wheel: 'size-12', road: 'w-20', text: 'text-[0.9375rem]' },
  lg: { wheel: 'size-16', road: 'w-28', text: 'text-[0.9375rem]' },
  xl: { wheel: 'size-24', road: 'w-40', text: 'text-base' },
};

/** A large loader: the spinning wheel on a moving road, with a status message under it. */
export function CarLoader({ label, size = 'lg', className }: { label: React.ReactNode; size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col items-center justify-center gap-3 py-4 text-center', className)}>
      <div className="flex flex-col items-center">
        <WheelIcon className={cn(s.wheel, 'text-foreground')} />
        {/* Road: dashes slide left so the wheel looks like it is driving. */}
        <span
          aria-hidden="true"
          className={cn('car-loader-road mt-1 h-1 rounded-full motion-reduce:animate-none', s.road)}
        />
      </div>
      <p className={cn('max-w-[36ch] font-semibold text-muted-foreground', s.text)}>{label}</p>
    </div>
  );
}
