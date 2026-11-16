'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, RotateCcw, ScrollText } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SearchInput } from '@/components/forms/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { CodeViewer } from '@/components/shared/code-viewer';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/data-table';
import { DetailList } from '@/components/shared/detail-list';
import { ClearFiltersButton, FilterBar, FilterSelect } from '@/components/shared/filter-bar';
import { IdChip } from '@/components/shared/id-chip';
import { Pagination, paginate } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { StatusPill } from '@/components/shared/status-pill';
import { UnavailableNotice } from '@/components/shared/unavailable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDashboardActivity } from '@/hooks/use-dashboard';
import { formatTimestamp, humanize } from '@/lib/format';
import type { Tone } from '@/lib/status';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { ActivityItem } from '@/types/dashboard';

const PAGE_SIZE = 15;

interface ResourceKind {
  label: string;
  hrefBase: string;
  tone: Tone;
}

/** Maps activity `type` prefixes from /dashboard/activity to their resource routes. */
const RESOURCE_KINDS: { prefix: string; kind: ResourceKind }[] = [
  { prefix: 'test_suite', kind: { label: 'Test suite', hrefBase: '/test-suites', tone: 'accent' } },
  { prefix: 'target', kind: { label: 'Target', hrefBase: '/targets', tone: 'info' } },
  { prefix: 'scenario', kind: { label: 'Scenario', hrefBase: '/scenarios', tone: 'warning' } },
];

function resourceFor(type: string): ResourceKind | null {
  return RESOURCE_KINDS.find((r) => type.startsWith(r.prefix))?.kind ?? null;
}

type AuditRow = ActivityItem & { rowId: string };

function sortRows<T>(rows: T[], columns: DataTableColumn<T>[], sort: SortState): T[] {
  const get = sort ? columns.find((c) => c.id === sort.id)?.sortValue : undefined;
  if (!sort || !get) return rows;
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va === vb) return 0;
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    return va > vb ? dir : -dir;
  });
}

