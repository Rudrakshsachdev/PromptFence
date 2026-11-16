'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Play, RotateCw } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SearchInput } from '@/components/forms/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { ClearFiltersButton, FilterBar, FilterSelect } from '@/components/shared/filter-bar';
import { IdChip } from '@/components/shared/id-chip';
import { Pagination } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { PageSkeleton } from '@/components/shared/skeletons';
import { RunStatusBadge } from '@/components/shared/status-badges';
import { StatusPill } from '@/components/shared/status-pill';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTargets } from '@/hooks/use-targets';
import { useTestRuns } from '@/hooks/use-test-runs';
import { useTestSuites } from '@/hooks/use-test-suites';
import { durationBetween, formatDuration, formatNumber, formatTimestamp } from '@/lib/format';
import { isRunTerminal, RUN_STATUS_META } from '@/lib/status';
import { formatRelativeTime } from '@/lib/utils';
import type { TestRun, TestRunStatus } from '@/types/test-run';

const PAGE_SIZE = 25;
const REFRESH_MS = 5000;

const STATUS_OPTIONS = (Object.keys(RUN_STATUS_META) as TestRunStatus[]).map((s) => ({
  value: s,
  label: RUN_STATUS_META[s].label,
}));

function TestRunsView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [targetId, setTargetId] = useState(searchParams.get('target') ?? '');
  const [suiteId, setSuiteId] = useState(searchParams.get('suite') ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [, setTick] = useState(0);

  const { data, isLoading, error, refetch, isFetching } = useTestRuns({
    page,
    page_size: PAGE_SIZE,
    status: status || undefined,
    target_id: targetId || undefined,
    test_suite_id: suiteId || undefined,
  });
  const targets = useTargets(1, 100);
  const suites = useTestSuites(1, 100);

  const hasActive = !!data?.items.some((r) => !isRunTerminal(r.status));

  // Poll while any visible run is still executing; also re-render live durations.
  useEffect(() => {
    if (!hasActive) return;
    const id = window.setInterval(() => {
      refetch();
      setTick((t) => t + 1);
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [hasActive, refetch]);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((r) =>
      [
        r.id,
        r.target?.name,
        r.execution_snapshot?.target?.name,
        r.test_suite?.name,
        r.execution_snapshot?.test_suite?.name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [data, search]);

  const filtersActive = !!(status || targetId || suiteId || search);

  const columns: DataTableColumn<TestRun>[] = [
    {
      id: 'execution',
      header: 'Execution',
      cell: (r) => {
        const target = r.target ?? r.execution_snapshot?.target;
        return (
          <div className="min-w-0 max-w-[280px]">
            <Link
              href={`/test-runs/${r.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate font-medium text-foreground hover:text-primary"
            >
              {target?.name ?? 'Unknown target'}
            </Link>
            <IdChip value={r.id} />
          </div>
        );
      },
    },
    {
      id: 'suite',
      header: 'Test suite',
      hideBelow: 'md',
      sortValue: (r) => r.test_suite?.name ?? r.execution_snapshot?.test_suite?.name ?? '',
      cell: (r) => (
        <span className="line-clamp-1 text-muted-foreground">
          {r.test_suite?.name ?? r.execution_snapshot?.test_suite?.name ?? '—'}
        </span>
      ),
    },
    { id: 'status', header: 'Status', sortValue: (r) => r.status, cell: (r) => <RunStatusBadge status={r.status} /> },
    {
      id: 'progress',
      header: 'Scenarios',
      hideBelow: 'lg',
      sortValue: (r) => r.total_cases,
      cell: (r) => (
        <div className="w-28">
          <div className="mb-1 font-mono text-[11px] tabular-nums text-muted-foreground">
            {r.completed_cases}/{r.total_cases}
          </div>
          <Progress
            value={r.completed_cases}
            max={r.total_cases || 1}
            indicatorClassName={r.status === 'FAILED' ? 'bg-critical' : r.status === 'RUNNING' ? 'bg-info' : 'bg-primary'}
          />
        </div>
      ),
    },
    {
      id: 'passed',
      header: 'Passed',
      align: 'right',
      sortValue: (r) => r.passed_cases,
      cell: (r) => <span className="font-mono tabular-nums text-success">{r.passed_cases}</span>,
    },
    {
      id: 'failed',
      header: 'Failed',
      align: 'right',
      sortValue: (r) => r.failed_cases,
      cell: (r) => (
        <span className="font-mono tabular-nums">
          <span className={r.failed_cases ? 'text-critical' : 'text-muted-foreground'}>{r.failed_cases}</span>
          {r.error_cases > 0 && (
            <span className="text-warning" title={`${r.error_cases} errored`}>
              {' '}
              +{r.error_cases}e
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'started',
      header: 'Started',
      align: 'right',
      hideBelow: 'sm',
      sortValue: (r) => new Date(r.started_at ?? r.created_at).getTime(),
      cell: (r) => (
        <span className="text-xs text-muted-foreground" title={formatTimestamp(r.started_at ?? r.created_at)}>
          {formatRelativeTime(r.started_at ?? r.created_at)}
        </span>
      ),
    },
    {
      id: 'duration',
      header: 'Duration',
      align: 'right',
      hideBelow: 'lg',
      sortValue: (r) => durationBetween(r.started_at, r.completed_at, r.status === 'RUNNING') ?? -1,
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formatDuration(durationBetween(r.started_at, r.completed_at, r.status === 'RUNNING'))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Runs"
        description="Monitor security test executions, drill into scenario-level evidence, and track live progress."
        icon={Activity}
      >
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
        <Button asChild size="sm">
          <Link href="/test-runs/new">
            <Play className="h-3.5 w-3.5" /> Launch test run
          </Link>
        </Button>
      </PageHeader>

      <Panel flush>
        <FilterBar
          actions={
            <>
              {hasActive && <StatusPill tone="info" live label="Auto-refreshing" variant="plain" />}
              <span className="font-mono text-[11px] text-subtle-foreground">
                {formatNumber(data?.total ?? 0)} runs
              </span>
            </>
          }
        >
          <SearchInput
            className="sm:w-64"
            placeholder="Filter this page by ID, target, suite"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
          <FilterSelect label="Status" value={status} onChange={resetPage(setStatus)} options={STATUS_OPTIONS} />
          <FilterSelect
            label="Target"
            value={targetId}
            onChange={resetPage(setTargetId)}
            options={(targets.data?.items ?? []).map((t) => ({ value: t.id, label: t.name }))}
          />
          <FilterSelect
            label="Suite"
            value={suiteId}
            onChange={resetPage(setSuiteId)}
            options={(suites.data?.items ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
          <ClearFiltersButton
            visible={filtersActive}
            onClick={() => {
              setStatus('');
              setTargetId('');
              setSuiteId('');
              setSearch('');
              setPage(1);
            }}
          />
        </FilterBar>

        <DataTable
          label="Test runs"
          columns={columns}
          data={data ? rows : undefined}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onRowClick={(r) => router.push(`/test-runs/${r.id}`)}
          skeletonRows={8}
          empty={
            filtersActive ? (
              <EmptyState
                bare
                icon={Activity}
                title="No runs match these filters"
                description="Adjust the status, target or suite filters, or clear them to see every execution."
              />
            ) : (
              <EmptyState
                bare
                icon={Play}
                title="No test runs yet"
                description="Launch a run to execute a suite of attack scenarios against a target and collect evidence."
                actionText="Launch test run"
                actionHref="/test-runs/new"
              />
            )
          }
        />

        {data && data.total > 0 && (
          <Pagination
            page={page}
            totalPages={data.total_pages}
            total={data.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="runs"
          />
        )}
      </Panel>
    </div>
  );
}

export default function TestRunsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TestRunsView />
    </Suspense>
  );
}
