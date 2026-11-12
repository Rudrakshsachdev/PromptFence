import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-200/80 dark:border-slate-800 gap-4',
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
    </div>
  );
}

export function PageActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 shrink-0">{children}</div>;
}
