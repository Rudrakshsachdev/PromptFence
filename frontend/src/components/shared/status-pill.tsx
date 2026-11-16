import React from 'react';
import { cn } from '@/lib/utils';
import { TONE_CLASSES, type StatusMeta, type Tone } from '@/lib/status';

interface StatusPillProps {
  tone: Tone;
  label: React.ReactNode;
  /** Animate the dot (running / live states). */
  live?: boolean;
  /** Hide the dot, e.g. when an icon is provided. */
  dot?: boolean;
  icon?: React.ElementType;
  title?: string;
  /** `pill` = bordered chip; `plain` = dot + text only (dense tables). */
  variant?: 'pill' | 'plain';
  className?: string;
}

/** Generic state indicator: coloured dot + text label, never colour alone. */
export function StatusPill({
  tone,
  label,
  live = false,
  dot = true,
  icon: Icon,
  title,
  variant = 'pill',
  className,
}: StatusPillProps) {
  const t = TONE_CLASSES[tone];
  return (
    <span
      title={title}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap text-[11px] font-medium leading-4',
        variant === 'pill' ? cn('rounded-md border px-1.5 py-0.5', t.pill) : t.text,
        className,
      )}
    >
      {Icon ? (
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
      ) : (
        dot && (
          <span
            aria-hidden
            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', t.dot, live && 'animate-status-pulse')}
          />
        )
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Renders a `StatusMeta` (from `@/lib/status`). */
export function MetaPill({
  meta,
  variant,
  className,
}: {
  meta: StatusMeta;
  variant?: 'pill' | 'plain';
  className?: string;
}) {
  return (
    <StatusPill
      tone={meta.tone}
      label={meta.label}
      live={meta.live}
      title={meta.description}
      variant={variant}
      className={className}
    />
  );
}
