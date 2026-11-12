import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  isActive: boolean;
  activeText?: string;
  inactiveText?: string;
  className?: string;
}

export function StatusBadge({
  isActive,
  activeText = 'Active',
  inactiveText = 'Inactive',
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium tracking-tight rounded-md border transition-colors',
        isActive
          ? 'bg-emerald-50/70 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/60'
          : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/60',
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isActive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={cn(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            isActive ? 'bg-emerald-500' : 'bg-slate-400'
          )}
        />
      </span>
      <span>{isActive ? activeText : inactiveText}</span>
    </Badge>
  );
}
