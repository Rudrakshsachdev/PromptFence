'use client';

import React from 'react';
import Link from 'next/link';
import { Fingerprint } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { IdChip } from '@/components/shared/id-chip';
import { CanaryStatusBadge } from '@/components/shared/status-badges';
import { formatTimestamp, humanize } from '@/lib/format';
import type { DynamicCanary } from '@/types/test-run';

/**
 * Canary tokens generated for a run. Status semantics: only OBSERVED means the
 * exact token appeared in target output; ACTIVE/EXPIRED tokens were never observed.
 */
export function CanaryTable({
  canaries,
  runId,
  isLoading,
  error,
  onRetry,
  showCaseColumn = true,
  emptyDescription = 'Canary tainting was disabled for this run, or no scenario required instrumentation.',
}: {
  canaries: DynamicCanary[] | undefined;
  runId: string;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  showCaseColumn?: boolean;
  emptyDescription?: string;
}) {
  const columns: DataTableColumn<DynamicCanary>[] = [
    {
      id: 'token',
      header: 'Token preview',
      cell: (c) => <span className="font-mono text-[12px] text-foreground">{c.token_preview}</span>,
    },
    {
      id: 'status',
      header: 'Exposure',
      sortValue: (c) => (c.status === 'OBSERVED' ? 1 : 0),
      cell: (c) => <CanaryStatusBadge status={c.status} />,
    },
    {
      id: 'source',
      header: 'Source',
      cell: (c) => (
        <div className="min-w-0">
          <IdChip value={c.source_id} length={18} />
          <div className="text-[11px] text-subtle-foreground">{humanize(c.source_type)}</div>
        </div>
      ),
    },
    ...(showCaseColumn
      ? [
          {
            id: 'case',
            header: 'Scenario case',
            hideBelow: 'md' as const,
            cell: (c: DynamicCanary) =>
              c.test_run_case_id ? (
                <Link
                  href={`/test-runs/${runId}/cases/${c.test_run_case_id}`}
                  className="font-mono text-[12px] text-muted-foreground hover:text-primary"
                >
                  {c.test_run_case_id.slice(0, 8)}
                </Link>
              ) : (
                <span className="text-subtle-foreground">—</span>
              ),
          },
        ]
      : []),
    {
      id: 'key',
      header: 'HMAC key',
      hideBelow: 'lg',
      cell: (c) => <span className="font-mono text-[12px] text-muted-foreground">{c.key_version}</span>,
    },
    {
      id: 'created',
      header: 'Generated',
      hideBelow: 'lg',
      sortValue: (c) => new Date(c.created_at).getTime(),
      cell: (c) => <span className="font-mono text-[11px] text-muted-foreground">{formatTimestamp(c.created_at)}</span>,
    },
    {
      id: 'expires',
      header: 'Expires',
      hideBelow: 'xl',
      cell: (c) => <span className="font-mono text-[11px] text-subtle-foreground">{formatTimestamp(c.expires_at)}</span>,
    },
  ];

  return (
    <DataTable
      label="Canary tokens"
      columns={columns}
      data={canaries}
      getRowId={(c) => c.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      initialSort={{ id: 'status', direction: 'desc' }}
      empty={<EmptyState bare compact icon={Fingerprint} title="No canaries generated" description={emptyDescription} />}
    />
  );
}
