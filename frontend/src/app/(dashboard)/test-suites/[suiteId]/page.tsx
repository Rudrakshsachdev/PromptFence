'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Layers,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Power,
  SearchX,
  ShieldAlert,
  Siren,
  Trash2,
  X,
} from 'lucide-react';
import { BarList } from '@/components/charts/bar-list';
import { SERIES } from '@/components/charts/chart-theme';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { SearchInput } from '@/components/forms/search-input';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { ErrorState } from '@/components/shared/error-state';
import { FilterSelect } from '@/components/shared/filter-bar';
import { IdChip } from '@/components/shared/id-chip';
import { Pagination } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { PageSkeleton } from '@/components/shared/skeletons';
import { StatusBadge } from '@/components/shared/status-badge';
import { RunStatusBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { SCENARIO_CATEGORIES } from '@/constants/scenarios';
import { useScenarios } from '@/hooks/use-scenarios';
import {
  useAddScenarioToSuite,
  useDeleteTestSuite,
  useRemoveScenarioFromSuite,
  useTestSuite,
  useUpdateTestSuite,
} from '@/hooks/use-test-suites';
import { useTestRuns } from '@/hooks/use-test-runs';
import { ApiError } from '@/lib/api-client';
import { durationBetween, formatDuration, formatNumber, shortId } from '@/lib/format';
import { getCategoryLabel, getSeverityMeta, SEVERITY_HEX, SEVERITY_ORDER } from '@/lib/status';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { FindingSeverity } from '@/types/finding';
import type { TestRun } from '@/types/test-run';
import { useReorderSuiteScenarios } from '../_components/use-suite-mutations';

const RUNS_PAGE_SIZE = 10;

/** Shape of the nested scenario on suite_test_cases (typed `any` upstream). */
interface SuiteScenario {
  id: string;
  name: string;
  category: string;
  severity: string;
  is_enabled?: boolean;
  description?: string | null;
}

interface AssignedCase {
  id: string;
  test_case_id: string;
  execution_order: number;
  scenario: SuiteScenario | null;
}

export default function TestSuiteDetailPage() {
  const params = useParams();
  const suiteId = params.suiteId as string;
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scenarioSearch, setScenarioSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [runsPage, setRunsPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: suite, isLoading, error, refetch } = useTestSuite(suiteId);
  const scenarios = useScenarios({ pageSize: 100 });
  const runs = useTestRuns({ test_suite_id: suiteId, page: runsPage, page_size: RUNS_PAGE_SIZE });
  const addMutation = useAddScenarioToSuite(suiteId);
  const removeMutation = useRemoveScenarioFromSuite(suiteId);
  const updateMutation = useUpdateTestSuite(suiteId);
  const deleteMutation = useDeleteTestSuite();
  const reorderMutation = useReorderSuiteScenarios(suiteId);

  const assigned = useMemo<AssignedCase[]>(
    () =>
      [...(suite?.suite_test_cases ?? [])]
        .sort((a, b) => a.execution_order - b.execution_order)
        .map((stc) => ({
          id: stc.id,
          test_case_id: stc.test_case_id,
          execution_order: stc.execution_order,
          scenario: (stc.test_case as SuiteScenario | undefined) ?? null,
        })),
    [suite],
  );

  const assignedIds = useMemo(() => new Set(assigned.map((a) => a.test_case_id)), [assigned]);

  const available = useMemo(() => {
    const q = scenarioSearch.trim().toLowerCase();
    return (scenarios.data?.items ?? []).filter(
      (tc) =>
        !assignedIds.has(tc.id) &&
        (!categoryFilter || tc.category === categoryFilter) &&
        (!q || tc.name.toLowerCase().includes(q) || getCategoryLabel(tc.category).toLowerCase().includes(q)),
    );
  }, [scenarios.data, assignedIds, scenarioSearch, categoryFilter]);

  const severityItems = useMemo(() => {
    const counts = new Map<string, number>();
    assigned.forEach((a) => a.scenario && counts.set(a.scenario.severity, (counts.get(a.scenario.severity) ?? 0) + 1));
    return SEVERITY_ORDER.filter((s) => counts.get(s)).map((s) => ({
      key: s,
      label: getSeverityMeta(s).label,
      value: counts.get(s) ?? 0,
      color: SEVERITY_HEX[s],
    }));
  }, [assigned]);

  const categoryItems = useMemo(() => {
    const counts = new Map<string, number>();
    assigned.forEach((a) => a.scenario && counts.set(a.scenario.category, (counts.get(a.scenario.category) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort((x, y) => y[1] - x[1])
      .map(([category, value]) => ({ key: category, label: getCategoryLabel(category), value, color: SERIES[0] }));
  }, [assigned]);

  if (isLoading) return <PageSkeleton />;

  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        icon={SearchX}
        title="Test suite not found"
        description="The suite does not exist or has been deleted."
        actionText="Back to test suites"
        actionHref="/test-suites"
      />
    );
  }
  if (error || !suite) {
    return <ErrorState title="Unable to load test suite" error={error} onRetry={() => refetch()} />;
  }

  const criticalHigh = assigned.filter(
    (a) => a.scenario && (a.scenario.severity === 'CRITICAL' || a.scenario.severity === 'HIGH'),
  ).length;
  const lastRun = runsPage === 1 ? runs.data?.items[0] : undefined;

  // Hooks above already toast on success/error; these only track which row is busy.
  const handleAdd = (testCaseId: string) => {
    setPendingId(testCaseId);
    addMutation.mutate(
      { testCaseId, executionOrder: assigned.length + 1 },
      { onSettled: () => setPendingId(null) },
    );
  };

  const handleRemove = (testCaseId: string) => {
    setPendingId(testCaseId);
    removeMutation.mutate(testCaseId, { onSettled: () => setPendingId(null) });
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= assigned.length) return;
    const next = [...assigned];
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((a, i) => ({ suite_test_case_id: a.id, execution_order: i + 1 })));
  };

  const scenarioColumns: DataTableColumn<AssignedCase>[] = [
    {
      id: 'order',
      header: '#',
      headerClassName: 'w-12',
      cell: (a) => <span className="font-mono text-xs text-subtle-foreground">{a.execution_order}</span>,
    },
    {
      id: 'name',
      header: 'Scenario',
      cell: (a) =>
        a.scenario ? (
          <div className="min-w-0 max-w-[360px]">
            <Link href={`/scenarios/${a.scenario.id}`} className="block truncate font-medium text-foreground hover:text-primary">
              {a.scenario.name}
            </Link>
            {a.scenario.is_enabled === false && (
              <span className="text-[11px] text-warning">Disabled in library, skipped at run time</span>
            )}
          </div>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">{shortId(a.test_case_id)} (unavailable)</span>
        ),
    },
    {
      id: 'category',
      header: 'Category',
      hideBelow: 'md',
      cell: (a) => (a.scenario ? <CategoryBadge category={a.scenario.category} /> : '—'),
    },
    {
      id: 'severity',
      header: 'Severity',
      cell: (a) => (a.scenario ? <SeverityBadge severity={a.scenario.severity as FindingSeverity} compact /> : '—'),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (a) => {
        const idx = assigned.findIndex((x) => x.id === a.id);
        const busy = pendingId === a.test_case_id;
        return (
          <div className="flex items-center justify-end gap-0.5">
            <SimpleTooltip label="Move up">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Move up"
                disabled={idx === 0 || reorderMutation.isPending}
                onClick={() => move(idx, -1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
            </SimpleTooltip>
            <SimpleTooltip label="Move down">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Move down"
                disabled={idx === assigned.length - 1 || reorderMutation.isPending}
                onClick={() => move(idx, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </SimpleTooltip>
            <SimpleTooltip label="Remove from suite">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove from suite"
                disabled={busy || removeMutation.isPending}
                onClick={() => handleRemove(a.test_case_id)}
                className="hover:text-critical"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              </Button>
            </SimpleTooltip>
          </div>
        );
      },
    },
  ];

  const runColumns: DataTableColumn<TestRun>[] = [
    {
      id: 'id',
      header: 'Execution',
      cell: (r) => (
        <Link
          href={`/test-runs/${r.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-foreground hover:text-primary"
        >
          {shortId(r.id)}
        </Link>
      ),
    },
    {
      id: 'target',
      header: 'Target',
      cell: (r) => (
        <span className="text-muted-foreground">
          {r.target?.name ?? r.execution_snapshot?.target?.name ?? '—'}
        </span>
      ),
    },
    { id: 'status', header: 'Status', cell: (r) => <RunStatusBadge status={r.status} /> },
    {
      id: 'result',
      header: 'Passed / Failed',
      align: 'right',
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums">
          <span className="text-success">{r.passed_cases}</span>
          <span className="text-subtle-foreground"> / </span>
          <span className={r.failed_cases ? 'text-critical' : 'text-muted-foreground'}>{r.failed_cases}</span>
          <span className="text-subtle-foreground"> of {r.total_cases}</span>
        </span>
      ),
    },
    {
      id: 'duration',
      header: 'Duration',
      align: 'right',
      hideBelow: 'md',
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDuration(durationBetween(r.started_at, r.completed_at, r.status === 'RUNNING'))}
        </span>
      ),
    },
    {
      id: 'started',
      header: 'Started',
      align: 'right',
      hideBelow: 'sm',
      cell: (r) => (
        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
          {formatDate(r.started_at ?? r.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/test-suites"
        backLabel="Test suites"
        icon={Layers}
        title={suite.name}
        description={suite.description || undefined}
        badge={<StatusBadge isActive={suite.is_active} activeText="Enabled" inactiveText="Disabled" />}
        meta={
          <>
            <HeaderMeta label="ID">
              <IdChip value={suite.id} />
            </HeaderMeta>
            <HeaderMeta label="Created">{formatDate(suite.created_at)}</HeaderMeta>
            <HeaderMeta label="Updated">{formatDate(suite.updated_at)}</HeaderMeta>
          </>
        }
      >
        <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Assign scenarios
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/test-suites/${suiteId}/edit`}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/test-runs/new">
            <Play className="h-3.5 w-3.5" /> Launch test run
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              disabled={updateMutation.isPending}
              onSelect={() => updateMutation.mutate({ is_active: !suite.is_active })}
            >
              <Power /> {suite.is_active ? 'Disable suite' : 'Enable suite'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="text-critical focus:text-critical [&_svg]:text-critical"
            >
              <Trash2 /> Delete suite
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Scenarios"
          value={formatNumber(assigned.length)}
          subtitle={`${formatNumber(assigned.filter((a) => a.scenario?.is_enabled !== false).length)} enabled in library`}
          icon={ListChecks}
        />
        <StatsCard
          title="Critical / high"
          value={formatNumber(criticalHigh)}
          subtitle="High-impact scenarios"
          icon={Siren}
          tone={criticalHigh > 0 ? 'high' : undefined}
        />
        <StatsCard
          title="Executions"
          value={formatNumber(runs.data?.total)}
          subtitle="Runs using this suite"
          icon={Activity}
          isLoading={runs.isLoading}
        />
        <StatsCard
          title="Last execution"
          value={lastRun ? formatRelativeTime(lastRun.started_at ?? lastRun.created_at) : runs.isLoading ? '…' : 'Never'}
          subtitle={lastRun ? <RunStatusBadge status={lastRun.status} variant="plain" /> : 'No runs recorded'}
          icon={Play}
          href={lastRun ? `/test-runs/${lastRun.id}` : undefined}
          isLoading={runs.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          flush
          title="Scenarios"
          description="Executed in this order"
          icon={ShieldAlert}
          actions={
            <Button variant="ghost" size="xs" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          }
        >
          <DataTable
            label="Assigned scenarios"
            columns={scenarioColumns}
            data={assigned}
            getRowId={(a) => a.id}
            empty={
              <EmptyState
                bare
                compact
                icon={ShieldAlert}
                title="No scenarios assigned"
                description="Assign attack scenarios from the library. A suite needs at least one scenario to run."
                actionText="Assign scenarios"
                onAction={() => setIsAddOpen(true)}
              />
            }
          />
        </Panel>

        <Panel title="Composition" description="Assigned scenarios by severity and category">
          {assigned.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Nothing assigned yet.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="eyebrow mb-2">Severity</p>
                <BarList items={severityItems} />
              </div>
              <div>
                <p className="eyebrow mb-2">Category</p>
                <BarList items={categoryItems} />
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel flush title="Execution history" icon={Activity} description="Test runs launched with this suite">
        <DataTable
          label="Execution history"
          columns={runColumns}
          data={runs.data?.items}
          getRowId={(r) => r.id}
          isLoading={runs.isLoading}
          error={runs.error}
          onRetry={() => runs.refetch()}
          onRowClick={(r) => router.push(`/test-runs/${r.id}`)}
          skeletonRows={4}
          empty={
            <EmptyState
              bare
              compact
              icon={Play}
              title="Not executed yet"
              description="Launch a test run, choosing this suite and a target."
              actionText="Launch test run"
              actionHref="/test-runs/new"
            />
          }
        />
        {runs.data && runs.data.total_pages > 1 && (
          <Pagination
            page={runsPage}
            totalPages={runs.data.total_pages}
            total={runs.data.total}
            pageSize={RUNS_PAGE_SIZE}
            onPageChange={setRunsPage}
            itemLabel="runs"
          />
        )}
      </Panel>

      {/* Assign scenarios */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle>Assign scenarios</DialogTitle>
            <DialogDescription>
              Added scenarios are appended to the end of the execution order.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/30 px-4 py-2.5">
            <SearchInput
              placeholder="Search scenarios"
              value={scenarioSearch}
              onChange={(e) => setScenarioSearch(e.target.value)}
              onClear={() => setScenarioSearch('')}
              className="max-w-none flex-1"
            />
            <FilterSelect
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={SCENARIO_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {scenarios.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : scenarios.error ? (
              <div className="p-4">
                <ErrorState error={scenarios.error} onRetry={() => scenarios.refetch()} compact />
              </div>
            ) : available.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] text-muted-foreground">
                  {scenarios.data?.items.length
                    ? 'No unassigned scenarios match.'
                    : 'The scenario library is empty.'}
                </p>
                {!scenarios.data?.items.length && (
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/scenarios/new">Create scenario</Link>
                  </Button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {available.map((tc) => {
                  const busy = pendingId === tc.id;
                  return (
                    <li key={tc.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-[13px] font-medium text-foreground">{tc.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <CategoryBadge category={tc.category} />
                          <SeverityBadge severity={tc.severity} compact />
                          {!tc.is_enabled && <span className="text-[11px] text-warning">Disabled</span>}
                        </div>
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleAdd(tc.id)}
                        disabled={addMutation.isPending}
                        className="shrink-0"
                      >
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border bg-surface/30 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">
              {formatNumber(assigned.length)} assigned · {formatNumber(available.length)} available
            </span>
            <Button size="sm" onClick={() => setIsAddOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete test suite?"
        description={`“${suite.name}” will be removed. Its scenarios remain in the scenario library.`}
        confirmText="Delete suite"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(suiteId, {
            onSuccess: () => router.push('/test-suites'),
          });
        }}
      />
    </div>
  );
}
