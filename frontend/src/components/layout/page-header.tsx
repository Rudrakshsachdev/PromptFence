import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Inline status chip(s) after the title. */
  badge?: React.ReactNode;
  /** Right-aligned page actions. */
  children?: React.ReactNode;
  className?: string;
  /** Back link for detail pages. */
  backHref?: string;
  backLabel?: string;
  /** Secondary metadata row under the title (ids, timestamps). */
  meta?: React.ReactNode;
  /** Optional icon tile left of the title. */
  icon?: React.ElementType;
}

export function PageHeader({
  title,
  description,
  badge,
  children,
  className,
  backHref,
  backLabel = 'Back',
  meta,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 pb-1', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-semibold tracking-tight text-foreground">{title}</h1>
              {badge}
            </div>
            {description && (
              <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">{description}</p>
            )}
            {meta && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                {meta}
              </div>
            )}
          </div>
        </div>
        {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

export function PageActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

/** Labeled metadata item for PageHeader `meta`. */
export function HeaderMeta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="text-subtle-foreground">{label}</span>
      <span className="min-w-0 text-foreground/85">{children}</span>
    </span>
  );
}
