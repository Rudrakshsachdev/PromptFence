'use client';

import { usePermissions } from '@/hooks/use-auth';
import { PERMISSIONS } from '@/constants/permissions';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  CheckCircle2,
  CircleDashed,
  Crosshair,
  ExternalLink,
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
import { CopyButton } from '@/components/shared/id-chip';
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
import { useDeleteTarget, useTargets } from '@/hooks/use-targets';
import { useTestRuns } from '@/hooks/use-test-runs';
import { formatNumber } from '@/lib/format';
import { getTargetTypeLabel, TARGET_TYPE_LABELS } from '@/lib/status';
import { formatDate } from '@/lib/utils';
import type { Target } from '@/types/target';
import { LastRunCell } from './_components/last-run-cell';
import { AUTH_TYPE_LABELS, latestRunBy } from './_components/target-utils';
import { useToggleTargetStatus } from './_components/use-target-status';

const PAGE_SIZE = 50;
const RUN_SAMPLE = 100;

export default function TargetsPage() {
  const { can } = usePermissions();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetToDelete, setTargetToDelete] = useState<Target | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 200);
  const { data, isLoading, error, refetch, isRefetching } = useTargets(page, PAGE_SIZE);
  const runs = useTestRuns({ page: 1, page_size: RUN_SAMPLE });
  const deleteMutation = useDeleteTarget();
  const toggleStatus = useToggleTargetStatus();

  const allItems = useMemo(() => data?.items ?? [], [data]);
  const lastRuns = useMemo(() => latestRunBy(runs.data?.items, 'target_id'), [runs.data]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return allItems.filter((t) => {
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        `${t.base_url}${t.endpoint}`.toLowerCase().includes(q);
      const matchesType = !typeFilter || t.target_type === typeFilter;
      const matchesStatus =
        !statusFilter || (statusFilter === 'ACTIVE' ? t.is_active : !t.is_active);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allItems, debouncedSearch, typeFilter, statusFilter]);

  const hasFilters = !!searchTerm || !!typeFilter || !!statusFilter;
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setStatusFilter('');
  };

  const activeCount = allItems.filter((t) => t.is_active).length;
  const testedCount = allItems.filter((t) => lastRuns.has(t.id)).length;

  const columns: DataTableColumn<Target>[] = [
    {
      id: 'name',
      header: 'Target',
      sortValue: (t) => t.name.toLowerCase(),
      cell: (t) => (
        <div className="min-w-0 max-w-[260px]">
          <Link
            href={`/targets/${t.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate font-medium text-foreground hover:text-primary"
          >
            {t.name}
          </Link>
          {t.description && (
            <p className="truncate text-xs text-muted-foreground">{t.description}</p>
          )}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      sortValue: (t) => t.target_type,
      cell: (t) => (
        <span className="inline-flex whitespace-nowrap rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium text-foreground/85">
          {getTargetTypeLabel(t.target_type)}
        </span>
      ),
    },
    {
      id: 'endpoint',
      header: 'Endpoint',
      hideBelow: 'md',
      cell: (t) => {
        const url = `${t.base_url}${t.endpoint}`;
        return (
          <div className="flex min-w-0 max-w-[300px] items-center gap-1.5">
            <span className="shrink-0 font-mono text-[11px] font-semibold text-primary">{t.http_method}</span>
            <span className="truncate font-mono text-xs text-muted-foreground" title={url}>
              {url}
            </span>
            <CopyButton value={url} label="Copy endpoint URL" />
          </div>
        );
      },
    },
    {
      id: 'auth',
      header: 'Auth',
      hideBelow: 'lg',
      sortValue: (t) => t.authentication_type,
      cell: (t) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {AUTH_TYPE_LABELS[t.authentication_type] ?? t.authentication_type}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (t) => (t.is_active ? 1 : 0),
      cell: (t) => <StatusBadge isActive={t.is_active} />,
    },
    {
      id: 'last-run',
      header: (
        <SimpleTooltip label={`Derived from the ${RUN_SAMPLE} most recent test runs`}>
          <span className="cursor-help underline decoration-dotted underline-offset-4">Last run</span>
        </SimpleTooltip>
      ),
      hideBelow: 'sm',
      sortValue: (t) => {
        const r = lastRuns.get(t.id);
        return r ? new Date(r.started_at ?? r.created_at).getTime() : null;
      },
      cell: (t) => <LastRunCell run={lastRuns.get(t.id)} />,
    },
    {
      id: 'created',
      header: 'Created',
      align: 'right',
      hideBelow: 'xl',
      sortValue: (t) => new Date(t.created_at).getTime(),
      cell: (t) => <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{formatDate(t.created_at)}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      headerClassName: 'w-10',
      cell: (t) => (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${t.name}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/targets/${t.id}`}>
                  <ExternalLink /> Open
                </Link>
              </DropdownMenuItem>
              {can(PERMISSIONS.targetsWrite) && (
                <DropdownMenuItem asChild>
                  <Link href={`/targets/${t.id}/edit`}>
                    <Pencil /> Edit configuration
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/test-runs/new">
                  <Play /> Launch test run
                </Link>
              </DropdownMenuItem>
              {can(PERMISSIONS.targetsWrite) && (
                <DropdownMenuItem
                  disabled={toggleStatus.isPending}
                  onSelect={() => toggleStatus.mutate({ id: t.id, isActive: !t.is_active })}
                >
                  <Power /> {t.is_active ? 'Disable' : 'Enable'}
                </DropdownMenuItem>
              )}
              {can(PERMISSIONS.targetsDelete) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setTargetToDelete(t)}
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
        title="Targets"
        description="LLM, agent and HTTP endpoints registered for adversarial testing."
      >
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
        {can(PERMISSIONS.targetsWrite) && (
          <Button asChild size="sm">
            <Link href="/targets/new">
              <Plus className="h-3.5 w-3.5" /> Register target
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Registered"
          value={formatNumber(data?.total)}
          subtitle="Across all target types"
          icon={Crosshair}
          isLoading={isLoading}
        />
        <StatsCard
          title="Active"
          value={formatNumber(activeCount)}
          subtitle={data && data.total > allItems.length ? 'On this page' : 'Accepting test traffic'}
          icon={CheckCircle2}
          isLoading={isLoading}
        />
        <StatsCard
          title="Recently tested"
          value={formatNumber(testedCount)}
          subtitle={`Appear in last ${RUN_SAMPLE} runs`}
          icon={Activity}
          isLoading={isLoading || runs.isLoading}
        />
        <StatsCard
          title="Not recently tested"
          value={formatNumber(allItems.length - testedCount)}
          subtitle={`No run in last ${RUN_SAMPLE}`}
          icon={CircleDashed}
          tone="warning"
          isLoading={isLoading || runs.isLoading}
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
            placeholder="Search name, description or URL"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
          <ClearFiltersButton visible={hasFilters} onClick={clearFilters} />
        </FilterBar>

        <DataTable
          label="Targets"
          columns={columns}
          data={filtered}
          getRowId={(t) => t.id}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onRowClick={(t) => router.push(`/targets/${t.id}`)}
          empty={
            hasFilters ? (
              <EmptyState
                bare
                compact
                icon={Crosshair}
                title="No targets match these filters"
                description="Adjust the search or filters to see more targets."
                actionText="Clear filters"
                onAction={clearFilters}
              />
            ) : (
              <EmptyState
                bare
                icon={Crosshair}
                title="No targets registered"
                description="Register an LLM, agent or HTTP endpoint to start running adversarial scenarios against it."
                actionText={can(PERMISSIONS.targetsWrite) ? 'Register target' : undefined}
                actionHref={can(PERMISSIONS.targetsWrite) ? '/targets/new' : undefined}
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
            itemLabel="targets"
          />
        )}
      </Panel>

      <ConfirmDialog
        open={!!targetToDelete}
        onOpenChange={(open) => !open && setTargetToDelete(null)}
        title="Delete target?"
        description={`“${targetToDelete?.name}” and its configuration versions will be permanently removed. Historical test runs keep their immutable execution records.`}
        confirmText="Delete target"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (targetToDelete) {
            deleteMutation.mutate(targetToDelete.id, {
              onSuccess: () => setTargetToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}
