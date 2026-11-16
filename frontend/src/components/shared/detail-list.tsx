import React from 'react';
import { cn } from '@/lib/utils';

export interface DetailItem {
  label: string;
  value: React.ReactNode;
  /** Render the value in monospace (ids, urls, hashes). */
  mono?: boolean;
  hint?: string;
  /** Span the full row width. */
  wide?: boolean;
}

/** Label/value metadata grid used on detail pages and side panels. */
export function DetailList({
  items,
  columns = 2,
  className,
}: {
  items: DetailItem[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const grid = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[columns];
  return (
    <dl className={cn('grid gap-x-6 gap-y-4', grid, className)}>
      {items.map((item) => (
        <div key={item.label} className={cn('min-w-0', item.wide && 'col-span-full')}>
          <dt className="eyebrow mb-1" title={item.hint}>
            {item.label}
          </dt>
          <dd
            className={cn(
              'min-w-0 break-words text-[13px] text-foreground',
              item.mono && 'font-mono text-[12px] text-foreground/90',
            )}
          >
            {item.value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}
