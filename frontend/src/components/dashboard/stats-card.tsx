import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Sparkline } from '@/components/charts/sparkline';
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
  /** Real per-period values (e.g. daily counts) drawn as a trend line under the value. */
  sparkline?: { values: number[]; color: string; summary: string };
  className?: string;
}

/** KPI tile: label, headline value, one line of context, optional trend line. */
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
  sparkline,
  className,
}: StatsCardProps) {
  const t = tone ? TONE_CLASSES[tone] : null;
  const isZero = value === 0 || value === '0';
  const body = (
    <div className="flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="truncate pt-1 text-[13px] font-medium text-muted-foreground">{title}</span>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
            t && !isZero ? cn('border-transparent', t.soft, t.text) : 'border-border bg-surface text-muted-foreground',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <div className="mt-2">
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : unavailable ? (
          <span className="text-sm font-medium italic text-subtle-foreground">Not measured</span>
        ) : (
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-[28px] font-semibold leading-8 tracking-tight tabular-nums',
                t && !isZero ? t.text : 'text-foreground',
              )}
            >
              {value}
            </span>
            {trend && (
              <span className="rounded-md border border-border bg-surface px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                {trend}
              </span>
            )}
          </div>
        )}
      </div>

      {subtitle && <p className="mt-1 truncate text-xs text-subtle-foreground">{subtitle}</p>}

      {sparkline && !isLoading && (
        <Sparkline
          className="mt-auto pt-3"
          height={36}
          values={sparkline.values}
          color={sparkline.color}
          summary={sparkline.summary}
        />
      )}
    </div>
  );

  const classes = cn(
    'group relative block min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-panel transition-[border-color,box-shadow,transform] duration-200',
    href &&
      'hover:-translate-y-px hover:border-border-strong hover:shadow-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0',
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
