'use client';

import { usePermissions } from '@/hooks/use-auth';
import { PERMISSIONS } from '@/constants/permissions';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  LibraryBig,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Trash2,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { SearchInput } from '@/components/forms/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { ClearFiltersButton, FilterBar, FilterSelect } from '@/components/shared/filter-bar';
import { Pagination, paginate } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { SeverityIndicator } from '@/components/shared/severity-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { SCENARIO_CATEGORIES, SCENARIO_SEVERITIES } from '@/constants/scenarios';
import { useDashboardDistributions, useDashboardOverview } from '@/hooks/use-dashboard';
import { useDebounce } from '@/hooks/use-debounce';
import { useDeleteScenario, useScenarios, useUpdateScenarioStatus } from '@/hooks/use-scenarios';
import { formatNumber } from '@/lib/format';
import { getTargetTypeLabel, SEVERITY_ORDER } from '@/lib/status';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { ScenarioCategory, ScenarioSeverity, TestCase } from '@/types/scenario';

const PAGE_SIZE = 25;
/** Max rows loaded when filtering client-side (backend page_size limit). */
const CLIENT_FILTER_LIMIT = 100;

export default function ScenariosPage() {
  const { can } = usePermissions();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim().toLowerCase(), 250);
  const [category, setCategory] = useState<ScenarioCategory | ''>('');
  const [severity, setSeverity] = useState<ScenarioSeverity | ''>('');
  const [enabled, setEnabled] = useState<'' | 'enabled' | 'disabled'>('');
  const [page, setPage] = useState(1);

  // Search and enabled-status are not supported by the list endpoint, so they run
  // client-side over up to CLIENT_FILTER_LIMIT rows of the server-filtered set.
  const clientFiltering = debouncedSearch.length > 0 || enabled !== '';

  const scenarios = useScenarios({
    category: category || undefined,
    severity: severity || undefined,
    page: clientFiltering ? 1 : page,
    pageSize: clientFiltering ? CLIENT_FILTER_LIMIT : PAGE_SIZE,
  });
  const overview = useDashboardOverview();
  const distributions = useDashboardDistributions();

  const statusMutation = useUpdateScenarioStatus();
  const deleteMutation = useDeleteScenario();
  const [toDelete, setToDelete] = useState<TestCase | null>(null);

  const resetPage = () => setPage(1);

  const view = useMemo(() => {
    const items = scenarios.data?.items ?? [];
    if (!clientFiltering) {
      return {
        items,
        page,
        totalPages: scenarios.data?.total_pages ?? 1,
        total: scenarios.data?.total ?? 0,
      };
    }
    const filtered = items.filter((s) => {
      if (enabled === 'enabled' && !s.is_enabled) return false;
      if (enabled === 'disabled' && s.is_enabled) return false;
      if (!debouncedSearch) return true;
      return `${s.name} ${s.description ?? ''} ${s.attack_input_template}`.toLowerCase().includes(debouncedSearch);
    });
    return paginate(filtered, page, PAGE_SIZE);
  }, [scenarios.data, clientFiltering, enabled, debouncedSearch, page]);

  const searchTruncated = clientFiltering && (scenarios.data?.total ?? 0) > CLIENT_FILTER_LIMIT;
  const hasFilters = !!(search || category || severity || enabled);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setSeverity('');
    setEnabled('');
    resetPage();
  };

  const categoryCounts = distributions.data?.test_cases_by_category ?? {};
  const severityCounts = distributions.data?.test_cases_by_severity ?? {};
  const criticalHigh = (severityCounts.CRITICAL ?? 0) + (severityCounts.HIGH ?? 0);
  const categoriesCovered = SCENARIO_CATEGORIES.filter((c) => (categoryCounts[c.value] ?? 0) > 0).length;

  const toggleStatus = (s: TestCase) => statusMutation.mutate({ id: s.id, isEnabled: !s.is_enabled });
  const pendingId =
    statusMutation.isPending && typeof statusMutation.variables === 'object' ? statusMutation.variables.id : null;

  const columns: DataTableColumn<TestCase>[] = [
    {
      id: 'name',
      header: 'Scenario',
      sortValue: (s) => s.name.toLowerCase(),
      className: 'max-w-[360px]',
      cell: (s) => (
        <div className="min-w-0">
          <Link
            href={`/scenarios/${s.id}`}
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
      id: 'category',
      header: 'Category',
      hideBelow: 'md',
      sortValue: (s) => s.category,
      cell: (s) => <CategoryBadge category={s.category} />,
    },
    {
      id: 'severity',
      header: 'Severity',
      sortValue: (s) => SEVERITY_ORDER.length - SEVERITY_ORDER.indexOf(s.severity),
      cell: (s) => <SeverityIndicator severity={s.severity} />,
    },
    {
      id: 'targets',
      header: 'Target types',
      hideBelow: 'xl',
      cell: (s) =>
        !s.applicable_target_types?.length ? (
          <span className="text-xs text-muted-foreground">All</span>
        ) : (
          <span className="text-xs text-muted-foreground" title={s.applicable_target_types.join(', ')}>
            {s.applicable_target_types.slice(0, 2).map(getTargetTypeLabel).join(', ')}
            {s.applicable_target_types.length > 2 && (
              <span className="text-subtle-foreground"> +{s.applicable_target_types.length - 2}</span>
            )}
          </span>
        ),
    },
    {
      id: 'enabled',
      header: 'Enabled',
      sortValue: (s) => (s.is_enabled ? 1 : 0),
      cell: (s) => (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Switch
            checked={s.is_enabled}
            disabled={pendingId === s.id || !can(PERMISSIONS.scenariosWrite)}
            onCheckedChange={() => toggleStatus(s)}
            aria-label={`${s.is_enabled ? 'Disable' : 'Enable'} ${s.name}`}
          />
        </div>
      ),
    },
    {
      id: 'updated',
      header: 'Updated',
      align: 'right',
      hideBelow: 'lg',
      sortValue: (s) => s.updated_at,
      cell: (s) => <span className="text-xs text-muted-foreground">{formatRelativeTime(s.updated_at)}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      className: 'w-10',
      cell: (s) => (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${s.name}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/scenarios/${s.id}`}>
                  <ExternalLink /> View details
                </Link>
              </DropdownMenuItem>
              {can(PERMISSIONS.scenariosWrite) && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/scenarios/${s.id}/edit`}>
                      <Pencil /> Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toggleStatus(s)}>
                    <Power /> {s.is_enabled ? 'Disable' : 'Enable'}
                  </DropdownMenuItem>
                </>
              )}
              {can(PERMISSIONS.scenariosDelete) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setToDelete(s)}
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
        title="Scenario library"
        description="Adversarial test scenarios for prompt injection, sensitive data disclosure, unauthorized tool execution and instruction conflicts."
      >
        <Button variant="outline" size="sm" onClick={() => scenarios.refetch()} disabled={scenarios.isFetching}>
          <RefreshCw className={cn('h-3.5 w-3.5', scenarios.isFetching && 'animate-spin')} /> Refresh
        </Button>
        {can(PERMISSIONS.scenariosWrite) && (
          <Button asChild size="sm">
            <Link href="/scenarios/new">
              <Plus className="h-3.5 w-3.5" /> New scenario
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Scenarios"
          value={formatNumber(overview.data?.total_test_cases)}
          subtitle="In your library"
          icon={LibraryBig}
          isLoading={overview.isLoading}
        />
        <StatsCard
          title="Enabled"
          value={formatNumber(overview.data?.enabled_test_cases)}
          subtitle="Included when suites run"
          icon={ShieldCheck}
          isLoading={overview.isLoading}
        />
        <StatsCard
          title="Critical & high"
          value={formatNumber(criticalHigh)}
          subtitle={`${formatNumber(severityCounts.CRITICAL ?? 0)} critical`}
          icon={Siren}
          tone="high"
          isLoading={distributions.isLoading}
        />
        <StatsCard
          title="Categories covered"
          value={`${categoriesCovered} / ${SCENARIO_CATEGORIES.length}`}
          subtitle="Attack categories with scenarios"
          icon={ShieldAlert}
          isLoading={distributions.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Category rail */}
        <nav aria-label="Scenario categories" className="min-w-0">
          <p className="eyebrow mb-2 hidden px-1 lg:block">Categories</p>
          <ul className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
            {[{ value: '' as const, label: 'All scenarios', description: '' }, ...SCENARIO_CATEGORIES].map((c) => {
              const active = category === c.value;
              const count = c.value === '' ? overview.data?.total_test_cases : categoryCounts[c.value] ?? 0;
              return (
                <li key={c.value || 'all'} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(c.value);
                      resetPage();
                    }}
                    aria-pressed={active}
                    title={c.description || undefined}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:border-transparent',
                      active
                        ? 'border-primary/30 bg-primary/10 font-medium text-foreground lg:border-transparent'
                        : 'border-border text-muted-foreground hover:bg-surface hover:text-foreground',
                    )}
                  >
                    <span className="truncate">{c.label}</span>
                    <span className="font-mono text-[11px] tabular-nums text-subtle-foreground">
                      {count === undefined ? '—' : formatNumber(count)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {category && (
            <p className="mt-3 hidden px-1 text-xs leading-relaxed text-muted-foreground lg:block">
              {SCENARIO_CATEGORIES.find((c) => c.value === category)?.description}
            </p>
          )}
        </nav>

        <Panel flush className="min-w-0">
          <FilterBar
            actions={
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatNumber(view.total)} {view.total === 1 ? 'scenario' : 'scenarios'}
              </span>
            }
          >
            <SearchInput
              placeholder="Search name, description, payload…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              onClear={() => {
                setSearch('');
                resetPage();
              }}
              className="sm:w-72"
            />
            <FilterSelect
              label="Severity"
              value={severity}
              onChange={(v) => {
                setSeverity(v as ScenarioSeverity | '');
                resetPage();
              }}
              options={SCENARIO_SEVERITIES.map((s) => ({ value: s.value, label: s.label }))}
            />
            <FilterSelect
              label="Status"
              value={enabled}
              onChange={(v) => {
                setEnabled(v as '' | 'enabled' | 'disabled');
                resetPage();
              }}
              options={[
                { value: 'enabled', label: 'Enabled' },
                { value: 'disabled', label: 'Disabled' },
              ]}
            />
            <ClearFiltersButton visible={hasFilters} onClick={clearFilters} />
          </FilterBar>

          {searchTruncated && (
            <p className="border-b border-border bg-warning/5 px-4 py-2 text-xs text-muted-foreground">
              Search and status filters cover the first {CLIENT_FILTER_LIMIT} of{' '}
              {formatNumber(scenarios.data?.total)} scenarios in this category/severity. Narrow by category or
              severity to search the rest.
            </p>
          )}

          <DataTable
            label="Scenarios"
            columns={columns}
            data={scenarios.data ? view.items : undefined}
            getRowId={(s) => s.id}
            isLoading={scenarios.isLoading}
            error={scenarios.error}
            onRetry={() => scenarios.refetch()}
            onRowClick={(s) => router.push(`/scenarios/${s.id}`)}
            rowClassName={(s) => (s.is_enabled ? undefined : 'opacity-70')}
            empty={
              hasFilters ? (
                <EmptyState
                  bare
                  compact
                  icon={ShieldAlert}
                  title="No matching scenarios"
                  description="No scenarios match the current search and filters."
                  actionText="Clear filters"
                  onAction={clearFilters}
                />
              ) : (
                <EmptyState
                  bare
                  compact
                  icon={LibraryBig}
                  title="No scenarios yet"
                  description="Create an adversarial scenario, then add it to a test suite to run it against a target."
                  actionText={can(PERMISSIONS.scenariosWrite) ? 'New scenario' : undefined}
                  actionHref={can(PERMISSIONS.scenariosWrite) ? '/scenarios/new' : undefined}
                />
              )
            }
          />

          {view.total > 0 && (
            <Pagination
              page={view.page}
              totalPages={view.totalPages}
              total={view.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="scenarios"
            />
          )}
        </Panel>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete scenario?"
        description={`"${toDelete?.name ?? ''}" will be permanently deleted and removed from every test suite that includes it.`}
        confirmText="Delete scenario"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deleteMutation.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
        }}
      />
    </div>
  );
}
