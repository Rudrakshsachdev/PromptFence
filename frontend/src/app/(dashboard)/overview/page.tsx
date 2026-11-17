'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Crosshair,
  Fingerprint,
  GitCompareArrows,
  Plus,
  Play,
  ShieldAlert,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import { BarList, SegmentBar } from '@/components/charts/bar-list';
import { TONE_HEX, SERIES } from '@/components/charts/chart-theme';
import { ColumnChart } from '@/components/charts/column-chart';
import { Meter, ScoreDial } from '@/components/charts/meter';
import { TrendChart } from '@/components/charts/trend-chart';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { DateRangeSelect } from '@/components/shared/filter-bar';
import { Panel } from '@/components/shared/panel';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { ErrorState } from '@/components/shared/error-state';
import { RunStatusBadge } from '@/components/shared/status-badges';
import { Timeline } from '@/components/shared/timeline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAnalyticsDistribution,
  useAnalyticsOverview,
  useAnalyticsTrends,
  useTargetComparisons,
} from '@/hooks/use-analytics';
import { useDashboardActivity, useDashboardOverview } from '@/hooks/use-dashboard';
import { useFindings } from '@/hooks/use-findings';
import { useComparisons } from '@/hooks/use-regression';
import { useTestRuns } from '@/hooks/use-test-runs';
import { durationBetween, formatDuration, formatNumber, formatPercent } from '@/lib/format';
import {
  getCategoryLabel,
  getSeverityMeta,
  RUN_STATUS_META,
  SEVERITY_HEX,
  SEVERITY_ORDER,
  getTargetTypeLabel,
} from '@/lib/status';
import { formatRelativeTime } from '@/lib/utils';
import type { TargetComparisonItem } from '@/types/analytics';
import type { FindingSeverity } from '@/types/finding';
import type { TestRun, TestRunStatus } from '@/types/test-run';

const RUN_SAMPLE = 100;

