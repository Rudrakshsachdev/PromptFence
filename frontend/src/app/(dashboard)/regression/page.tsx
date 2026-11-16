'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Database, GitCompareArrows, Play, Plus, RotateCw, ShieldAlert, Siren } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/data-table';
import { ClearFiltersButton, FilterBar, FilterSelect } from '@/components/shared/filter-bar';
import { IdChip } from '@/components/shared/id-chip';
import { Pagination, paginate } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { useBaselines, useComparisons } from '@/hooks/use-regression';
import { useTargets } from '@/hooks/use-targets';
import { formatNumber } from '@/lib/format';
import { TONE_CLASSES, getRegressionMeta } from '@/lib/status';
import { cn, formatDate } from '@/lib/utils';
import type { RegressionClassification, RegressionComparison, SecurityBaseline } from '@/types/regression';
import { CreateBaselineDialog } from './_components/create-baseline-dialog';
import { ExecuteRegressionDialog } from './_components/execute-regression-dialog';
import { sortRows } from './_components/sort-rows';
import { VERDICT_META, VerdictBadge } from './_components/verdict';

const PAGE_SIZE = 15;

/** Count coloured by its regression classification tone; zero renders muted. */
function ClassCount({ value, classification }: { value: number | undefined; classification: RegressionClassification }) {
  const n = value ?? 0;
  const meta = getRegressionMeta(classification);
  return (
    <span
      title={`${meta.label}: ${n}`}
      className={cn('font-mono text-xs tabular-nums', n > 0 ? TONE_CLASSES[meta.tone].text : 'text-subtle-foreground')}
    >
      {n}
    </span>
  );
}

