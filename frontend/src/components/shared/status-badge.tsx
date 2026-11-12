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
      variant={isActive ? 'success' : 'secondary'}
      className={cn('font-medium text-[11px] px-2 py-0.5', className)}
    >
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
      {isActive ? activeText : inactiveText}
    </Badge>
  );
}