export default function OverviewPage() {
  const router = useRouter();
  const [days, setDays] = useState(30);

  const dashboard = useDashboardOverview();
  const analytics = useAnalyticsOverview({ days });
  const trends = useAnalyticsTrends({ days });
  const distribution = useAnalyticsDistribution({ days });
  const comparisons = useTargetComparisons();
  const activity = useDashboardActivity();
  const runs = useTestRuns({ page: 1, page_size: RUN_SAMPLE });
  const criticalFindings = useFindings({ severity: 'CRITICAL', status: 'OPEN', page: 1, page_size: 5, sort: 'newest' });
  const regressions = useComparisons();

  const a = analytics.data;
  const hasScore = !!a && a.security_score.total_eligible_cases > 0;

  const regressionFailures = useMemo(
    () => regressions.data?.filter((c) => (c.comparison_metrics?.new_findings_count ?? 0) > 0).length,
    [regressions.data],
  );

  const runStatusMix = useMemo(() => {
    const counts: Partial<Record<TestRunStatus, number>> = {};
    for (const r of runs.data?.items ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
    const order: TestRunStatus[] = ['COMPLETED', 'RUNNING', 'QUEUED', 'PENDING', 'FAILED', 'CANCELLED'];
    return order
      .filter((s) => counts[s])
      .map((s) => ({
        key: s,
        label: RUN_STATUS_META[s].label,
        value: counts[s] ?? 0,
        color: TONE_HEX[RUN_STATUS_META[s].tone],
      }));
  }, [runs.data]);

  const severityItems = useMemo(() => {
    const bySeverity = new Map(distribution.data?.by_severity.map((s) => [s.severity, s]));
    return SEVERITY_ORDER.map((sev) => {
      const row = bySeverity.get(sev);
      return {
        key: sev,
        label: getSeverityMeta(sev).label,
        value: row?.count ?? 0,
        secondary: row ? formatPercent(row.percentage, 0) : '0%',
        color: SEVERITY_HEX[sev],
        href: `/findings?severity=${sev}`,
      };
    });
  }, [distribution.data]);

  const categoryItems = useMemo(
    () =>
      [...(distribution.data?.by_category ?? [])]
        .sort((x, y) => y.count - x.count)
        .map((c) => ({
          key: c.category,
          label: getCategoryLabel(c.category),
          value: c.count,
          secondary: formatPercent(c.percentage, 0),
          color: SERIES[0],
          href: `/findings?category=${c.category}`,
        })),
    [distribution.data],
  );

  const recentRunColumns: DataTableColumn<TestRun>[] = [
    {
      id: 'id',
      header: 'Execution',
      cell: (r) => (
        <div className="min-w-0">
          <Link
            href={`/test-runs/${r.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate font-medium text-foreground hover:text-primary"
          >
            {r.target?.name ?? r.execution_snapshot?.target?.name ?? 'Unknown target'}
          </Link>
          <span className="font-mono text-[11px] text-subtle-foreground">{r.id.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      id: 'suite',
      header: 'Suite',
      hideBelow: 'md',
      cell: (r) => (
        <span className="text-muted-foreground">
          {r.test_suite?.name ?? r.execution_snapshot?.test_suite?.name ?? '—'}
        </span>
      ),
    },
    { id: 'status', header: 'Status', cell: (r) => <RunStatusBadge status={r.status} /> },
    {
      id: 'result',
      header: 'Pass / Fail',
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
      hideBelow: 'lg',
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
        <span className="text-xs text-muted-foreground">{formatRelativeTime(r.started_at ?? r.created_at)}</span>
      ),
    },
  ];

  const targetColumns: DataTableColumn<TargetComparisonItem>[] = [
    {
      id: 'name',
      header: 'Target',
      sortValue: (t) => t.target_name,
      cell: (t) => (
        <div className="min-w-0">
          <Link href={`/targets/${t.target_id}`} className="block truncate font-medium hover:text-primary">
            {t.target_name}
          </Link>
          <span className="text-[11px] text-subtle-foreground">
            {getTargetTypeLabel(t.target_type)} · v{t.target_version}
          </span>
        </div>
      ),
    },
    {
      id: 'score',
      header: 'Score',
      align: 'right',
      sortValue: (t) => t.security_score,
      cell: (t) => (
        <span
          className={`font-mono tabular-nums ${t.security_score >= 80 ? 'text-success' : t.security_score >= 60 ? 'text-warning' : 'text-critical'}`}
        >
          {t.cases_evaluated > 0 ? t.security_score.toFixed(1) : '—'}
        </span>
      ),
    },
    {
      id: 'critical',
      header: 'Critical / High',
      align: 'right',
      sortValue: (t) => t.critical_findings * 1000 + t.high_findings,
      cell: (t) => (
        <span className="font-mono text-xs tabular-nums">
          <span className={t.critical_findings ? 'text-critical' : 'text-muted-foreground'}>{t.critical_findings}</span>
          <span className="text-subtle-foreground"> / </span>
          <span className={t.high_findings ? 'text-high' : 'text-muted-foreground'}>{t.high_findings}</span>
        </span>
      ),
    },
    {
      id: 'canary',
      header: 'Canary exposure',
      align: 'right',
      hideBelow: 'md',
      sortValue: (t) => t.canary_exposure_rate,
      cell: (t) => <span className="font-mono text-xs tabular-nums">{formatPercent(t.canary_exposure_rate)}</span>,
    },
    {
      id: 'tool',
      header: 'Tool violations',
      align: 'right',
      hideBelow: 'lg',
      sortValue: (t) => t.tool_violation_rate,
      cell: (t) => <span className="font-mono text-xs tabular-nums">{formatPercent(t.tool_violation_rate)}</span>,
    },
    {
      id: 'runs',
      header: 'Runs · Cases',
      align: 'right',
      hideBelow: 'lg',
      sortValue: (t) => t.cases_evaluated,
      cell: (t) => (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {t.runs_count} · {t.cases_evaluated}
        </span>
      ),
    },
    {
      id: 'coverage',
      header: 'Coverage',
      hideBelow: 'md',
      cell: (t) =>
        t.coverage_sufficient ? (
          <span className="text-xs text-success">Sufficient</span>
        ) : (
          <span className="text-xs text-warning" title={t.coverage_warning ?? undefined}>
            Limited
          </span>
        ),
    },
  ];

  const isEmptyWorkspace = dashboard.data && dashboard.data.total_targets === 0;

  // Daily series from the trends API, drawn as sparklines on the KPI cards.
  const trendPoints = trends.data?.points ?? [];
  const sparkline = (key: TrendKey, color: string, noun: string) => {
    if (trendPoints.length < 2) return undefined;
    const values = trendPoints.map((p) => p[key] ?? 0);
    const total = values.reduce((sum, v) => sum + v, 0);
    return {
      values,
      color,
      summary: `${formatNumber(total)} ${noun} over the last ${days} days · peak ${formatNumber(Math.max(...values))} in a day`,
    };
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title="Security overview"
        description="Posture, execution activity and open risk across every registered target."
      >
        <DateRangeSelect value={days} onChange={setDays} />
        <Button asChild variant="outline" size="sm">
          <Link href="/targets/new">
            <Plus className="h-3.5 w-3.5" /> Register target
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/test-runs/new">
            <Play className="h-3.5 w-3.5" /> Launch test run
          </Link>
        </Button>
      </PageHeader>

      {isEmptyWorkspace && (
        <EmptyState
          icon={Crosshair}
          title="Register your first target to begin"
          description="PromptFence tests LLM, RAG and agent endpoints. Add a target, assemble a suite of attack scenarios, then launch a run."
          actionText="Register target"
          actionHref="/targets/new"
        >
          <Button asChild variant="outline" size="sm">
            <Link href="/scenarios">Browse scenarios</Link>
          </Button>
        </EmptyState>
      )}

      {/* KPIs */}
      <section aria-labelledby="overview-kpis" className="space-y-4">
        <h2 id="overview-kpis" className="sr-only">
          Key metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
          <StatsCard
            title="Targets"
            value={formatNumber(dashboard.data?.total_targets)}
            subtitle={`${formatNumber(dashboard.data?.active_targets ?? 0)} active`}
            icon={Crosshair}
            href="/targets"
            isLoading={dashboard.isLoading}
          />
          <StatsCard
            title="Test executions"
            value={formatNumber(a?.total_test_runs)}
            subtitle={`${formatNumber(a?.total_cases_executed ?? 0)} cases · ${days}d`}
            icon={Activity}
            href="/test-runs"
            isLoading={analytics.isLoading}
            sparkline={sparkline('runs_count', SERIES[0], 'test runs')}
          />
          <StatsCard
            title="Vulnerabilities"
            value={formatNumber(a?.total_findings)}
            subtitle={`${formatNumber(a?.high_findings ?? 0)} high severity`}
            icon={ShieldAlert}
            href="/findings"
            isLoading={analytics.isLoading}
            sparkline={sparkline('findings_count', SERIES[1], 'findings')}
          />
          <StatsCard
            title="Critical findings"
            value={formatNumber(a?.critical_findings)}
            subtitle={`${formatNumber(criticalFindings.data?.total ?? 0)} open, untriaged`}
            icon={Siren}
            tone="critical"
            href="/findings?severity=CRITICAL&status=OPEN"
            isLoading={analytics.isLoading}
          />
          <StatsCard
            title="Canary exposures"
            value={formatNumber(a?.canary_exposure_rate.numerator)}
            subtitle={a ? `${formatPercent(a.canary_exposure_rate.percentage)} of ${formatNumber(a.canary_exposure_rate.denominator)} canaries` : undefined}
            icon={Fingerprint}
            tone="critical"
            href="/provenance"
            isLoading={analytics.isLoading}
            sparkline={sparkline('canary_exposures', SERIES[4], 'canary exposures')}
          />
          <StatsCard
            title="Regression failures"
            value={formatNumber(regressionFailures)}
            subtitle={`of ${formatNumber(regressions.data?.length ?? 0)} comparisons`}
            icon={GitCompareArrows}
            tone="warning"
            href="/regression"
            isLoading={regressions.isLoading}
          />
        </div>
        {analytics.isError && <ErrorState error={analytics.error} onRetry={() => analytics.refetch()} compact />}
      </section>

      {/* Posture + trend */}
      <DashboardSection id="overview-posture" title="Security posture">
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            headingLevel="h3"
            title="Posture score"
            description={a ? `Formula ${a.security_score.formula_version} · last ${days} days` : 'Weighted, deterministic score'}
            icon={ShieldCheck}
            actions={<PanelLink href="/analytics">Details</PanelLink>}
          >
            {analytics.isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-5">
                  <ScoreDial
                    score={hasScore ? a?.security_score.score : null}
                    grade={a?.security_score.grade}
                    size={116}
                  />
                  <dl className="min-w-0 flex-1 space-y-2.5 text-xs">
                    <PostureFact label="Coverage" value={formatPercent(a?.security_score.coverage_pct, 0)} />
                    <PostureFact label="Eligible cases" value={formatNumber(a?.security_score.total_eligible_cases)} />
                    <PostureFact label="Canaries monitored" value={formatNumber(a?.active_canaries_monitored)} />
                    {!hasScore && <p className="pt-1 text-subtle-foreground">Run a suite to compute a score.</p>}
                  </dl>
                </div>
                <div className="space-y-3.5 border-t border-border pt-5">
                  <Meter
                    label="Canary exposure rate"
                    value={a && a.canary_exposure_rate.denominator > 0 ? a.canary_exposure_rate.percentage : null}
                    tone="critical"
                    hint={a?.canary_exposure_rate.definition}
                  />
                  <Meter
                    label="Tool boundary violation rate"
                    value={a && a.tool_violation_rate.denominator > 0 ? a.tool_violation_rate.percentage : null}
                    tone="high"
                  />
                  <Meter
                    label="Benign test pass rate"
                    value={a && a.benign_pass_rate.denominator > 0 ? a.benign_pass_rate.percentage : null}
                    tone="success"
                  />
                  <Meter
                    label="False-positive rate"
                    value={a && a.false_positive_rate.denominator > 0 ? a.false_positive_rate.percentage : null}
                    tone="neutral"
                  />
                </div>
              </div>
            )}
          </Panel>

          <Panel
            headingLevel="h3"
            className="lg:col-span-2"
            title="Execution & findings trend"
            description={`Daily counts · last ${days} days`}
            icon={Activity}
          >
            {trends.isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : trends.isError ? (
              <ErrorState error={trends.error} onRetry={() => trends.refetch()} compact />
            ) : (
              <TrendChart
                data={trendPoints}
                xKey="date"
                height={280}
                series={[
                  { key: 'runs_count', label: 'Test runs', color: SERIES[0] },
                  { key: 'findings_count', label: 'Findings', color: SERIES[1] },
                ]}
                emptyMessage="No executions in this period"
                emptyHint="Launch a test run to start building history."
              />
            )}
          </Panel>
        </div>
      </DashboardSection>

      {/* Findings + exposure */}
      <DashboardSection id="overview-findings" title="Findings & exposure">
        <div className="grid gap-4 xl:grid-cols-3 xl:items-start">
          <div className="grid gap-4 md:grid-cols-2 xl:col-span-2">
            <Panel headingLevel="h3" title="Findings by severity" description={`Last ${days} days`}>
              {distribution.isLoading ? (
                <Skeleton className="h-[180px] w-full" />
              ) : distribution.isError ? (
                <ErrorState error={distribution.error} onRetry={() => distribution.refetch()} compact />
              ) : (
                <BarList items={severityItems} emptyMessage="No findings recorded" />
              )}
            </Panel>
            <Panel headingLevel="h3" title="Vulnerability categories" description={`Last ${days} days`}>
              {distribution.isLoading ? (
                <Skeleton className="h-[180px] w-full" />
              ) : distribution.isError ? (
                <ErrorState error={distribution.error} onRetry={() => distribution.refetch()} compact />
              ) : (
                <BarList items={categoryItems} emptyMessage="No findings recorded" />
              )}
            </Panel>
            <Panel
              headingLevel="h3"
              className="md:col-span-2"
              title="Successful attack outcomes"
              description="Daily canary exposures and unauthorized tool calls observed in target output"
              icon={Fingerprint}
            >
              {trends.isLoading ? (
                <Skeleton className="h-[240px] w-full" />
              ) : trends.isError ? (
                <ErrorState error={trends.error} onRetry={() => trends.refetch()} compact />
              ) : (
                <ColumnChart
                  data={trendPoints}
                  xKey="date"
                  height={220}
                  legendTotals
                  series={[
                    { key: 'canary_exposures', label: 'Canary exposures', color: SERIES[4] },
                    { key: 'tool_violations', label: 'Tool violations', color: SERIES[3] },
                  ]}
                  emptyMessage="No attack outcomes in this period"
                />
              )}
            </Panel>
          </div>

          <Panel
            headingLevel="h3"
            className="xl:col-span-1"
            title="Open critical findings"
            icon={Siren}
            flush
            actions={
              <PanelLink href="/findings?severity=CRITICAL&status=OPEN" arrow>
                View all
              </PanelLink>
            }
          >
            {criticalFindings.isLoading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : criticalFindings.isError ? (
              <div className="p-5">
                <ErrorState error={criticalFindings.error} onRetry={() => criticalFindings.refetch()} compact />
              </div>
            ) : !criticalFindings.data?.items.length ? (
              <EmptyState
                bare
                compact
                icon={ShieldCheck}
                title="No open critical findings"
                description="Critical vulnerabilities that need triage will appear here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {criticalFindings.data.items.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/findings/${f.id}`}
                      className="block px-5 py-3.5 outline-none transition-colors hover:bg-surface/60 focus-visible:bg-surface"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-[13px] font-medium text-foreground">{f.title}</p>
                        <SeverityBadge severity={f.severity as FindingSeverity} compact className="shrink-0" />
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-subtle-foreground">
                        <CategoryBadge category={f.category} />
                        <span className="font-mono">{f.id.slice(0, 8)}</span>
                        <span className="ml-auto whitespace-nowrap">{formatRelativeTime(f.observed_at)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </DashboardSection>

      {/* Executions + activity */}
      <DashboardSection id="overview-executions" title="Executions & activity">
        <div className="grid gap-4 xl:grid-cols-3 xl:items-start">
          <Panel
            headingLevel="h3"
            className="xl:col-span-2"
            title="Recent test executions"
            icon={Activity}
            flush
            actions={
              <PanelLink href="/test-runs" arrow>
                All runs
              </PanelLink>
            }
          >
            <DataTable
              label="Recent test executions"
              columns={recentRunColumns}
              data={runs.data?.items.slice(0, 6)}
              getRowId={(r) => r.id}
              isLoading={runs.isLoading}
              error={runs.error}
              onRetry={() => runs.refetch()}
              onRowClick={(r) => router.push(`/test-runs/${r.id}`)}
              skeletonRows={5}
              empty={
                <EmptyState
                  bare
                  compact
                  icon={Play}
                  title="No executions yet"
                  description="Launch a test run to execute a suite of attack scenarios against a target."
                  actionText="Launch test run"
                  actionHref="/test-runs/new"
                />
              }
            />
          </Panel>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 xl:content-start">
            <Panel
              headingLevel="h3"
              title="Execution status"
              description={runs.isError ? 'Unavailable' : `Most recent ${formatNumber(Math.min(runs.data?.items.length ?? 0, RUN_SAMPLE))} runs`}
            >
              {runs.isLoading ? (
                <Skeleton className="h-[120px] w-full" />
              ) : runs.isError ? (
                <ErrorState error={runs.error} onRetry={() => runs.refetch()} compact />
              ) : (
                <SegmentBar items={runStatusMix} emptyMessage="No test runs yet" />
              )}
            </Panel>

            <Panel
              headingLevel="h3"
              title="Recent activity"
              description="Resource changes in this workspace"
              actions={<PanelLink href="/audit-logs">Audit trail</PanelLink>}
            >
              {activity.isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : activity.isError ? (
                <ErrorState error={activity.error} onRetry={() => activity.refetch()} compact />
              ) : !activity.data?.activities.length ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No recent activity.</p>
              ) : (
                <Timeline
                  timeFormatter={formatRelativeTime}
                  items={activity.data.activities.slice(0, 7).map((act, i) => ({
                    id: `${act.entity_id}-${i}`,
                    title: act.title,
                    timestamp: act.timestamp,
                    tone: act.type.startsWith('target') ? 'info' : act.type.startsWith('scenario') ? 'accent' : 'neutral',
                  }))}
                />
              )}
            </Panel>
          </div>
        </div>
      </DashboardSection>

      {/* Target overview */}
      <DashboardSection id="overview-targets" title="Targets">
        <Panel
          headingLevel="h3"
          title="Target security overview"
          description="Per-target score and exposure across all recorded executions"
          icon={Crosshair}
          flush
        >
          <DataTable
            label="Target security overview"
            columns={targetColumns}
            data={comparisons.data}
            getRowId={(t) => t.target_id}
            isLoading={comparisons.isLoading}
            error={comparisons.error}
            onRetry={() => comparisons.refetch()}
            initialSort={{ id: 'score', direction: 'asc' }}
            onRowClick={(t) => router.push(`/targets/${t.target_id}`)}
            empty={
              <EmptyState
                bare
                compact
                icon={Crosshair}
                title="No targets evaluated yet"
                description="Targets appear here once at least one test run has completed against them."
              />
            }
          />
        </Panel>
      </DashboardSection>
    </div>
  );
}

type TrendKey = 'runs_count' | 'findings_count' | 'canary_exposures';

/** A titled group of panels. The h2 keeps the page outline: h1 page → h2 section → h3 panel. */
function DashboardSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PanelLink({ href, arrow = false, children }: { href: string; arrow?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {children}
      {arrow && <ArrowRight className="h-3 w-3" aria-hidden />}
    </Link>
  );
}

function PostureFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
