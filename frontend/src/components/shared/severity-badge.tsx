import React from 'react';
import { cn } from '@/lib/utils';
import { getSeverityMeta, TONE_CLASSES } from '@/lib/status';

/**
 * Severity chip. Uses a filled bar glyph whose height encodes rank, so severity
 * is legible without relying on colour.
 */
export function SeverityBadge({
  severity,
  className,
  compact = false,
}: {
  severity: string;
  className?: string;
  /** Short label ("Info" instead of "Informational"). */
  compact?: boolean;
}) {
  const meta = getSeverityMeta(severity);
  const t = TONE_CLASSES[meta.tone];
  const label = compact && severity === 'INFO' ? 'Info' : meta.label;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4',
        t.pill,
        className,
      )}
    >
      <SeverityGlyph severity={severity} />
      {label}
    </span>
  );
}

const RANK: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };

/** Four ascending bars; filled count = severity rank. */
export function SeverityGlyph({ severity, className }: { severity: string; className?: string }) {
  const rank = RANK[severity] ?? 0;
  const t = TONE_CLASSES[getSeverityMeta(severity).tone];
  return (
    <span aria-hidden className={cn('inline-flex h-2.5 items-end gap-[1.5px]', className)}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn('w-[2px] rounded-[1px]', i <= rank ? t.bar : 'bg-current opacity-25')}
          style={{ height: `${25 + i * 18.75}%` }}
        />
      ))}
    </span>
  );
}

/** Plain severity label for dense tables: glyph + text, no chip. */
export function SeverityIndicator({ severity, className }: { severity: string; className?: string }) {
  const meta = getSeverityMeta(severity);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium',
        TONE_CLASSES[meta.tone].text,
        className,
      )}
    >
      <SeverityGlyph severity={severity} />
      {meta.label}
    </span>
  );
}
