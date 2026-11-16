import React from 'react';
import { StatusPill } from '@/components/shared/status-pill';

interface StatusBadgeProps {
  isActive: boolean;
  activeText?: string;
  inactiveText?: string;
  className?: string;
}

/** Binary enabled/disabled indicator (targets, suites, scenarios). */
export function StatusBadge({
  isActive,
  activeText = 'Active',
  inactiveText = 'Inactive',
  className,
}: StatusBadgeProps) {
  return (
    <StatusPill
      tone={isActive ? 'success' : 'neutral'}
      label={isActive ? activeText : inactiveText}
      className={className}
    />
  );
}
