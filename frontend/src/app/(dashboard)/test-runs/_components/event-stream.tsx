'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { FilterSelect } from '@/components/shared/filter-bar';
import { Timeline } from '@/components/shared/timeline';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExecutionEvent } from '@/types/test-run';
import { EVENT_META, getEventMeta } from './event-meta';

/** Filterable execution event timeline (run- or case-level). */
export function EventStream({
  events,
  isLoading,
  error,
  onRetry,
  runId,
  showCaseLinks = false,
  emptyDescription = 'The execution engine has not recorded any events yet.',
}: {
  events: ExecutionEvent[] | undefined;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  runId: string;
  showCaseLinks?: boolean;
  emptyDescription?: string;
}) {
  const [type, setType] = useState('');

  const sorted = useMemo(
    () =>
      [...(events ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [events],
  );

  const typeOptions = useMemo(() => {
    const present = new Set(sorted.map((e) => e.event_type));
    return Array.from(present).map((t) => ({ value: t, label: getEventMeta(t).label }));
  }, [sorted]);

  const visible = type ? sorted.filter((e) => e.event_type === type) : sorted;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={onRetry} compact />;
  if (!sorted.length) {
    return <EmptyState bare compact icon={Activity} title="No events recorded" description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterSelect label="Event" value={type} onChange={setType} options={typeOptions} allLabel="All types" />
        <span className="font-mono text-[11px] text-subtle-foreground">
          {visible.length} of {sorted.length} events
        </span>
      </div>
      <Timeline
        items={visible.map((e) => {
          const meta = getEventMeta(e.event_type, e.level);
          return {
            id: e.id,
            title: EVENT_META[e.event_type]?.label ?? meta.label,
            description: e.message,
            timestamp: e.created_at,
            tone: meta.tone,
            icon: meta.icon,
            details: e.event_metadata ?? undefined,
            meta:
              showCaseLinks && e.test_run_case_id ? (
                <Link
                  href={`/test-runs/${runId}/cases/${e.test_run_case_id}`}
                  className="font-mono text-[11px] text-subtle-foreground hover:text-primary"
                >
                  case {e.test_run_case_id.slice(0, 8)}
                </Link>
              ) : undefined,
          };
        })}
      />
    </div>
  );
}
