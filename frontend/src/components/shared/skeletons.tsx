import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function StatGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-16" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-border/70" aria-busy="true" aria-label="Loading">
      <div className="flex gap-4 bg-surface/50 px-3 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-3 py-3.5">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3 flex-1', c === 0 && 'flex-[2]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ height = 240, className }: { height?: number; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="mt-4 w-full" style={{ height }} />
    </div>
  );
}

/** Full-page placeholder: header + stat row + two panels. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2 border-b border-border pb-5">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-3.5 w-96 max-w-full" />
      </div>
      <StatGridSkeleton />
      <div className="grid gap-4 lg:grid-cols-3">
        <PanelSkeleton className="lg:col-span-2" />
        <PanelSkeleton />
      </div>
    </div>
  );
}
