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
}

/** Standard content container: bordered surface with an optional header row. */
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
}: PanelProps) {
  const hasHeader = title || actions;
  return (
    <section
      id={id}
      className={cn(
        'flex min-w-0 flex-col rounded-lg border border-border bg-card shadow-panel',
        className,
      )}
    >
      {hasHeader && (
        <header className="flex min-h-[48px] items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
            <div className="min-w-0">
              {title && (
                <h2 className="truncate text-[13px] font-semibold leading-5 text-foreground">{title}</h2>
              )}
              {description && (
                <p className="truncate text-xs leading-4 text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('min-w-0 flex-1', !flush && 'p-4', bodyClassName)}>{children}</div>
      {footer && <footer className="border-t border-border px-4 py-2.5">{footer}</footer>}
    </section>
  );
}
