'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { CategoryBadge } from '@/components/shared/category-badge';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { AttributionBadge, FindingStatusBadge } from '@/components/shared/status-badges';
import { humanize } from '@/lib/format';
import { getEvidenceKind, SEVERITY_ORDER } from '@/lib/status';
import { formatRelativeTime } from '@/lib/utils';
import type { TaintFinding } from '@/types/finding';

const SEVERITY_RANK = (s: string) => {
  const idx = SEVERITY_ORDER.indexOf(s as (typeof SEVERITY_ORDER)[number]);
  return idx === -1 ? 99 : idx;
};

/** Findings produced by a run or a single case. */
export function RunFindingsTable({
  findings,
  isLoading,
  error,
  onRetry,
  emptyDescription = 'All evaluated assertions passed and no canary token was observed in target output.',
}: {
  findings: TaintFinding[] | undefined;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyDescription?: string;
}) {
  const router = useRouter();

  const columns: DataTableColumn<TaintFinding>[] = [
    {
      id: 'severity',
      header: 'Severity',
      sortValue: (f) => -SEVERITY_RANK(f.severity),
      cell: (f) => <SeverityBadge severity={f.severity} compact />,
    },
    {
      id: 'title',
      header: 'Finding',
      sortValue: (f) => f.title,
      cell: (f) => (
        <div className="min-w-0 max-w-md">
          <Link
            href={`/findings/${f.id}`}
            onClick={(e) => e.stopPropagation()}
            className="line-clamp-1 font-medium text-foreground hover:text-primary"
          >
            {f.title}
          </Link>
          <span className="font-mono text-[11px] text-subtle-foreground">{f.id.slice(0, 8)}</span>
        </div>
      ),
    },
    { id: 'category', header: 'Category', hideBelow: 'md', cell: (f) => <CategoryBadge category={f.category} /> },
    {
      id: 'attribution',
      header: 'Evidence',
      hideBelow: 'lg',
      cell: (f) => {
        const ev = getEvidenceKind(f.attribution_level);
        return (
          <div className="flex flex-col items-start gap-1">
            <AttributionBadge status={f.attribution_level} />
            <span className="text-[11px] text-subtle-foreground">{ev.label}</span>
          </div>
        );
      },
    },
    {
      id: 'method',
      header: 'Detection',
      hideBelow: 'xl',
      cell: (f) => (
        <div className="font-mono text-[11px] leading-4 text-muted-foreground">
          <div>{humanize(f.detection_method)}</div>
          <div className="text-subtle-foreground">{f.observation_location}</div>
        </div>
      ),
    },
    { id: 'status', header: 'Status', cell: (f) => <FindingStatusBadge status={f.status} /> },
    {
      id: 'observed',
      header: 'Observed',
      align: 'right',
      hideBelow: 'sm',
      sortValue: (f) => new Date(f.observed_at).getTime(),
      cell: (f) => <span className="text-xs text-muted-foreground">{formatRelativeTime(f.observed_at)}</span>,
    },
  ];

  return (
    <DataTable
      label="Findings"
      columns={columns}
      data={findings}
      getRowId={(f) => f.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      initialSort={{ id: 'severity', direction: 'desc' }}
      onRowClick={(f) => router.push(`/findings/${f.id}`)}
      empty={
        <EmptyState bare compact icon={ShieldCheck} title="No findings" description={emptyDescription} />
      }
    />
  );
}
