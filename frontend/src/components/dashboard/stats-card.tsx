import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TONE_CLASSES, type Tone } from '@/lib/status';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  /** Small trailing tag next to the value (e.g. "Live", "+3"). */
  trend?: string;
  /** Tints the icon and value; use for risk metrics (critical findings, exposures). */
  tone?: Tone;
  /** Makes the whole card a link to the drill-down page. */
  href?: string;
  isLoading?: boolean;
  /** Renders "Not measured" instead of the value. */
  unavailable?: boolean;
  className?: string;
}

/** KPI tile: label, headline value, one line of context. */
export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  tone,
  href,
  isLoading = false,
  unavailable = false,
  className,
}: StatsCardProps) {
  const t = tone ? TONE_CLASSES[tone] : null;
  const body = (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow truncate">{title}</span>
        <Icon className={cn('h-4 w-4 shrink-0', t ? t.text : 'text-subtle-foreground')} aria-hidden />
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-16" />
      ) : unavailable ? (
        <span className="text-sm font-medium italic text-subtle-foreground">Not measured</span>
      ) : (
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'text-2xl font-semibold tabular-nums tracking-tight',
              t && value !== 0 && value !== '0' ? t.text : 'text-foreground',
            )}
          >
            {value}
          </span>
          {trend && (
            <span className="rounded border border-border bg-surface px-1.5 py-px text-[10px] font-medium text-muted-foreground">
              {trend}
            </span>
          )}
        </div>
      )}
      {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );

  const classes = cn(
    'group relative block min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-panel transition-colors',
    href && 'hover:border-border-strong hover:bg-surface/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
    className,
  );

  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
