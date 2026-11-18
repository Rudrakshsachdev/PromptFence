'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Crosshair,
  FileText,
  GitCompareArrows,
  Play,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Siren,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import { BarList, SegmentBar } from '@/components/charts/bar-list';
import { SERIES, TONE_HEX } from '@/components/charts/chart-theme';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { ErrorState } from '@/components/shared/error-state';
import { Panel } from '@/components/shared/panel';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { FindingStatusBadge, RunStatusBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyticsTrends } from '@/hooks/use-analytics';
import { useFindings } from '@/hooks/use-findings';
import { useComparisons } from '@/hooks/use-regression';
import { useSecurityOverview } from '@/hooks/use-security';
import { useTestRuns } from '@/hooks/use-test-runs';
import { formatNumber, shortId } from '@/lib/format';
import {
  FINDING_STATUS_META,
  FINDING_STATUS_ORDER,
  getCategoryLabel,
  getEvidenceKind,
  getFindingStatusMeta,
  getSeverityMeta,
  SEVERITY_HEX,
  SEVERITY_ORDER,
} from '@/lib/status';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { TrendPoint } from '@/types/analytics';
import type { FindingSeverity, FindingStatus } from '@/types/finding';
import type { TestRun } from '@/types/test-run';

// Recharts is the heaviest dependency on this page; load it after first paint.
const TrendChart = dynamic(() => import('@/components/charts/trend-chart').then((m) => m.TrendChart<TrendPoint>), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full" />,
});

const TREND_DAYS = 30;
// Stable fallback so memoised lists do not recompute on every render while loading.
const NO_COUNTS: Record<string, number> = {};

type ActivityKind = 'run' | 'finding' | 'triage' | 'regression';
interface ActivityItem {
  id: string;
  kind: ActivityKind;
  at: string;
  title: React.ReactNode;
  detail?: React.ReactNode;
  href: string;
  icon: React.ElementType;
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'critical';
}

const ACTIVITY_TONE = {
  neutral: 'border-border bg-surface text-muted-foreground',
  info: 'border-info/20 bg-info/10 text-info',
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/20 bg-warning/10 text-warning',
  critical: 'border-critical/20 bg-critical/10 text-critical',
} as const;

function runActivity(run: TestRun): ActivityItem {
  const target = run.target?.name ?? run.execution_snapshot?.target?.name ?? 'Unknown target';
  const suite = run.test_suite?.name ?? run.execution_snapshot?.test_suite?.name;
  const base = { id: `run-${run.id}`, kind: 'run' as const, href: `/test-runs/${run.id}` };
  const detail = suite ? `${suite} · ${run.passed_cases}/${run.total_cases} passed` : undefined;
  switch (run.status) {
    case 'COMPLETED':
      return { ...base, at: run.completed_at ?? run.created_at, icon: CheckCircle2, tone: run.failed_cases ? 'warning' : 'success',
        title: <>Assessment completed on <span className="font-medium">{target}</span></>, detail };
    case 'FAILED':
      return { ...base, at: run.completed_at ?? run.created_at, icon: XCircle, tone: 'critical',
        title: <>Assessment failed on <span className="font-medium">{target}</span></>, detail: run.error_message ?? detail };
    case 'CANCELLED':
      return { ...base, at: run.completed_at ?? run.created_at, icon: XCircle, tone: 'neutral',
        title: <>Assessment cancelled on <span className="font-medium">{target}</span></>, detail };
    case 'RUNNING':
      return { ...base, at: run.started_at ?? run.created_at, icon: Activity, tone: 'info',
        title: <>Assessment running on <span className="font-medium">{target}</span></>,
        detail: `${run.completed_cases}/${run.total_cases} cases executed` };
    default:
      return { ...base, at: run.created_at, icon: Play, tone: 'neutral',
        title: <>Assessment queued for <span className="font-medium">{target}</span></>, detail };
  }
}

