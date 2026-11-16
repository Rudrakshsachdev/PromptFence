import React from 'react';
import Link from 'next/link';
import { StatusPill } from '@/components/shared/status-pill';
import { getRunStatusMeta } from '@/lib/status';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { TestRun } from '@/types/test-run';

/** Compact "last run" cell: run status dot + relative time, linking to the run. */
export function LastRunCell({ run }: { run: TestRun | undefined }) {
  if (!run) return <span className="text-xs text-subtle-foreground">—</span>;
  const meta = getRunStatusMeta(run.status);
  const ts = run.started_at ?? run.created_at;
  return (
    <Link
      href={`/test-runs/${run.id}`}
      onClick={(e) => e.stopPropagation()}
      title={`${meta.label} · ${formatDate(ts)}`}
      className="inline-flex items-center gap-2 rounded hover:underline"
    >
      <StatusPill tone={meta.tone} live={meta.live} label={formatRelativeTime(ts)} variant="plain" />
    </Link>
  );
}
