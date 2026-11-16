'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  FileSearch,
  FlaskConical,
  Play,
  RotateCcw,
  Scale,
  ShieldCheck,
  ThumbsDown,
  Users,
} from 'lucide-react';
import { SegmentBar } from '@/components/charts/bar-list';
import { TONE_HEX } from '@/components/charts/chart-theme';
import { Meter } from '@/components/charts/meter';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { CodeViewer } from '@/components/shared/code-viewer';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/data-table';
import { ErrorState } from '@/components/shared/error-state';
import { ClearFiltersButton, FilterBar, FilterSelect, SegmentedControl } from '@/components/shared/filter-bar';
import { IdChip } from '@/components/shared/id-chip';
import { Pagination, paginate } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { PageSkeleton } from '@/components/shared/skeletons';
import { StatusPill } from '@/components/shared/status-pill';
import { UnavailableNotice } from '@/components/shared/unavailable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSecurityUtilitySummary } from '@/hooks/use-evaluation';
import { useTestRuns } from '@/hooks/use-test-runs';
import { formatNumber, formatPercent, formatTimestamp, humanize, shortId } from '@/lib/format';
import type { StatusMeta } from '@/lib/status';
import { formatDate } from '@/lib/utils';
import type { PairedEvaluationItem } from '@/types/evaluation';

const SECURITY_VERDICT_META: Record<PairedEvaluationItem['security_verdict'], StatusMeta> = {
  PASSED: { label: 'Defended', tone: 'success', description: 'Adversarial case did not succeed.' },
  FAILED: { label: 'Compromised', tone: 'critical', description: 'Adversarial case succeeded.' },
  INCONCLUSIVE: { label: 'Inconclusive', tone: 'neutral' },
};

const UTILITY_VERDICT_META: Record<PairedEvaluationItem['utility_verdict'], StatusMeta> = {
  SATISFIED: { label: 'Satisfied', tone: 'success', description: 'Benign control completed its task.' },
  OVER_REFUSAL: { label: 'Over-refusal', tone: 'warning', description: 'Benign control was refused.' },
  TASK_FAILED: { label: 'Task failed', tone: 'critical', description: 'Benign control did not complete.' },
  INCONCLUSIVE: { label: 'Inconclusive', tone: 'neutral' },
};

const PAGE_SIZE = 20;

/** Sorts the full list before client-side pagination (DataTable only sorts the rows it receives). */
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


function VerdictPill({ meta }: { meta: StatusMeta }) {
  return <StatusPill tone={meta.tone} label={meta.label} title={meta.description} />;
}

