import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ElementType;
  /** Right-aligned header controls (buttons, links, segmented controls). */
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Remove body padding (tables, lists that run edge to edge). */
  flush?: boolean;
  id?: string;
  /** Heading element for the title; use h3 when the panel sits under a section h2. */
  headingLevel?: 'h2' | 'h3';
}

/** Standard content container: bordered white surface with an optional header row. */
export function Panel({
  title,
  description,
  icon: Icon,
  actions,
  footer,
  children,
  className,
  bodyClassName,
  flush = false,
  id,
  headingLevel: Heading = 'h2',
}: PanelProps) {
  const hasHeader = title || actions;
  return (
    <section
      id={id}
      className={cn(
        'flex min-w-0 flex-col rounded-xl border border-border bg-card shadow-panel',
        className,
      )}
    >
      {hasHeader && (
        <header className="flex min-h-[56px] items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <Heading className="truncate text-sm font-semibold leading-5 text-foreground">{title}</Heading>
              )}
              {description && (
                <p className="truncate text-xs leading-4 text-subtle-foreground">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('min-w-0 flex-1', !flush && 'p-5', bodyClassName)}>{children}</div>
      {footer && <footer className="border-t border-border px-5 py-3">{footer}</footer>}
    </section>
  );
}