export default function RegressionPage() {
  const router = useRouter();
  const [targetFilter, setTargetFilter] = useState('');
  const [baselineFilter, setBaselineFilter] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('');
  const [baselinePage, setBaselinePage] = useState(1);
  const [comparisonPage, setComparisonPage] = useState(1);
  const [baselineSort, setBaselineSort] = useState<SortState>({ id: 'created', direction: 'desc' });
  const [comparisonSort, setComparisonSort] = useState<SortState>({ id: 'created', direction: 'desc' });

  const [createOpen, setCreateOpen] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [executeBaselineId, setExecuteBaselineId] = useState<string | undefined>();

  const baselines = useBaselines(targetFilter ? { target_id: targetFilter } : undefined);
  const allBaselines = useBaselines();
  const comparisons = useComparisons(baselineFilter ? { baseline_id: baselineFilter } : undefined);
  const targets = useTargets(1, 100);

  const targetNames = useMemo(
    () => new Map((targets.data?.items ?? []).map((t) => [t.id, t.name])),
    [targets.data],
  );

  const filteredComparisons = useMemo(() => {
    const list = comparisons.data ?? [];
    const scoped = targetFilter ? list.filter((c) => c.target_id === targetFilter) : list;
    return verdictFilter ? scoped.filter((c) => c.summary_verdict === verdictFilter) : scoped;
  }, [comparisons.data, targetFilter, verdictFilter]);

  const stats = useMemo(() => {
    const list = comparisons.data ?? [];
    return {
      regressions: list.filter((c) => c.summary_verdict === 'REGRESSION_DETECTED').length,
      newFindings: list.reduce((s, c) => s + (c.comparison_metrics?.new_findings_count ?? 0), 0),
      resolved: list.reduce((s, c) => s + (c.comparison_metrics?.resolved_findings_count ?? 0), 0),
    };
  }, [comparisons.data]);

  const openExecute = (baselineId?: string) => {
    setExecuteBaselineId(baselineId);
    setExecuteOpen(true);
  };

  const baselineColumns: DataTableColumn<SecurityBaseline>[] = [
    {
      id: 'name',
      header: 'Baseline',
      sortValue: (b) => b.name.toLowerCase(),
      cell: (b) => (
        <div className="min-w-0 max-w-[280px]">
          <p className="truncate font-medium text-foreground">{b.name}</p>
          {b.description && <p className="truncate text-[11px] text-muted-foreground">{b.description}</p>}
        </div>
      ),
    },
    {
      id: 'target',
      header: 'Target · Version',
      sortValue: (b) => targetNames.get(b.target_id) ?? b.target_id,
      cell: (b) => (
        <div className="min-w-0">
          <Link href={`/targets/${b.target_id}`} className="block truncate text-foreground/90 hover:text-primary">
            {targetNames.get(b.target_id) ?? <span className="font-mono text-xs">{b.target_id.slice(0, 8)}</span>}
          </Link>
          <span className="font-mono text-[11px] text-subtle-foreground">{b.target_version || '—'}</span>
        </div>
      ),
    },
    {
      id: 'source',
      header: 'Source run',
      hideBelow: 'md',
      cell: (b) => (
        <Link href={`/test-runs/${b.source_run_id}`} className="hover:text-primary">
          <IdChip value={b.source_run_id} copy={false} />
        </Link>
      ),
    },
    {
      id: 'cases',
      header: 'Cases (pass/fail)',
      align: 'right',
      hideBelow: 'lg',
      sortValue: (b) => b.metrics_summary?.total_cases ?? null,
      cell: (b) => {
        const m = b.metrics_summary ?? {};
        return (
          <span className="font-mono text-xs tabular-nums">
            <span className="text-foreground">{m.total_cases ?? '—'}</span>
            <span className="text-subtle-foreground"> (</span>
            <span className="text-success">{m.passed_cases ?? '—'}</span>
            <span className="text-subtle-foreground">/</span>
            <span className={m.failed_cases ? 'text-critical' : 'text-muted-foreground'}>{m.failed_cases ?? '—'}</span>
            <span className="text-subtle-foreground">)</span>
          </span>
        );
      },
    },
    {
      id: 'findings',
      header: 'Findings (crit/high)',
      align: 'right',
      sortValue: (b) => b.metrics_summary?.total_findings ?? null,
      cell: (b) => {
        const m = b.metrics_summary ?? {};
        return (
          <span className="font-mono text-xs tabular-nums">
            <span className="text-foreground">{m.total_findings ?? '—'}</span>
            <span className="text-subtle-foreground"> (</span>
            <span className={m.critical_findings ? 'text-critical' : 'text-muted-foreground'}>{m.critical_findings ?? '—'}</span>
            <span className="text-subtle-foreground">/</span>
            <span className={m.high_findings ? 'text-high' : 'text-muted-foreground'}>{m.high_findings ?? '—'}</span>
            <span className="text-subtle-foreground">)</span>
          </span>
        );
      },
    },
    {
      id: 'active',
      header: 'State',
      hideBelow: 'sm',
      cell: (b) => <StatusBadge isActive={b.is_active} activeText="Active" inactiveText="Archived" />,
    },
    {
      id: 'created',
      header: 'Created',
      hideBelow: 'lg',
      sortValue: (b) => b.created_at,
      cell: (b) => <span className="font-mono text-[11px] text-muted-foreground">{formatDate(b.created_at)}</span>,
    },
    {
      id: 'action',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (b) => (
        <Button variant="ghost" size="xs" onClick={() => openExecute(b.id)}>
          <Play className="h-3 w-3" /> Run
        </Button>
      ),
    },
  ];

  const comparisonColumns: DataTableColumn<RegressionComparison>[] = [
    {
      id: 'verdict',
      header: 'Verdict',
      sortValue: (c) => c.summary_verdict,
      cell: (c) => <VerdictBadge verdict={c.summary_verdict} />,
    },
    {
      id: 'baseline',
      header: 'Baseline → Run',
      sortValue: (c) => c.baseline_name.toLowerCase(),
      cell: (c) => (
        <div className="min-w-0">
          <Link
            href={`/regression/${c.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate font-medium text-foreground hover:text-primary"
          >
            {c.baseline_name}
          </Link>
          <span className="font-mono text-[11px] text-subtle-foreground">
            run {c.comparison_run_id.slice(0, 8)} · {c.target_version}
          </span>
        </div>
      ),
    },
    {
      id: 'target',
      header: 'Target',
      hideBelow: 'lg',
      cell: (c) => <span className="text-muted-foreground">{targetNames.get(c.target_id) ?? '—'}</span>,
    },
    {
      id: 'new',
      header: 'New',
      align: 'right',
      sortValue: (c) => c.comparison_metrics?.new_findings_count ?? 0,
      cell: (c) => <ClassCount value={c.comparison_metrics?.new_findings_count} classification="NEW" />,
    },
    {
      id: 'resolved',
      header: 'Resolved',
      align: 'right',
      sortValue: (c) => c.comparison_metrics?.resolved_findings_count ?? 0,
      cell: (c) => <ClassCount value={c.comparison_metrics?.resolved_findings_count} classification="RESOLVED" />,
    },
    {
      id: 'recurring',
      header: 'Recurring',
      align: 'right',
      hideBelow: 'sm',
      sortValue: (c) => c.comparison_metrics?.recurring_findings_count ?? 0,
      cell: (c) => <ClassCount value={c.comparison_metrics?.recurring_findings_count} classification="RECURRING" />,
    },
    {
      id: 'inconclusive',
      header: 'Inconcl.',
      align: 'right',
      hideBelow: 'md',
      sortValue: (c) => c.comparison_metrics?.inconclusive_count ?? 0,
      cell: (c) => <ClassCount value={c.comparison_metrics?.inconclusive_count} classification="INCONCLUSIVE" />,
    },
    {
      id: 'created',
      header: 'Evaluated',
      align: 'right',
      hideBelow: 'md',
      sortValue: (c) => c.created_at,
      cell: (c) => <span className="font-mono text-[11px] text-muted-foreground">{formatDate(c.created_at)}</span>,
    },
  ];

  const baselinePageData = paginate(
    sortRows(baselines.data ?? [], baselineColumns, baselineSort),
    baselinePage,
    PAGE_SIZE,
  );
  const comparisonPageData = paginate(
    sortRows(filteredComparisons, comparisonColumns, comparisonSort),
    comparisonPage,
    PAGE_SIZE,
  );

  const baselineOptions = (allBaselines.data ?? []).map((b) => ({ value: b.id, label: b.name }));
  const targetOptions = (targets.data?.items ?? []).map((t) => ({ value: t.id, label: t.name }));
  const verdictOptions = Object.entries(VERDICT_META).map(([value, m]) => ({ value, label: m.label }));
  const comparisonFiltersActive = !!(baselineFilter || verdictFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regression testing"
        description="Freeze a completed run as an immutable baseline, re-execute its scenarios against new builds, and classify every finding by fingerprint."
      >
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Refresh"
          title="Refresh"
          onClick={() => {
            baselines.refetch();
            comparisons.refetch();
          }}
        >
          <RotateCw className={cn('h-3.5 w-3.5', (baselines.isFetching || comparisons.isFetching) && 'animate-spin')} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New baseline
        </Button>
        <Button size="sm" onClick={() => openExecute()} disabled={!allBaselines.data?.length}>
          <GitCompareArrows className="h-3.5 w-3.5" /> Run regression
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Baselines"
          value={formatNumber(allBaselines.data?.length)}
          subtitle={`${formatNumber(allBaselines.data?.filter((b) => b.is_active).length ?? 0)} active`}
          icon={Database}
          isLoading={allBaselines.isLoading}
        />
        <StatsCard
          title="Comparisons"
          value={formatNumber(comparisons.data?.length)}
          subtitle={baselineFilter ? 'For selected baseline' : 'All baselines'}
          icon={GitCompareArrows}
          isLoading={comparisons.isLoading}
        />
        <StatsCard
          title="Regressions detected"
          value={formatNumber(stats.regressions)}
          subtitle="Comparisons with new findings"
          icon={Siren}
          tone="critical"
          isLoading={comparisons.isLoading}
        />
        <StatsCard
          title="New vs resolved"
          value={`${formatNumber(stats.newFindings)} / ${formatNumber(stats.resolved)}`}
          subtitle="Findings across comparisons"
          icon={ShieldAlert}
          isLoading={comparisons.isLoading}
        />
      </div>

      <Panel
        title="Security baselines"
        description="Immutable snapshots used as the reference for regression comparison"
        icon={Database}
        flush
        actions={
          <FilterSelect
            label="Target"
            value={targetFilter}
            onChange={(v) => {
              setTargetFilter(v);
              setBaselinePage(1);
              setComparisonPage(1);
            }}
            options={targetOptions}
            allLabel="All targets"
          />
        }
      >
        <DataTable
          label="Security baselines"
          columns={baselineColumns}
          data={baselinePageData.items}
          getRowId={(b) => b.id}
          isLoading={baselines.isLoading}
          error={baselines.error}
          onRetry={() => baselines.refetch()}
          sort={baselineSort}
          onSortChange={(s) => {
            setBaselineSort(s);
            setBaselinePage(1);
          }}
          empty={
            <EmptyState
              bare
              compact
              icon={Database}
              title={targetFilter ? 'No baselines for this target' : 'No baselines yet'}
              description="Create a baseline from a completed test run to start tracking regressions across releases."
              actionText="New baseline"
              onAction={() => setCreateOpen(true)}
            />
          }
        />
        {(baselines.data?.length ?? 0) > PAGE_SIZE && (
          <Pagination
            page={baselinePageData.page}
            totalPages={baselinePageData.totalPages}
            total={baselinePageData.total}
            pageSize={PAGE_SIZE}
            onPageChange={setBaselinePage}
            itemLabel="baselines"
          />
        )}
      </Panel>

      <Panel title="Regression comparisons" description="Baseline versus re-executed run" icon={GitCompareArrows} flush>
        <FilterBar
          actions={
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatNumber(filteredComparisons.length)} comparisons
            </span>
          }
        >
          <FilterSelect
            label="Baseline"
            value={baselineFilter}
            onChange={(v) => {
              setBaselineFilter(v);
              setComparisonPage(1);
            }}
            options={baselineOptions}
            allLabel="All baselines"
          />
          <FilterSelect
            label="Verdict"
            value={verdictFilter}
            onChange={(v) => {
              setVerdictFilter(v);
              setComparisonPage(1);
            }}
            options={verdictOptions}
          />
          <ClearFiltersButton
            visible={comparisonFiltersActive}
            onClick={() => {
              setBaselineFilter('');
              setVerdictFilter('');
              setComparisonPage(1);
            }}
          />
        </FilterBar>
        <DataTable
          label="Regression comparisons"
          columns={comparisonColumns}
          data={comparisonPageData.items}
          getRowId={(c) => c.id}
          isLoading={comparisons.isLoading}
          error={comparisons.error}
          onRetry={() => comparisons.refetch()}
          sort={comparisonSort}
          onSortChange={(s) => {
            setComparisonSort(s);
            setComparisonPage(1);
          }}
          onRowClick={(c) => router.push(`/regression/${c.id}`)}
          empty={
            <EmptyState
              bare
              compact
              icon={GitCompareArrows}
              title={comparisonFiltersActive || targetFilter ? 'No comparisons match these filters' : 'No comparisons yet'}
              description="Run a regression against a baseline to classify findings as new, resolved, recurring or inconclusive."
            />
          }
        />
        {filteredComparisons.length > PAGE_SIZE && (
          <Pagination
            page={comparisonPageData.page}
            totalPages={comparisonPageData.totalPages}
            total={comparisonPageData.total}
            pageSize={PAGE_SIZE}
            onPageChange={setComparisonPage}
            itemLabel="comparisons"
          />
        )}
      </Panel>

      <CreateBaselineDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ExecuteRegressionDialog
        open={executeOpen}
        onOpenChange={setExecuteOpen}
        baselines={allBaselines.data ?? []}
        defaultBaselineId={executeBaselineId}
      />
    </div>
  );
}