export default function AuditLogsPage() {
  const activityQuery = useDashboardActivity();
  const rows = useMemo<AuditRow[]>(
    () => (activityQuery.data?.activities ?? []).map((a, i) => ({ ...a, rowId: `${a.type}-${a.entity_id}-${i}` })),
    [activityQuery.data],
  );

  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ id: 'timestamp', direction: 'desc' });
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const eventTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.type))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!eventType || r.type === eventType) &&
        (!q || `${r.title} ${r.type} ${r.entity_id}`.toLowerCase().includes(q)),
    );
  }, [rows, search, eventType]);

  const columns: DataTableColumn<AuditRow>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      sortValue: (r) => r.timestamp,
      cell: (r) => (
        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground" title={formatRelativeTime(r.timestamp)}>
          {formatTimestamp(r.timestamp)}
        </span>
      ),
    },
    {
      id: 'event',
      header: 'Event type',
      sortValue: (r) => r.type,
      cell: (r) => (
        <span className="whitespace-nowrap font-mono text-[11px] text-foreground/85">{r.type}</span>
      ),
    },
    {
      id: 'resource',
      header: 'Resource',
      sortValue: (r) => resourceFor(r.type)?.label ?? r.type,
      cell: (r) => {
        const kind = resourceFor(r.type);
        return (
          <div className="flex min-w-0 items-center gap-2">
            <StatusPill tone={kind?.tone ?? 'neutral'} label={kind?.label ?? humanize(r.type)} variant="plain" />
            {kind ? (
              <Link
                href={`${kind.hrefBase}/${r.entity_id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-xs text-muted-foreground hover:text-primary"
                title={r.entity_id}
              >
                {r.entity_id.slice(0, 8)}
              </Link>
            ) : (
              <IdChip value={r.entity_id} copy={false} />
            )}
          </div>
        );
      },
    },
    {
      id: 'description',
      header: 'Description',
      hideBelow: 'md',
      cell: (r) => <span className="line-clamp-1 text-[13px] text-foreground/90">{r.title}</span>,
    },
  ];

  const paged = paginate(sortRows(filtered, columns, sort), page, PAGE_SIZE);
  const hasFilters = !!search || !!eventType;
  const selectedKind = selected ? resourceFor(selected.type) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ScrollText}
        title="Audit logs"
        description="Chronological trail of changes in this workspace."
      >
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Refresh activity"
          title="Refresh"
          onClick={() => activityQuery.refetch()}
        >
          <RotateCcw className={cn('h-3.5 w-3.5', activityQuery.isFetching && 'animate-spin')} />
        </Button>
      </PageHeader>

      <UnavailableNotice
        title="Immutable audit stream is not exposed by the API"
        description={
          <>
            The backend records security-relevant events (for example report generation and report downloads) in an
            append-only <span className="font-mono">audit_logs</span> table, but provides no endpoint to read it. Actor,
            IP address, user agent and outcome therefore cannot be displayed here. The table below is the real
            workspace activity feed from <span className="font-mono">/api/v1/dashboard/activity</span>, derived from
            resource creation records.
          </>
        }
      />

      <Panel
        title="Workspace activity"
        description="Most recent 15 events returned by the API (up to 5 each for targets, suites and scenarios)"
        flush
      >
        <FilterBar
          actions={
            <span className="text-xs text-subtle-foreground">
              {filtered.length} of {rows.length} events
            </span>
          }
        >
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder="Search description, type or resource ID…"
          />
          <FilterSelect
            label="Event"
            value={eventType}
            onChange={(v) => {
              setEventType(v);
              setPage(1);
            }}
            options={eventTypes.map((t) => ({ value: t, label: humanize(t) }))}
          />
          <ClearFiltersButton
            visible={hasFilters}
            onClick={() => {
              setSearch('');
              setEventType('');
              setPage(1);
            }}
          />
        </FilterBar>
        <DataTable
          label="Workspace activity"
          columns={columns}
          data={paged.items}
          getRowId={(r) => r.rowId}
          isLoading={activityQuery.isLoading}
          error={activityQuery.error}
          onRetry={() => activityQuery.refetch()}
          onRowClick={setSelected}
          sort={sort}
          onSortChange={(s) => {
            setSort(s);
            setPage(1);
          }}
          empty={
            <EmptyState
              bare
              compact
              icon={ScrollText}
              title={rows.length === 0 ? 'No activity recorded yet' : 'No events match'}
              description={
                rows.length === 0
                  ? 'Creating targets, test suites or scenarios adds entries to this feed.'
                  : 'Adjust or clear the filters.'
              }
            />
          }
        />
        {filtered.length > PAGE_SIZE && (
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="events"
          />
        )}
      </Panel>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{selected.title}</DialogTitle>
                <DialogDescription>Event details as returned by the activity endpoint.</DialogDescription>
              </DialogHeader>
              <DetailList
                columns={2}
                items={[
                  { label: 'Timestamp', value: formatTimestamp(selected.timestamp), mono: true },
                  { label: 'Event type', value: selected.type, mono: true },
                  { label: 'Resource type', value: selectedKind?.label ?? humanize(selected.type) },
                  { label: 'Resource ID', value: <IdChip value={selected.entity_id} full /> },
                  {
                    label: 'Not exposed by the API',
                    wide: true,
                    value: <span className="text-xs text-muted-foreground">Actor · IP address · User agent · Outcome</span>,
                  },
                ]}
              />
              <CodeViewer
                title="Raw record"
                value={{
                  type: selected.type,
                  title: selected.title,
                  timestamp: selected.timestamp,
                  entity_id: selected.entity_id,
                }}
                maxHeight={200}
              />
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                  Close
                </Button>
                {selectedKind && (
                  <Button asChild size="sm">
                    <Link href={`${selectedKind.hrefBase}/${selected.entity_id}`}>
                      Open {selectedKind.label.toLowerCase()} <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
