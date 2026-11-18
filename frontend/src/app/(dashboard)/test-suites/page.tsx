'use client';

import { usePermissions } from '@/hooks/use-auth';
import { PERMISSIONS } from '@/constants/permissions';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  Layers,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Power,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { SearchInput } from '@/components/forms/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { ClearFiltersButton, FilterBar, FilterSelect } from '@/components/shared/filter-bar';
import { Pagination } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/use-debounce';
import { useDeleteTestSuite, useTestSuites } from '@/hooks/use-test-suites';
import { useTestRuns } from '@/hooks/use-test-runs';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import type { TestSuite } from '@/types/test-suite';
import { LastRunCell } from '../targets/_components/last-run-cell';
import { latestRunBy } from '../targets/_components/target-utils';
import { useToggleSuiteStatus } from './_components/use-suite-mutations';

const PAGE_SIZE = 50;
const RUN_SAMPLE = 100;

const scenarioCount = (s: TestSuite) => s.scenario_count ?? s.suite_test_cases?.length ?? 0;

export default function TestSuitesPage() {
  const { can } = usePermissions();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [suiteToDelete, setSuiteToDelete] = useState<TestSuite | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 200);

  const { data, isLoading, error, refetch, isRefetching } = useTestSuites(page, PAGE_SIZE);
  const runs = useTestRuns({ page: 1, page_size: RUN_SAMPLE });
  const deleteMutation = useDeleteTestSuite();
  const toggleStatus = useToggleSuiteStatus();

  const allItems = useMemo(() => data?.items ?? [], [data]);
  const lastRuns = useMemo(() => latestRunBy(runs.data?.items, 'test_suite_id'), [runs.data]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return allItems.filter((s) => {
      const matchesSearch =
        !q || s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q);
      const matchesStatus = !statusFilter || (statusFilter === 'ENABLED' ? s.is_active : !s.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [allItems, debouncedSearch, statusFilter]);

  const hasFilters = !!searchTerm || !!statusFilter;
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const enabledCount = allItems.filter((s) => s.is_active).length;
  const totalScenarios = allItems.reduce((sum, s) => sum + scenarioCount(s), 0);
  const emptySuites = allItems.filter((s) => scenarioCount(s) === 0).length;

  const columns: DataTableColumn<TestSuite>[] = [
    {
      id: 'name',
      header: 'Suite',
      sortValue: (s) => s.name.toLowerCase(),
      cell: (s) => (
        <div className="min-w-0 max-w-[340px]">
          <Link
            href={`/test-suites/${s.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate font-medium text-foreground hover:text-primary"
          >
            {s.name}
          </Link>
          {s.description && <p className="truncate text-xs text-muted-foreground">{s.description}</p>}
        </div>
      ),
    },
    {
      id: 'scenarios',
      header: 'Scenarios',
      align: 'right',
      sortValue: scenarioCount,
      cell: (s) => {
        const n = scenarioCount(s);
        return (
          <span className={`font-mono text-xs tabular-nums ${n === 0 ? 'text-warning' : 'text-foreground'}`}>
            {n}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (s) => (s.is_active ? 1 : 0),
      cell: (s) => <StatusBadge isActive={s.is_active} activeText="Enabled" inactiveText="Disabled" />,
    },
    {
      id: 'last-run',
      header: (
        <SimpleTooltip label={`Derived from the ${RUN_SAMPLE} most recent test runs`}>
          <span className="cursor-help underline decoration-dotted underline-offset-4">Last execution</span>
        </SimpleTooltip>
      ),
      hideBelow: 'sm',
      sortValue: (s) => {
        const r = lastRuns.get(s.id);
        return r ? new Date(r.started_at ?? r.created_at).getTime() : null;
      },
      cell: (s) => <LastRunCell run={lastRuns.get(s.id)} />,
    },
    {
      id: 'created',
      header: 'Created',
      align: 'right',
      hideBelow: 'lg',
      sortValue: (s) => new Date(s.created_at).getTime(),
      cell: (s) => (
        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{formatDate(s.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      headerClassName: 'w-10',
      cell: (s) => (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${s.name}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/test-suites/${s.id}`}>
                  <ExternalLink /> Open
                </Link>
              </DropdownMenuItem>
              {can(PERMISSIONS.testSuitesWrite) && (
                <DropdownMenuItem asChild>
                  <Link href={`/test-suites/${s.id}/edit`}>
                    <Pencil /> Edit details
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/test-runs/new">
                  <Play /> Launch test run
                </Link>
              </DropdownMenuItem>
              {can(PERMISSIONS.testSuitesWrite) && (
                <DropdownMenuItem
                  disabled={toggleStatus.isPending}
                  onSelect={() => toggleStatus.mutate({ id: s.id, isActive: !s.is_active })}
                >
                  <Power /> {s.is_active ? 'Disable' : 'Enable'}
                </DropdownMenuItem>
              )}
              {can(PERMISSIONS.testSuitesDelete) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setSuiteToDelete(s)}
                    className="text-critical focus:text-critical [&_svg]:text-critical"
                  >
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test suites"
        description="Ordered collections of attack scenarios, executed together against a target."
      >
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
        {can(PERMISSIONS.testSuitesWrite) && (
          <Button asChild size="sm">
            <Link href="/test-suites/new">
              <Plus className="h-3.5 w-3.5" /> Create suite
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard title="Suites" value={formatNumber(data?.total)} icon={Layers} isLoading={isLoading} />
        <StatsCard
          title="Enabled"
          value={formatNumber(enabledCount)}
          subtitle={data && data.total > allItems.length ? 'On this page' : 'Available for runs'}
          icon={Power}
          isLoading={isLoading}
        />
        <StatsCard
          title="Scenario assignments"
          value={formatNumber(totalScenarios)}
          subtitle="Across listed suites"
          icon={ListChecks}
          isLoading={isLoading}
        />
        <StatsCard
          title="Empty suites"
          value={formatNumber(emptySuites)}
          subtitle="No scenarios assigned"
          icon={Layers}
          tone="warning"
          isLoading={isLoading}
        />
      </div>

      <Panel flush>
        <FilterBar
          actions={
            !isLoading && (
              <span className="text-xs text-muted-foreground">
                {formatNumber(filtered.length)} of {formatNumber(allItems.length)} shown
              </span>
            )
          }
        >
          <SearchInput
            placeholder="Search name or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ENABLED', label: 'Enabled' },
              { value: 'DISABLED', label: 'Disabled' },
            ]}
          />
          <ClearFiltersButton visible={hasFilters} onClick={clearFilters} />
        </FilterBar>

        <DataTable
          label="Test suites"
          columns={columns}
          data={filtered}
          getRowId={(s) => s.id}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onRowClick={(s) => router.push(`/test-suites/${s.id}`)}
          empty={
            hasFilters ? (
              <EmptyState
                bare
                compact
                icon={Layers}
                title="No suites match these filters"
                description="Adjust the search or status filter."
                actionText="Clear filters"
                onAction={clearFilters}
              />
            ) : (
              <EmptyState
                bare
                icon={Layers}
                title="No test suites yet"
                description="Create a suite, then assign scenarios from the library to build a repeatable evaluation."
                actionText={can(PERMISSIONS.testSuitesWrite) ? 'Create suite' : undefined}
                actionHref={can(PERMISSIONS.testSuitesWrite) ? '/test-suites/new' : undefined}
              />
            )
          }
        />

        {data && data.total_pages > 1 && (
          <Pagination
            page={page}
            totalPages={data.total_pages}
            total={data.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="suites"
          />
        )}
      </Panel>

      <ConfirmDialog
        open={!!suiteToDelete}
        onOpenChange={(open) => !open && setSuiteToDelete(null)}
        title="Delete test suite?"
        description={`“${suiteToDelete?.name}” will be removed. Its scenarios remain in the scenario library and past runs keep their records.`}
        confirmText="Delete suite"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (suiteToDelete) {
            deleteMutation.mutate(suiteToDelete.id, {
              onSuccess: () => setSuiteToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}
