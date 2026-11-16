'use client';

import React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Horizontal row of search + filter controls that sits above a table. */
export function FilterBar({
  children,
  actions,
  className,
}: {
  children: React.ReactNode;
  /** Right-aligned controls (result count, view toggles). */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-b border-border px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Compact native <select> filter. Native for accessibility and zero JS cost;
 * an empty string value means "all".
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'All',
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel?: string;
  className?: string;
}) {
  const active = value !== '';
  return (
    <label
      className={cn(
        'relative inline-flex h-8 items-center rounded-md border text-xs transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-border bg-background/60 text-muted-foreground hover:border-border-strong',
        className,
      )}
    >
      <span className="pointer-events-none pl-2.5 pr-1 text-subtle-foreground">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full cursor-pointer appearance-none bg-transparent pr-7 font-medium text-foreground focus:outline-none"
        aria-label={label}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-subtle-foreground" />
    </label>
  );
}

export function ClearFiltersButton({ onClick, visible }: { onClick: () => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <Button variant="ghost" size="xs" onClick={onClick}>
      <X className="h-3 w-3" /> Clear filters
    </Button>
  );
}

/** Segmented button group (time ranges, view modes). */
export function SegmentedControl<V extends string | number>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: V;
  onChange: (value: V) => void;
  options: { value: V; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex h-8 items-center rounded-md border border-border bg-background/60 p-0.5', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-full rounded px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
              active ? 'bg-surface-hover text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const DAY_RANGE_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

/** Time-window selector for analytics endpoints that accept a `days` parameter. */
export function DateRangeSelect({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (days: number) => void;
  className?: string;
}) {
  return (
    <SegmentedControl
      label="Time range"
      value={value}
      onChange={onChange}
      options={DAY_RANGE_OPTIONS}
      className={className}
    />
  );
}
