'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    const percentage = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-surface', className)}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-[width] duration-500 ease-out',
            indicatorClassName,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';
