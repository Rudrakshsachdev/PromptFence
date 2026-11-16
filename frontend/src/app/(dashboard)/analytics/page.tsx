'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  Crosshair,
  Fingerprint,
  GitCompareArrows,
  Layers,
  Radar,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { BarList, SegmentBar } from '@/components/charts/bar-list';
import { SERIES, TONE_HEX, formatChartDate } from '@/components/charts/chart-theme';
import { ColumnChart } from '@/components/charts/column-chart';
import { Meter, ScoreDial } from '@/components/charts/meter';
import { TrendChart } from '@/components/charts/trend-chart';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { ErrorState } from '@/components/shared/error-state';
import { DateRangeSelect, FilterSelect } from '@/components/shared/filter-bar';
import { Panel } from '@/components/shared/panel';
import { UnavailableNotice } from '@/components/shared/unavailable';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAnalyticsDistribution,
  useAnalyticsOverview,
  useAnalyticsTrends,
  useTargetComparisons,
  useTargetVersionComparisons,
} from '@/hooks/use-analytics';
import { useComparisons } from '@/hooks/use-regression';
import { useTargets } from '@/hooks/use-targets';
import { formatNumber, formatPercent } from '@/lib/format';
import {
  FINDING_STATUS_ORDER,
  SEVERITY_HEX,
  SEVERITY_ORDER,
  getAttributionMeta,
  getCategoryLabel,
  getFindingStatusMeta,
  getSeverityMeta,
  getTargetTypeLabel,
} from '@/lib/status';
import { cn } from '@/lib/utils';
import type {
  MetricRate,
  ScoreBreakdown,
  TargetComparisonItem,
  TargetVersionComparisonItem,
} from '@/types/analytics';
import { CategorySeverityBreakdown } from './_components/category-severity-breakdown';

function scoreTone(score: number) {
  return score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-critical';
}