export default function SecurityOverviewPage() {
  const overview = useSecurityOverview();
  const critical = useFindings({ severity: 'CRITICAL', status: 'OPEN', page: 1, page_size: 5, sort: 'newest' });
  const newestFindings = useFindings({ page: 1, page_size: 8, sort: 'newest' });
  const recentRuns = useTestRuns({ page: 1, page_size: 8 });
  const comparisons = useComparisons();
  const trends = useAnalyticsTrends({ days: TREND_DAYS });

  const o = overview.data;
  const runs = o?.runs.by_status ?? NO_COUNTS;
  const findingsByStatus = o?.findings.by_status ?? NO_COUNTS;
  const openBySeverity = o?.findings.open_by_severity ?? NO_COUNTS;
  const active = (runs.RUNNING ?? 0) + (runs.QUEUED ?? 0) + (runs.PENDING ?? 0);
  const latestRun = recentRuns.data?.items[0];

  const severityItems = useMemo(
    () =>
      SEVERITY_ORDER.map((sev) => ({
        key: sev,
        label: getSeverityMeta(sev).label,
        value: openBySeverity[sev] ?? 0,
        secondary: `${formatNumber(o?.findings.by_severity[sev] ?? 0)} total`,
        color: SEVERITY_HEX[sev],
        href: `/findings?severity=${sev}&status=OPEN`,
      })),
    [o, openBySeverity],
  );

  const statusItems = useMemo(
    () =>
      FINDING_STATUS_ORDER.map((s) => ({
        key: s,
        label: FINDING_STATUS_META[s].label,
        value: findingsByStatus[s] ?? 0,
        color: TONE_HEX[FINDING_STATUS_META[s].tone],
      })),
    [findingsByStatus],
  );

  const categoryItems = useMemo(
    () =>
      (o?.categories ?? []).map((c) => ({
        key: c.category,
        label: getCategoryLabel(c.category),
        value: c.open_findings,
        secondary: `${formatNumber(c.findings)} total`,
        color: SERIES[0],
        href: `/findings?category=${c.category}&status=OPEN`,
      })),
    [o],
  );

  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    for (const run of recentRuns.data?.items ?? []) items.push(runActivity(run));
    for (const f of newestFindings.data?.items ?? []) {
      const sev = getSeverityMeta(f.severity);
      items.push({
        id: `finding-${f.id}`,
        kind: 'finding',
        at: f.observed_at,
        href: `/findings/${f.id}`,
        icon: ShieldAlert,
        tone: f.severity === 'CRITICAL' || f.severity === 'HIGH' ? 'critical' : 'warning',
        title: <>New {sev.label.toLowerCase()} finding: <span className="font-medium">{f.title}</span></>,
        detail: `${getCategoryLabel(f.category)} · ${getEvidenceKind(f.attribution_level).label}`,
      });
    }
    for (const c of o?.recent_status_changes ?? []) {
      items.push({
        id: `triage-${c.finding_id}-${c.changed_at}`,
        kind: 'triage',
        at: c.changed_at,
        href: `/findings/${c.finding_id}`,
        icon: ShieldCheck,
        tone: c.new_status === 'RESOLVED' ? 'success' : 'neutral',
        title: <>Finding marked <span className="font-medium">{getFindingStatusMeta(c.new_status).label.toLowerCase()}</span></>,
        detail: `${c.finding_title} · was ${getFindingStatusMeta(c.old_status).label.toLowerCase()}`,
      });
    }
    for (const r of comparisons.data ?? []) {
      const m = r.comparison_metrics;
      items.push({
        id: `regression-${r.id}`,
        kind: 'regression',
        at: r.created_at,
        href: `/regression/${r.id}`,
        icon: GitCompareArrows,
        tone: (m?.new_findings_count ?? 0) > 0 ? 'warning' : 'neutral',
        title: <>Regression run against <span className="font-medium">{r.baseline_name}</span></>,
        detail: `${m?.new_findings_count ?? 0} new · ${m?.recurring_findings_count ?? 0} recurring · ${m?.resolved_findings_count ?? 0} resolved`,
      });
    }
    return items.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')).slice(0, 12);
  }, [recentRuns.data, newestFindings.data, o, comparisons.data]);

  const activityLoading = recentRuns.isLoading || newestFindings.isLoading || overview.isLoading;
  const recurring = useMemo(
    () => (comparisons.data ?? []).reduce((n, r) => n + (r.comparison_metrics?.recurring_findings_count ?? 0), 0),
    [comparisons.data],
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title="Security overview"
        description="Open risk, attack evidence and assessment activity across the targets you test."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/findings?severity=CRITICAL&status=OPEN">
            <Siren className="h-3.5 w-3.5" /> Review critical findings
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/security/researcher/assessments">
            <Radar className="h-3.5 w-3.5" /> Start security assessment
          </Link>
        </Button>
      </PageHeader>

      {overview.isError && <ErrorState error={overview.error} onRetry={() => overview.refetch()} compact />}

      {/* A. Posture summary */}
      <section aria-labelledby="posture" className="space-y-4">
        <h2 id="posture" className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
          Security posture
        </h2>
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Assessed targets"
            value={formatNumber(o?.runs.assessed_targets)}
            subtitle="With at least one execution"
            icon={Crosshair}
            href="/targets"
            isLoading={overview.isLoading}
          />
          <StatsCard
            title="Security test executions"
            value={formatNumber(o?.runs.total)}
            subtitle={`${formatNumber(runs.COMPLETED ?? 0)} completed`}
            icon={Activity}
            href="/test-runs"
            isLoading={overview.isLoading}
          />
          <StatsCard
            title="Active assessments"
            value={formatNumber(active)}
            subtitle={`${formatNumber(runs.RUNNING ?? 0)} running · ${formatNumber((runs.QUEUED ?? 0) + (runs.PENDING ?? 0))} queued`}
            icon={Radar}
            tone="info"
            href="/security/researcher/assessments"
            isLoading={overview.isLoading}
          />
          <StatsCard
            title="Failed assessments"
            value={formatNumber(runs.FAILED)}
            subtitle={`${formatNumber(runs.CANCELLED ?? 0)} cancelled`}
            icon={XCircle}
            tone="warning"
            href="/test-runs?status=FAILED"
            isLoading={overview.isLoading}
          />
          <StatsCard
            title="Open critical findings"
            value={formatNumber(openBySeverity.CRITICAL)}
            subtitle={`${formatNumber(o?.findings.by_severity.CRITICAL ?? 0)} recorded in total`}
            icon={Siren}
            tone="critical"
            href="/findings?severity=CRITICAL&status=OPEN"
            isLoading={overview.isLoading}
          />
          <StatsCard
            title="Open high-severity findings"
            value={formatNumber(openBySeverity.HIGH)}
            subtitle={`${formatNumber(o?.findings.by_severity.HIGH ?? 0)} recorded in total`}
            icon={TriangleAlert}
            tone="high"
            href="/findings?severity=HIGH&status=OPEN"
            isLoading={overview.isLoading}
          />
          <StatsCard
            title="Open findings"
            value={formatNumber(findingsByStatus.OPEN)}
            subtitle={`${formatNumber(findingsByStatus.ACKNOWLEDGED ?? 0)} acknowledged`}
            icon={ShieldAlert}
            href="/findings?status=OPEN"
            isLoading={overview.isLoading}
          />
          <StatsCard
            title="Resolved findings"
            value={formatNumber(findingsByStatus.RESOLVED)}
            subtitle={`${formatNumber(findingsByStatus.FALSE_POSITIVE ?? 0)} false positive · ${formatNumber(findingsByStatus.ACCEPTED_RISK ?? 0)} accepted risk`}
            icon={ShieldCheck}
            href="/findings?status=RESOLVED"
            isLoading={overview.isLoading}
          />
        </div>
      </section>

      {/* D + E. What needs attention now */}
      <section aria-labelledby="attention" className="space-y-4">
        <h2 id="attention" className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
          Requires attention
        </h2>
        <div className="grid gap-4 xl:grid-cols-3 xl:items-start">
          <Panel
            headingLevel="h3"
            className="xl:col-span-2"
            title="Open critical findings"
            description="Newest first · investigate the evidence before triaging"
            icon={Siren}
            flush
            actions={<PanelLink href="/findings?severity=CRITICAL&status=OPEN">View all</PanelLink>}
          >
            {critical.isLoading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : critical.isError ? (
              <div className="p-5">
                <ErrorState error={critical.error} onRetry={() => critical.refetch()} compact />
              </div>
            ) : !critical.data?.items.length ? (
              <EmptyState
                bare
                compact
                icon={ShieldCheck}
                title="No open critical findings"
                description="No critical vulnerability is currently awaiting triage. This reflects the scenarios executed so far, not a guarantee that targets are secure."
              />
            ) : (
              <ul className="divide-y divide-border">
                {critical.data.items.map((f) => (
                  <li key={f.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={f.severity as FindingSeverity} compact />
                        <FindingStatusBadge status={f.status as FindingStatus} />
                        <CategoryBadge category={f.category} />
                      </div>
                      <p className="line-clamp-2 text-[13px] font-medium text-foreground">{f.title}</p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-subtle-foreground">
                        <Link href={`/test-runs/${f.test_run_id}`} className="font-mono hover:text-foreground">
                          Execution {shortId(f.test_run_id)}
                        </Link>
                        <span>{getEvidenceKind(f.attribution_level).label}</span>
                        <span>Discovered {formatRelativeTime(f.observed_at)}</span>
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                      <Link href={`/findings/${f.id}`}>
                        Investigate <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel headingLevel="h3" title="Quick actions" description="Common security operations">
            <ul className="space-y-1.5">
              <QuickAction href="/security/researcher/assessments" icon={Radar} title="Start security assessment" description="Choose a target and suite, then launch" />
              <QuickAction href="/test-runs/new" icon={Play} title="Run an existing test suite" description="Configure and launch an execution" />
              <QuickAction href="/findings?severity=CRITICAL&status=OPEN" icon={Siren} title="Review critical findings" description="Open critical vulnerabilities" />
              <QuickAction
                href={latestRun ? `/test-runs/${latestRun.id}` : '/test-runs'}
                icon={Activity}
                title="Investigate recent execution"
                description={latestRun ? `Latest: ${latestRun.target?.name ?? shortId(latestRun.id)}` : 'Execution history'}
              />
              <QuickAction href="/reports" icon={FileText} title="View security reports" description="Evidence reports and exports" />
            </ul>
          </Panel>
        </div>
      </section>

      {/* B. Risk overview */}
      <section aria-labelledby="risk" className="space-y-4">
        <h2 id="risk" className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
          Risk overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:items-start">
          <Panel headingLevel="h3" title="Open findings by severity" description="Bars show open findings · total recorded on the right">
            {overview.isLoading ? <Skeleton className="h-[180px] w-full" /> : <BarList items={severityItems} emptyMessage="No findings recorded" />}
          </Panel>
          <Panel headingLevel="h3" title="Finding status" description="Open versus triaged across all recorded findings">
            {overview.isLoading ? (
              <Skeleton className="h-[120px] w-full" />
            ) : (
              <SegmentBar items={statusItems} emptyMessage="No findings recorded" />
            )}
          </Panel>
          <Panel headingLevel="h3" title="Vulnerability categories" description="Open findings per category · total on the right" className="md:col-span-2 xl:col-span-1">
            {overview.isLoading ? <Skeleton className="h-[180px] w-full" /> : <BarList items={categoryItems} emptyMessage="No findings recorded" />}
          </Panel>

          <Panel
            headingLevel="h3"
            className="md:col-span-2"
            title="Targets with the most findings"
            description="Ranked by open, then total findings. Targets without recorded findings are not listed; that is not evidence they are secure."
            icon={Crosshair}
            flush
          >
            {overview.isLoading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : !o?.top_targets.length ? (
              <EmptyState bare compact icon={Crosshair} title="No findings recorded yet" description="Targets appear here once an assessment records a finding against them." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <caption className="sr-only">Targets ranked by open findings</caption>
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">
                      <th scope="col" className="px-5 py-2.5 font-medium">Target</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Open</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Critical</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">High</th>
                      <th scope="col" className="px-5 py-2.5 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {o.top_targets.map((t) => (
                      <tr key={t.target_id} className="transition-colors hover:bg-surface/60">
                        <td className="max-w-0 px-5 py-3">
                          <Link href={`/findings?target=${t.target_id}`} className="block truncate font-medium text-foreground hover:underline">
                            {t.target_name}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">{t.open_findings}</td>
                        <td className={cn('px-3 py-3 text-right font-mono tabular-nums', t.critical ? 'text-critical' : 'text-muted-foreground')}>{t.critical}</td>
                        <td className={cn('px-3 py-3 text-right font-mono tabular-nums', t.high ? 'text-high' : 'text-muted-foreground')}>{t.high}</td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-muted-foreground">{t.findings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            headingLevel="h3"
            title="Regression signal"
            description="From recorded baseline comparisons"
            icon={GitCompareArrows}
            actions={<PanelLink href="/regression">Regression</PanelLink>}
          >
            {comparisons.isLoading ? (
              <Skeleton className="h-[120px] w-full" />
            ) : comparisons.isError ? (
              <ErrorState error={comparisons.error} onRetry={() => comparisons.refetch()} compact />
            ) : !comparisons.data?.length ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No baseline comparisons yet. Create a baseline to detect recurring vulnerabilities.</p>
            ) : (
              <dl className="grid grid-cols-3 gap-3 text-center">
                <RegressionStat label="Comparisons" value={comparisons.data.length} />
                <RegressionStat
                  label="New findings"
                  value={comparisons.data.reduce((n, r) => n + (r.comparison_metrics?.new_findings_count ?? 0), 0)}
                  emphasis
                />
                <RegressionStat label="Recurring" value={recurring} emphasis={recurring > 0} />
              </dl>
            )}
          </Panel>
        </div>

        <Panel
          headingLevel="h3"
          title="Findings and executions over time"
          description={`Daily counts · last ${TREND_DAYS} days`}
          icon={BarChart3}
          actions={<PanelLink href="/analytics">Analytics</PanelLink>}
        >
          {trends.isLoading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : trends.isError ? (
            <ErrorState error={trends.error} onRetry={() => trends.refetch()} compact />
          ) : (
            <TrendChart
              data={trends.data?.points ?? []}
              xKey="date"
              height={240}
              series={[
                { key: 'findings_count', label: 'Findings', color: SERIES[1] },
                { key: 'runs_count', label: 'Executions', color: SERIES[0] },
              ]}
              emptyMessage="No executions in this period"
            />
          )}
        </Panel>
      </section>

      {/* C. Recent security activity */}
      <section aria-labelledby="activity" className="space-y-4">
        <h2 id="activity" className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
          Recent security activity
        </h2>
        <Panel headingLevel="h3" title="Activity" description="Executions, new findings, triage decisions and regression results" flush>
          {activityLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !activity.length ? (
            <EmptyState bare compact icon={Activity} title="No security activity yet" description="Launch an assessment to start building history." actionText="Start security assessment" actionHref="/security/researcher/assessments" />
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((a) => {
                const Icon = a.icon;
                return (
                  <li key={a.id}>
                    <Link href={a.href} className="flex items-start gap-3 px-5 py-3 outline-none transition-colors hover:bg-surface/60 focus-visible:bg-surface">
                      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border', ACTIVITY_TONE[a.tone])}>
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-foreground">{a.title}</span>
                        {a.detail && <span className="block truncate text-[11px] text-subtle-foreground">{a.detail}</span>}
                      </span>
                      <span className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] text-subtle-foreground">{formatRelativeTime(a.at)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {recentRuns.isError && (
            <div className="border-t border-border p-4">
              <ErrorState error={recentRuns.error} onRetry={() => recentRuns.refetch()} compact />
            </div>
          )}
        </Panel>
        {latestRun && (
          <p className="text-[11px] text-subtle-foreground">
            Latest execution <RunStatusBadge status={latestRun.status} /> {shortId(latestRun.id)}
          </p>
        )}
      </section>
    </div>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {children}
      <ArrowRight className="h-3 w-3" aria-hidden />
    </Link>
  );
}

function QuickAction({ href, icon: Icon, title, description }: { href: string; icon: React.ElementType; title: string; description: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 outline-none transition-colors hover:border-border hover:bg-surface/60 focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-foreground">{title}</span>
          <span className="block truncate text-[11px] text-subtle-foreground">{description}</span>
        </span>
      </Link>
    </li>
  );
}

function RegressionStat({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 px-2 py-3">
      <dt className="text-[11px] text-subtle-foreground">{label}</dt>
      <dd className={cn('mt-1 font-mono text-lg font-semibold tabular-nums', emphasis && value > 0 ? 'text-warning' : 'text-foreground')}>
        {formatNumber(value)}
      </dd>
    </div>
  );
}
