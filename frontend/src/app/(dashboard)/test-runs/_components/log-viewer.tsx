'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ScrollText } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { CodeViewer } from '@/components/shared/code-viewer';
import { ErrorState } from '@/components/shared/error-state';
import { SegmentedControl } from '@/components/shared/filter-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTimeMs } from '@/lib/format';
import { TONE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ExecutionLog } from '@/types/test-run';
import { getLogLevelTone } from './event-meta';

/** Console-style execution log with level filter and expandable metadata. */
export function LogViewer({
  logs,
  isLoading,
  error,
  onRetry,
}: {
  logs: ExecutionLog[] | undefined;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
}) {
  const [level, setLevel] = useState('ALL');

  const sorted = useMemo(
    () => [...(logs ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [logs],
  );
  const levels = useMemo(() => Array.from(new Set(sorted.map((l) => l.level.toUpperCase()))), [sorted]);
  const visible = level === 'ALL' ? sorted : sorted.filter((l) => l.level.toUpperCase() === level);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (error) return <ErrorState error={error} onRetry={onRetry} compact />;
  if (!sorted.length) {
    return (
      <EmptyState bare compact icon={ScrollText} title="No log lines" description="The engine did not record logs for this scenario." />
    );
  }

  return (
    <div className="space-y-3">
      {levels.length > 1 && (
        <SegmentedControl
          label="Log level"
          value={level}
          onChange={setLevel}
          options={[{ value: 'ALL', label: 'All' }, ...levels.map((l) => ({ value: l, label: l }))]}
        />
      )}
      <div className="max-h-[520px] overflow-auto rounded-md border border-border bg-background font-mono text-[12px]">
        {visible.map((l) => (
          <LogLine key={l.id} log={l} />
        ))}
      </div>
    </div>
  );
}

function LogLine({ log }: { log: ExecutionLog }) {
  const [open, setOpen] = useState(false);
  const tone = TONE_CLASSES[getLogLevelTone(log.level)];
  const hasMeta = !!log.log_metadata && Object.keys(log.log_metadata).length > 0;
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        disabled={!hasMeta}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={hasMeta ? open : undefined}
        className="flex w-full items-start gap-3 px-3 py-1.5 text-left hover:bg-surface/40 disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span className="w-3 shrink-0 pt-0.5 text-subtle-foreground">
          {hasMeta && (open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
        </span>
        <time className="shrink-0 text-subtle-foreground">{formatTimeMs(log.created_at)}</time>
        <span className={cn('w-14 shrink-0 font-semibold uppercase', tone.text)}>{log.level}</span>
        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-foreground/90">{log.message}</span>
      </button>
      {open && hasMeta && (
        <div className="px-3 pb-2 pl-10">
          <CodeViewer value={log.log_metadata} maxHeight={200} />
        </div>
      )}
    </div>
  );
}
