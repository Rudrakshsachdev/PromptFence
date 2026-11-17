import React from 'react';
import Link from 'next/link';
import { ChartEmpty } from '@/components/charts/chart-parts';
import { SERIES } from '@/components/charts/chart-theme';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface BarListItem {
  key: string;
  label: React.ReactNode;
  value: number;
  /** Bar fill (hex). Defaults to the brand accent. */
  color?: string;
  /** Right-hand secondary text, e.g. a percentage. */
  secondary?: React.ReactNode;
  href?: string;
}

/**
 * Horizontal ranked bars rendered in HTML: magnitude comparison with labels on
 * the left and exact values on the right. Cheaper and more legible than an SVG
 * chart for categorical distributions; bar lengths share one scale.
 */
export function BarList({
  items,
  valueFormatter = (v) => formatNumber(v),
  emptyMessage = 'No data recorded',
  emptyHint,
  max,
  className,
}: {
  items: BarListItem[];
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  emptyHint?: string;
  /** Fixed scale maximum (e.g. 100 for percentages). Defaults to the largest value. */
  max?: number;
  className?: string;
}) {
  if (!items.length) return <ChartEmpty height={140} message={emptyMessage} hint={emptyHint} />;
  const scaleMax = max ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((item) => {
        const pct = Math.max(0, Math.min(100, (item.value / scaleMax) * 100));
        const row = (
          <>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-foreground/90">{item.label}</span>
              <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                <span className="font-mono text-foreground">{valueFormatter(item.value)}</span>
                {item.secondary !== undefined && (
                  <span className="w-12 text-right font-mono text-subtle-foreground">{item.secondary}</span>
                )}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: item.color ?? SERIES[0], minWidth: item.value > 0 ? 3 : 0 }}
              />
            </div>
          </>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <Link
                href={item.href}
                className="block rounded-sm outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface SegmentItem {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * Single 100% stacked bar showing part-to-whole (e.g. run status mix), with a
 * legend carrying counts. Segments are separated by a 2px surface gap.
 */
export function SegmentBar({
  items,
  emptyMessage = 'No data recorded',
  className,
}: {
  items: SegmentItem[];
  emptyMessage?: string;
  className?: string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return <ChartEmpty height={72} message={emptyMessage} />;
  const visible = items.filter((i) => i.value > 0);
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={visible.map((i) => `${i.label}: ${i.value}`).join(', ')}>
        {visible.map((i) => (
          <div
            key={i.key}
            title={`${i.label}: ${i.value}`}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(i.value / total) * 100}%`, backgroundColor: i.color, minWidth: 3 }}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
        {items.map((i) => (
          <li key={i.key} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: i.color }} aria-hidden />
              <span className="truncate">{i.label}</span>
            </span>
            <span className="font-mono tabular-nums text-foreground">{formatNumber(i.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
