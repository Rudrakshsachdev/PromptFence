import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  /** Extra content under the description (secondary actions, hints). */
  children?: React.ReactNode;
  /** Smaller padding for use inside panels. */
  compact?: boolean;
  /** Drop the dashed border when already inside a bordered container. */
  bare?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  children,
  compact = false,
  bare = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-6 py-8' : 'px-6 py-14',
        !bare && 'rounded-xl border border-dashed border-border-strong bg-card',
        className,
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground shadow-panel">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      {(actionText || children) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actionText && actionHref && (
            <Button asChild size="sm">
              <Link href={actionHref}>{actionText}</Link>
            </Button>
          )}
          {actionText && !actionHref && onAction && (
            <Button size="sm" onClick={onAction}>
              {actionText}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
