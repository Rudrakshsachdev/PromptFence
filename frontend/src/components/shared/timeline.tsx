'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CodeViewer } from '@/components/shared/code-viewer';
import { formatTimeMs } from '@/lib/format';
import { TONE_CLASSES, type Tone } from '@/lib/status';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  timestamp?: string | null;
  tone?: Tone;
  icon?: React.ElementType;
  /** Inline tags rendered to the right of the title. */
  meta?: React.ReactNode;
  /** Expandable technical payload (event metadata). */
  details?: unknown;
}

/**
 * Vertical event timeline. Timestamps render in monospace with millisecond
 * precision because ordering matters for execution and provenance traces.
 */
export function Timeline({
  items,
  className,
  timeFormatter = formatTimeMs,
}: {
  items: TimelineItem[];
  className?: string;
  timeFormatter?: (ts: string | null | undefined) => string;
}) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, idx) => (
        <TimelineRow
          key={item.id}
          item={item}
          isLast={idx === items.length - 1}
          timeFormatter={timeFormatter}
        />
      ))}
    </ol>
  );
}

function TimelineRow({
  item,
  isLast,
  timeFormatter,
}: {
  item: TimelineItem;
  isLast: boolean;
  timeFormatter: (ts: string | null | undefined) => string;
}) {
  const [open, setOpen] = useState(false);
  const tone = TONE_CLASSES[item.tone ?? 'neutral'];
  const Icon = item.icon;
  const hasDetails =
    item.details !== undefined &&
    item.details !== null &&
    !(typeof item.details === 'object' && Object.keys(item.details as object).length === 0);

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && (
        <span aria-hidden className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
      )}
      <span
        className={cn(
          'relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-border bg-card',
        )}
      >
        {Icon ? (
          <Icon className={cn('h-3 w-3', tone.text)} aria-hidden />
        ) : (
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-foreground">{item.title}</span>
            {item.meta}
          </div>
          {item.timestamp && (
            <time className="shrink-0 font-mono text-[11px] text-subtle-foreground" dateTime={item.timestamp}>
              {timeFormatter(item.timestamp)}
            </time>
          )}
        </div>
        {item.description && (
          <div className="mt-0.5 break-words text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </div>
        )}
        {hasDetails && (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              aria-expanded={open}
            >
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Metadata
            </button>
            {open && <CodeViewer value={item.details} maxHeight={220} className="mt-1.5" />}
          </div>
        )}
      </div>
    </li>
  );
}