/** Rate meter with numerator/denominator; zero denominator renders "Not measured". */
function RateMeter({
  label,
  rate,
  tone,
}: {
  label: string;
  rate: MetricRate | undefined;
  tone: 'critical' | 'high' | 'success' | 'neutral';
}) {
  const measured = !!rate && rate.denominator > 0;
  return (
    <Meter
      label={label}
      tone={tone}
      value={measured ? rate.percentage : null}
      valueLabel={
        measured ? (
          <>
            {formatPercent(rate.percentage)}{' '}
            <span className="text-subtle-foreground">
              ({formatNumber(rate.numerator)}/{formatNumber(rate.denominator)})
            </span>
          </>
        ) : undefined
      }
      hint={rate?.definition}
    />
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [targetId, setTargetId] = useState('');
  const scope = { days, target_id: targetId || undefined };

  const targets = useTargets(1, 100);
  const overview = useAnalyticsOverview(scope);
  const trends = useAnalyticsTrends(scope);
  const distribution = useAnalyticsDistribution(scope);
  const comparisons = useTargetComparisons();
  const versions = useTargetVersionComparisons(targetId);
  const regressions = useComparisons();

  const o = overview.data;
  const score = o?.security_score;
  const hasScore = !!score && score.total_eligible_cases > 0;
  const selectedTarget = targets.data?.items.find((t) => t.id === targetId);

  const refetchAll = () => {
    overview.refetch();
    trends.refetch();
    distribution.refetch();
    comparisons.refetch();
    regressions.refetch();
    if (targetId) versions.refetch();
  };
  const isFetching = overview.isFetching || trends.isFetching || distribution.isFetching;

  const severityItems = useMemo(() => {
    const map = new Map(distribution.data?.by_severity.map((s) => [s.severity, s]));
    return SEVERITY_ORDER.map((sev) => ({
      key: sev,
      label: getSeverityMeta(sev).label,
      value: map.get(sev)?.count ?? 0,
      secondary: formatPercent(map.get(sev)?.percentage ?? 0, 0),
      color: SEVERITY_HEX[sev],
      href: `/findings?severity=${sev}`,
    }));
  }, [distribution.data]);

  const statusItems = useMemo(() => {
    const map = new Map(distribution.data?.by_status.map((s) => [s.status, s.count]));
    return FINDING_STATUS_ORDER.map((st) => {
      const meta = getFindingStatusMeta(st);
      return { key: st, label: meta.label, value: map.get(st) ?? 0, color: TONE_HEX[meta.tone] };
    });
  }, [distribution.data]);

  const attributionItems = useMemo(
    () =>
      Object.entries(distribution.data?.by_attribution ?? {})
        .sort(([, a], [, b]) => b - a)
        .map(([level, count]) => ({
          key: level,
          label: (
            <span title={getAttributionMeta(level).description}>{getAttributionMeta(level).label}</span>
          ),
          value: count,
          color: SERIES[0],
        })),
    [distribution.data],
  );

  /** Regression trend derived from comparison records within the selected window/target. */
  const regressionTrend = useMemo(() => {
    const cutoff = Date.now() - days * 86_400_000;
    return (regressions.data ?? [])
      .filter((c) => new Date(c.created_at).getTime() >= cutoff && (!targetId || c.target_id === targetId))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({
        label: `${formatChartDate(c.created_at)} · ${c.id.slice(0, 4)}`,
        new_findings: c.comparison_metrics?.new_findings_count ?? 0,
        resolved_findings: c.comparison_metrics?.resolved_findings_count ?? 0,
      }));
  }, [regressions.data, days, targetId]);

  const breakdownColumns: DataTableColumn<ScoreBreakdown>[] = [
    {
      id: 'category',
      header: 'Category',
      sortValue: (b) => b.category,
      cell: (b) => <span className="font-medium">{getCategoryLabel(b.category)}</span>,
    },
    {
      id: 'weight',
      header: 'Weight',
      align: 'right',
      sortValue: (b) => b.weight_pct,
      cell: (b) => <span className="font-mono text-xs tabular-nums">{formatPercent(b.weight_pct, 0)}</span>,
    },
    {
      id: 'cases',
      header: 'Cases',
      align: 'right',
      hideBelow: 'sm',
      sortValue: (b) => b.cases_evaluated,
      cell: (b) => <span className="font-mono text-xs tabular-nums text-muted-foreground">{b.cases_evaluated}</span>,
    },
    {
      id: 'findings',
      header: 'Findings',
      align: 'right',
      sortValue: (b) => b.findings_count,
      cell: (b) => <span className="font-mono text-xs tabular-nums">{b.findings_count}</span>,
    },
    {
      id: 'deductions',
      header: 'Deduction',
      align: 'right',
      sortValue: (b) => b.deductions,
      cell: (b) => (
        <span className={cn('font-mono text-xs tabular-nums', b.deductions > 0 ? 'text-critical' : 'text-subtle-foreground')}>
          {b.deductions > 0 ? `−${b.deductions.toFixed(1)}` : '0.0'}
        </span>
      ),
    },
  ];

  const targetColumns: DataTableColumn<TargetComparisonItem>[] = [
    {
      id: 'name',
      header: 'Target',
      sortValue: (t) => t.target_name.toLowerCase(),
      cell: (t) => (
        <div className="min-w-0">
          <span className={cn('block truncate font-medium', t.target_id === targetId && 'text-primary')}>
            {t.target_name}
          </span>
          <span className="text-[11px] text-subtle-foreground">{getTargetTypeLabel(t.target_type)}</span>
        </div>
      ),
    },
    {
      id: 'score',
      header: 'Score',
      align: 'right',
      sortValue: (t) => (t.cases_evaluated > 0 ? t.security_score : null),
      cell: (t) =>
        t.cases_evaluated > 0 ? (
          <span className={cn('font-mono tabular-nums', scoreTone(t.security_score))}>{t.security_score.toFixed(1)}</span>
        ) : (
          <span className="text-xs italic text-subtle-foreground">Not measured</span>
        ),
    },
    {
      id: 'critical',
      header: 'Crit / High',
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
      hideBelow: 'md',
      sortValue: (t) => t.tool_violation_rate,
      cell: (t) => <span className="font-mono text-xs tabular-nums">{formatPercent(t.tool_violation_rate)}</span>,
    },
    {
      id: 'cases',
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
      hideBelow: 'sm',
      sortValue: (t) => (t.coverage_sufficient ? 1 : 0),
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

  const versionColumns: DataTableColumn<TargetVersionComparisonItem>[] = [
    {
      id: 'version',
      header: 'Version',
      sortValue: (v) => v.target_version,
      cell: (v) => <span className="font-mono text-xs">{v.target_version}</span>,
    },
    {
      id: 'score',
      header: 'Score',
      align: 'right',
      sortValue: (v) => v.security_score,
      cell: (v) =>
        v.cases_evaluated > 0 ? (
          <span className={cn('font-mono tabular-nums', scoreTone(v.security_score))}>{v.security_score.toFixed(1)}</span>
        ) : (
          <span className="text-xs italic text-subtle-foreground">Not measured</span>
        ),
    },
    {
      id: 'findings',
      header: 'Findings',
      align: 'right',
      sortValue: (v) => v.findings_count,
      cell: (v) => <span className="font-mono text-xs tabular-nums">{v.findings_count}</span>,
    },
    {
      id: 'canary',
      header: 'Canary exposures',
      align: 'right',
      sortValue: (v) => v.canary_exposures,
      cell: (v) => (
        <span className={cn('font-mono text-xs tabular-nums', v.canary_exposures ? 'text-critical' : 'text-muted-foreground')}>
          {v.canary_exposures}
        </span>
      ),
    },
    {
      id: 'tool',
      header: 'Tool violations',
      align: 'right',
      hideBelow: 'sm',
      sortValue: (v) => v.tool_violations,
      cell: (v) => (
        <span className={cn('font-mono text-xs tabular-nums', v.tool_violations ? 'text-high' : 'text-muted-foreground')}>
          {v.tool_violations}
        </span>
      ),
    },
    {
      id: 'runs',
      header: 'Runs · Cases',
      align: 'right',
      hideBelow: 'md',
      sortValue: (v) => v.cases_evaluated,
      cell: (v) => (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {v.runs_count} · {v.cases_evaluated}
        </span>
      ),
    },
  ];

  const trendPoints = trends.data?.points ?? [];
  const scopeLabel = `${selectedTarget ? selectedTarget.name : 'All targets'} · last ${days} days`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security analytics"
        description="Deterministic security scoring, attack outcome trends and target-by-target comparison. Every value is computed from recorded executions."
      >
        <FilterSelect
          label="Target"
          value={targetId}
          onChange={setTargetId}
          allLabel="All targets"
          options={(targets.data?.items ?? []).map((t) => ({ value: t.id, label: t.name }))}
        />
        <DateRangeSelect value={days} onChange={setDays} />
        <Button variant="outline" size="icon-sm" aria-label="Refresh analytics" title="Refresh" onClick={refetchAll}>
          <RotateCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </Button>
      </PageHeader>

      {overview.isError && <ErrorState error={overview.error} onRetry={() => overview.refetch()} compact />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title="Test runs"
          value={formatNumber(o?.total_test_runs)}
          subtitle={`${formatNumber(o?.total_cases_executed ?? 0)} cases executed`}
          icon={Activity}
          isLoading={overview.isLoading}
        />
        <StatsCard
          title="Findings"
          value={formatNumber(o?.total_findings)}
          subtitle={`${formatNumber(o?.critical_findings ?? 0)} critical · ${formatNumber(o?.high_findings ?? 0)} high`}
          icon={ShieldAlert}
          href={targetId ? undefined : '/findings'}
          isLoading={overview.isLoading}
        />
        <StatsCard
          title="Critical findings"
          value={formatNumber(o?.critical_findings)}
          subtitle={scopeLabel}
          icon={ShieldAlert}
          tone="critical"
          isLoading={overview.isLoading}
        />
        <StatsCard
          title="Canaries monitored"
          value={formatNumber(o?.active_canaries_monitored)}
          subtitle={`${formatNumber(o?.canary_exposure_rate.numerator ?? 0)} verified exposures`}
          icon={Fingerprint}
          href="/provenance"
          isLoading={overview.isLoading}
        />
      </div>

      {/* Score + breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Security score"
          description={score ? `Formula ${score.formula_version}` : 'Deterministic weighted score'}
          icon={ShieldCheck}
        >
          {overview.isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <ScoreDial score={hasScore ? score?.score : null} grade={score?.grade} size={124} />
                <dl className="min-w-0 space-y-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Coverage</dt>
                    <dd className="font-mono text-foreground">{formatPercent(score?.coverage_pct, 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Eligible cases</dt>
                    <dd className="font-mono text-foreground">{formatNumber(score?.total_eligible_cases)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Findings considered</dt>
                    <dd className="font-mono text-foreground">{formatNumber(score?.total_findings_considered)}</dd>
                  </div>
                </dl>
              </div>
              {!hasScore && (
                <p className="text-xs text-muted-foreground">
                  No eligible cases in this scope. Complete a test run to compute a score.
                </p>
              )}
              {!!score?.limitations.length && (
                <div className="rounded-md border border-border bg-surface/40 p-3">
                  <p className="eyebrow mb-1.5">Limitations</p>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
                    {score.limitations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Score breakdown"
          description="Severity-weighted deductions from a base of 100, by attack category"
          icon={BarChart3}
          flush
        >
          <DataTable
            label="Score breakdown by category"
            columns={breakdownColumns}
            data={score?.breakdown}
            getRowId={(b) => b.category}
            isLoading={overview.isLoading}
            initialSort={{ id: 'deductions', direction: 'desc' }}
            empty={
              <EmptyState
                bare
                compact
                icon={ShieldCheck}
                title="No deductions applied"
                description="No category recorded findings in this scope."
              />
            }
          />
        </Panel>
      </div>

      {/* Rates */}
      <Panel title="Security signal rates" description={scopeLabel} icon={Radar}>
        {overview.isLoading ? (
          <Skeleton className="h-[120px] w-full" />
        ) : (
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <RateMeter label="Canary exposure rate" rate={o?.canary_exposure_rate} tone="critical" />
            <RateMeter label="Tool boundary violation rate" rate={o?.tool_violation_rate} tone="high" />
            <RateMeter label="False-positive rate" rate={o?.false_positive_rate} tone="neutral" />
            <RateMeter label="Benign test pass rate" rate={o?.benign_pass_rate} tone="success" />
          </div>
        )}
      </Panel>

      {/* Trends — separate charts, one y-axis each */}
      {trends.isError && <ErrorState error={trends.error} onRetry={() => trends.refetch()} compact />}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Daily security score" description="100 minus severity deductions for findings observed each day">
          {trends.isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <TrendChart
              data={trendPoints}
              xKey="date"
              variant="area"
              yDomain={[0, 100]}
              series={[{ key: 'security_score', label: 'Security score', color: SERIES[0] }]}
              emptyMessage="No trend data in this period"
            />
          )}
        </Panel>
        <Panel title="Runs and findings" description="Daily counts">
          {trends.isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <TrendChart
              data={trendPoints}
              xKey="date"
              series={[
                { key: 'runs_count', label: 'Test runs', color: SERIES[0] },
                { key: 'findings_count', label: 'Findings', color: SERIES[1] },
              ]}
              emptyMessage="No executions in this period"
            />
          )}
        </Panel>
        <Panel
          title="Canary exposures & tool boundary violations"
          description="Daily count of findings attributed to a canary or a tool-execution category"
        >
          {trends.isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ColumnChart
              data={trendPoints}
              xKey="date"
              stacked={false}
              series={[
                { key: 'canary_exposures', label: 'Canary exposures', color: SERIES[4] },
                { key: 'tool_violations', label: 'Tool violations', color: SERIES[3] },
              ]}
              emptyMessage="No attack outcomes in this period"
            />
          )}
        </Panel>
        <Panel
          title="Regression trend"
          description="New vs resolved findings per regression comparison (derived from comparison records)"
          icon={GitCompareArrows}
          actions={
            <Link href="/regression" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Regression testing
            </Link>
          }
        >
          {regressions.isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : regressions.isError ? (
            <ErrorState compact error={regressions.error} onRetry={() => regressions.refetch()} />
          ) : (
            <ColumnChart
              data={regressionTrend}
              xKey="label"
              stacked={false}
              xFormatter={(v) => v}
              series={[
                { key: 'new_findings', label: 'New findings', color: TONE_HEX.critical },
                { key: 'resolved_findings', label: 'Resolved findings', color: TONE_HEX.success },
              ]}
              emptyMessage="No regression comparisons in this period"
              emptyHint="Run a regression against a baseline to populate this chart."
            />
          )}
        </Panel>
      </div>
      <UnavailableNotice
        title="Daily benign pass rate is not measured"
        description="The trends API does not compute a per-day benign pass rate, so no benign trend is charted. The aggregate benign test pass rate above is measured from benign control cases."
      />

      {/* Distributions */}
      {distribution.isError && <ErrorState error={distribution.error} onRetry={() => distribution.refetch()} compact />}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Attack category success"
          description="Findings per attack category, stacked by severity"
          icon={Layers}
        >
          {distribution.isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <CategorySeverityBreakdown items={distribution.data?.by_category ?? []} />
          )}
        </Panel>
        <Panel title="Findings by severity" description={scopeLabel}>
          {distribution.isLoading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : (
            <BarList items={severityItems} emptyMessage="No findings recorded" />
          )}
        </Panel>
        <Panel title="Triage status" description="Finding lifecycle distribution">
          {distribution.isLoading ? (
            <Skeleton className="h-[100px] w-full" />
          ) : (
            <SegmentBar items={statusItems} emptyMessage="No findings recorded" />
          )}
        </Panel>
        <Panel
          className="lg:col-span-2"
          title="Provenance attribution"
          description="Exact-token levels (confirmed, observed, trace-correlated) are HMAC-verified; inferred and unattributed are not"
          icon={Fingerprint}
        >
          {distribution.isLoading ? (
            <Skeleton className="h-[140px] w-full" />
          ) : (
            <BarList items={attributionItems} emptyMessage="No attributed findings" />
          )}
        </Panel>
      </div>

      {/* Target comparison */}
      <Panel
        title="Target comparison"
        description="All recorded executions per target · select a row to scope this page and view versions"
        icon={Crosshair}
        flush
      >
        <DataTable
          label="Target security comparison"
          columns={targetColumns}
          data={comparisons.data}
          getRowId={(t) => t.target_id}
          isLoading={comparisons.isLoading}
          error={comparisons.error}
          onRetry={() => comparisons.refetch()}
          initialSort={{ id: 'score', direction: 'asc' }}
          onRowClick={(t) => setTargetId(t.target_id === targetId ? '' : t.target_id)}
          rowClassName={(t) => (t.target_id === targetId ? 'bg-primary/5' : undefined)}
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

      {targetId && (
        <Panel
          title={`Version comparison · ${selectedTarget?.name ?? 'Selected target'}`}
          description="Score and attack outcomes per recorded target version"
          icon={GitCompareArrows}
          flush
          actions={
            <Link href={`/targets/${targetId}`} className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Open target
            </Link>
          }
        >
          <DataTable
            label="Target version comparison"
            columns={versionColumns}
            data={versions.data}
            getRowId={(v) => v.target_version}
            isLoading={versions.isLoading}
            error={versions.error}
            onRetry={() => versions.refetch()}
            initialSort={{ id: 'version', direction: 'desc' }}
            empty={
              <EmptyState
                bare
                compact
                icon={GitCompareArrows}
                title="No versions recorded"
                description="Version history appears after runs are recorded against this target."
              />
            }
          />
        </Panel>
      )}
    </div>
  );
}
