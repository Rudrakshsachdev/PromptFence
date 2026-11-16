import React from 'react';
import { cn } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/status';
import type { ScenarioCategory } from '@/types/scenario';

/**
 * Attack category label. Deliberately neutral (no hue): colour is reserved for
 * severity and state, so a category never reads as a risk level.
 */
export function CategoryBadge({
  category,
  className,
}: {
  category: ScenarioCategory | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium leading-4 text-foreground/85',
        className,
      )}
    >
      {getCategoryLabel(category)}
    </span>
  );
}