export default function SecurityEvaluationPage() {
  const runsQuery = useTestRuns({ status: 'COMPLETED', page_size: 50 });
  const completedRuns = useMemo(() => runsQuery.data?.items ?? [], [runsQuery.data]);

  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const activeRunId = selectedRunId || (completedRuns.length > 0 ? completedRuns[0].id : '');
  const activeRun = completedRuns.find((r) => r.id === activeRunId);

  const summaryQuery = useSecurityUtilitySummary(activeRunId);
  const summary = summaryQuery.data;
  const measured = !!summary && summary.total_pairs > 0;

  const [securityFilter, setSecurityFilter] = useState('');
  const [utilityFilter, setUtilityFilter] = useState('');
  const [scope, setScope] = useState<'all' | 'over_refusal' | 'regression'>('all');
  const [page, setPage] = useState(1);
  const [inspected, setInspected] = useState<PairedEvaluationItem | null>(null);
  const [sort, setSort] = useState<SortState>(null);

  const filteredPairs = useMemo(() => {
    const pairs = summary?.pairs ?? [];
    return pairs.filter(
      (p) =>
        (!securityFilter || p.security_verdict === securityFilter) &&
        (!utilityFilter || p.utility_verdict === utilityFilter) &&
        (scope === 'all' ||
          (scope === 'over_refusal' && p.is_over_refusal) ||
          (scope === 'regression' && p.is_utility_regression)),
    );
  }, [summary, securityFilter, utilityFilter, scope]);

  const hasFilters = !!securityFilter || !!utilityFilter || scope !== 'all';

  const verdictMix = useMemo(() => {
    const pairs = summary?.pairs ?? [];
    const count = <K extends string>(get: (p: PairedEvaluationItem) => K, key: K) =>
      pairs.filter((p) => get(p) === key).length;
    return {
      security: (Object.keys(SECURITY_VERDICT_META) as PairedEvaluationItem['security_verdict'][]).map((k) => ({
        key: k,
        label: SECURITY_VERDICT_META[k].label,
        value: count((p) => p.security_verdict, k),
        color: TONE_HEX[SECURITY_VERDICT_META[k].tone],
      })),
      utility: (Object.keys(UTILITY_VERDICT_META) as PairedEvaluationItem['utility_verdict'][]).map((k) => ({
        key: k,
        label: UTILITY_VERDICT_META[k].label,
        value: count((p) => p.utility_verdict, k),
        color: TONE_HEX[UTILITY_VERDICT_META[k].tone],
      })),
    };
  }, [summary]);

  const caseLink = (caseId: string | null) =>
    caseId ? (
      <Link
        href={`/test-runs/${activeRunId}/cases/${caseId}`}
        onClick={(e) => e.stopPropagation()}
        className="font-mono text-xs text-primary hover:underline"
        title={caseId}
      >
        {shortId(caseId)}
      </Link>
    ) : (
      <span className="text-xs italic text-subtle-foreground">Unpaired</span>
    );

  const columns: DataTableColumn<PairedEvaluationItem>[] = [
    {
      id: 'pair',
      header: 'Pair',
      sortValue: (p) => p.pair_id,
      cell: (p) => <IdChip value={p.pair_id} length={14} />,
    },
    { id: 'adv', header: 'Adversarial case', cell: (p) => caseLink(p.adversarial_case_id) },
    { id: 'benign', header: 'Benign control', cell: (p) => caseLink(p.benign_case_id), hideBelow: 'md' },
    {
      id: 'security',
      header: 'Security',
      sortValue: (p) => p.security_verdict,
      cell: (p) => <VerdictPill meta={SECURITY_VERDICT_META[p.security_verdict]} />,
    },
    {
      id: 'utility',
      header: 'Utility',
      sortValue: (p) => p.utility_verdict,
      cell: (p) => <VerdictPill meta={UTILITY_VERDICT_META[p.utility_verdict]} />,
    },
    {
      id: 'flags',
      header: 'Flags',
      hideBelow: 'lg',
      cell: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.is_over_refusal && <StatusPill tone="warning" label="Over-refusal" variant="plain" />}
          {p.is_utility_regression && <StatusPill tone="high" label="Utility regression" variant="plain" />}
          {!p.is_over_refusal && !p.is_utility_regression && (
            <span className="text-xs text-subtle-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      id: 'evaluated',
      header: 'Evaluated',
      align: 'right',
      hideBelow: 'xl',
      sortValue: (p) => p.evaluated_at,
      cell: (p) => <span className="font-mono text-[11px] text-muted-foreground">{formatTimestamp(p.evaluated_at)}</span>,
    },
    {
      id: 'inspect',
      header: <span className="sr-only">Inspect</span>,
      align: 'right',
      cell: (p) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            setInspected(p);
          }}
        >
          <FileSearch className="h-3.5 w-3.5" /> Inspect
        </Button>
      ),
    },
  ];

  const paged = paginate(sortRows(filteredPairs, columns, sort), page, PAGE_SIZE);

  if (runsQuery.isLoading) return <PageSkeleton />;

  const header = (
    <PageHeader
      icon={Scale}
      title="Security evaluation"
      description="Paired security–utility analysis: each adversarial case is matched with a benign control so defenses are measured against the usefulness they cost."
      meta={
        activeRun ? (
          <>
            <HeaderMeta label="Run">
              <Link href={`/test-runs/${activeRun.id}`} className="font-mono text-xs hover:text-primary">
                {shortId(activeRun.id)}
              </Link>
            </HeaderMeta>
            <HeaderMeta label="Target">{activeRun.target?.name ?? activeRun.execution_snapshot?.target?.name ?? '—'}</HeaderMeta>
            <HeaderMeta label="Suite">{activeRun.test_suite?.name ?? activeRun.execution_snapshot?.test_suite?.name ?? '—'}</HeaderMeta>
            <HeaderMeta label="Completed">{formatDate(activeRun.completed_at)}</HeaderMeta>
          </>
        ) : undefined
      }
    >
      <Button asChild variant="outline" size="sm">
        <Link href="/evaluation/experiments">
          Research experiments <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Refresh evaluation"
        title="Refresh"
        disabled={!activeRunId}
        onClick={() => {
          runsQuery.refetch();
          summaryQuery.refetch();
        }}
      >
        <RotateCcw className={`h-3.5 w-3.5 ${summaryQuery.isFetching ? 'animate-spin' : ''}`} />
      </Button>
    </PageHeader>
  );

  if (runsQuery.isError) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState error={runsQuery.error} onRetry={() => runsQuery.refetch()} />
      </div>
    );
  }

  if (completedRuns.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={Scale}
          title="No completed test runs to evaluate"
          description="Security–utility evaluation reads paired adversarial and benign cases from a completed run. Launch a run with a suite that contains paired scenarios."
          actionText="Launch test run"
          actionHref="/test-runs/new"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="eyebrow shrink-0">Evaluated run</span>
        <Select
          value={activeRunId}
          onValueChange={(v) => {
            setSelectedRunId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 sm:max-w-md" aria-label="Select completed test run">
            <SelectValue placeholder="Select a completed run" />
          </SelectTrigger>
          <SelectContent>
            {completedRuns.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {(r.test_suite?.name ?? 'Suite') + ' · ' + formatDate(r.created_at) + ' · ' + shortId(r.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-subtle-foreground">
          {formatNumber(completedRuns.length)} completed runs available
        </span>
      </div>

      {summaryQuery.isError ? (
        <ErrorState error={summaryQuery.error} onRetry={() => summaryQuery.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatsCard
              title="Case pairs"
              value={formatNumber(summary?.total_pairs)}
              subtitle="Adversarial ↔ benign controls"
              icon={Users}
              isLoading={summaryQuery.isLoading}
            />
            <StatsCard
              title="Security effectiveness"
              value={formatPercent(summary?.security_pass_rate_pct)}
              subtitle="Attacks defended"
              icon={ShieldCheck}
              tone="success"
              unavailable={!measured}
              isLoading={summaryQuery.isLoading}
            />
            <StatsCard
              title="Utility preservation"
              value={formatPercent(summary?.benign_completion_rate_pct)}
              subtitle="Benign tasks completed"
              icon={Scale}
              tone="info"
              unavailable={!measured}
              isLoading={summaryQuery.isLoading}
            />
            <StatsCard
              title="Over-refusals"
              value={formatNumber(summary?.over_refusals_detected)}
              subtitle={measured ? `${formatPercent(summary?.over_refusal_rate_pct)} of pairs` : 'Benign tasks rejected'}
              icon={ThumbsDown}
              tone="warning"
              unavailable={!measured}
              isLoading={summaryQuery.isLoading}
            />
          </div>

          {!summaryQuery.isLoading && !measured && (
            <UnavailableNotice
              title="No paired cases in this run"
              description="This run contains no adversarial/benign case pairs, so security–utility rates cannot be measured. Values are shown as “Not measured” rather than 0%. Select another run or execute a suite with paired scenarios."
            />
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Security–utility balance" description="Rates over all evaluated pairs" icon={Scale}>
              {summaryQuery.isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <div className="space-y-4">
                  <Meter
                    label="Security pass rate"
                    value={measured ? summary?.security_pass_rate_pct : null}
                    tone="success"
                    hint="Share of adversarial cases the target defended."
                  />
                  <Meter
                    label="Benign completion rate"
                    value={measured ? summary?.benign_completion_rate_pct : null}
                    tone="info"
                    hint="Share of benign controls completed as intended."
                  />
                  <Meter
                    label="Over-refusal rate"
                    value={measured ? summary?.over_refusal_rate_pct : null}
                    tone="warning"
                    hint="Benign controls wrongly refused. Lower is better."
                  />
                  <Meter
                    label="Utility regression rate"
                    value={measured ? summary?.utility_regression_rate_pct : null}
                    tone="high"
                    hint="Pairs where defending the attack degraded benign utility."
                  />
                </div>
              )}
            </Panel>

            <Panel title="Paired evaluation outcomes" description="Verdict distribution per side of each pair">
              {summaryQuery.isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="eyebrow mb-2">Adversarial (security)</p>
                    <SegmentBar items={verdictMix.security} emptyMessage="No adversarial verdicts" />
                  </div>
                  <div>
                    <p className="eyebrow mb-2">Benign (utility)</p>
                    <SegmentBar items={verdictMix.utility} emptyMessage="No benign verdicts" />
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Methodology" description="How these values were computed">
              {summaryQuery.isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : summary?.methodology_notes?.length ? (
                <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground marker:font-mono marker:text-subtle-foreground">
                  {summary.methodology_notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs italic text-subtle-foreground">No methodology notes returned for this run.</p>
              )}
            </Panel>
          </div>

          <Panel
            title="Paired case outcomes"
            description={measured ? `${formatNumber(filteredPairs.length)} of ${formatNumber(summary?.pairs.length)} pairs` : undefined}
            flush
          >
            <FilterBar
              actions={
                <SegmentedControl
                  label="Pair scope"
                  value={scope}
                  onChange={(v) => {
                    setScope(v);
                    setPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'All pairs' },
                    { value: 'over_refusal', label: 'Over-refusals' },
                    { value: 'regression', label: 'Regressions' },
                  ]}
                />
              }
            >
              <FilterSelect
                label="Security"
                value={securityFilter}
                onChange={(v) => {
                  setSecurityFilter(v);
                  setPage(1);
                }}
                options={Object.entries(SECURITY_VERDICT_META).map(([value, m]) => ({ value, label: m.label }))}
              />
              <FilterSelect
                label="Utility"
                value={utilityFilter}
                onChange={(v) => {
                  setUtilityFilter(v);
                  setPage(1);
                }}
                options={Object.entries(UTILITY_VERDICT_META).map(([value, m]) => ({ value, label: m.label }))}
              />
              <ClearFiltersButton
                visible={hasFilters}
                onClick={() => {
                  setSecurityFilter('');
                  setUtilityFilter('');
                  setScope('all');
                  setPage(1);
                }}
              />
            </FilterBar>
            <DataTable
              label="Paired case outcomes"
              columns={columns}
              data={paged.items}
              getRowId={(p) => p.pair_id}
              isLoading={summaryQuery.isLoading}
              onRowClick={(p) => setInspected(p)}
              sort={sort}
              onSortChange={(s) => {
                setSort(s);
                setPage(1);
              }}
              empty={
                <EmptyState
                  bare
                  compact
                  icon={Scale}
                  title={hasFilters ? 'No pairs match these filters' : 'No paired evaluations'}
                  description={
                    hasFilters
                      ? 'Adjust or clear the filters to see more pairs.'
                      : 'The selected run did not record any adversarial/benign pairs.'
                  }
                >
                  {!hasFilters && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/test-runs/new">
                        <Play className="h-3.5 w-3.5" /> Launch test run
                      </Link>
                    </Button>
                  )}
                </EmptyState>
              }
            />
            {filteredPairs.length > PAGE_SIZE && (
              <Pagination
                page={paged.page}
                totalPages={paged.totalPages}
                total={paged.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="pairs"
              />
            )}
          </Panel>

          <div className="flex justify-end">
            <Link
              href="/evaluation/experiments"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <FlaskConical className="h-3.5 w-3.5" /> Measure provenance accuracy with ground-truth experiments
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </>
      )}

      <Dialog open={!!inspected} onOpenChange={(o) => !o && setInspected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pair {inspected?.pair_id}</DialogTitle>
            <DialogDescription>Evaluation record returned by the security–utility endpoint.</DialogDescription>
          </DialogHeader>
          {inspected && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <VerdictPill meta={SECURITY_VERDICT_META[inspected.security_verdict]} />
                <VerdictPill meta={UTILITY_VERDICT_META[inspected.utility_verdict]} />
                {inspected.is_over_refusal && <StatusPill tone="warning" label="Over-refusal" />}
                {inspected.is_utility_regression && <StatusPill tone="high" label="Utility regression" />}
              </div>
              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="eyebrow mb-1">Adversarial case</p>
                  {caseLink(inspected.adversarial_case_id)}
                </div>
                <div>
                  <p className="eyebrow mb-1">Benign control</p>
                  {caseLink(inspected.benign_case_id)}
                </div>
                <div>
                  <p className="eyebrow mb-1">Evaluated</p>
                  <span className="font-mono text-muted-foreground">{formatTimestamp(inspected.evaluated_at)}</span>
                </div>
                <div>
                  <p className="eyebrow mb-1">Verdicts</p>
                  <span className="font-mono text-muted-foreground">
                    {humanize(inspected.security_verdict)} / {humanize(inspected.utility_verdict)}
                  </span>
                </div>
              </div>
              <CodeViewer title="Details" value={inspected.details} emptyText="No additional details recorded" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
