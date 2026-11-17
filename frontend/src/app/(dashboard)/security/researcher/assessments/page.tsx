'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, GitCompareArrows, Layers, Play, Radar } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { Panel } from '@/components/shared/panel';
import { RunStatusBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermissions } from '@/hooks/use-auth';
import { useComparisons } from '@/hooks/use-regression';
import { useTargets } from '@/hooks/use-targets';
import { useTestSuites } from '@/hooks/use-test-suites';
import { durationBetween, formatDuration, formatNumber, shortId } from '@/lib/format';
import { isRunTerminal, RUN_STATUS_META } from '@/lib/status';
import { cn, formatRelativeTime } from '@/lib/utils';
import { testRunService } from '@/services/test-run.service';
import type { TestRun, TestRunStatus } from '@/types/test-run';

const RUN_SAMPLE = { page: 1, page_size: 50 };
const OUTCOME_FILTERS: { key: 'ALL' | TestRunStatus; label: string }[] = [
  { key: 'ALL', label: 'All outcomes' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'FAILED', label: 'Failed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const targetName = (r: TestRun) => r.target?.name ?? r.execution_snapshot?.target?.name ?? 'Unknown target';
const suiteName = (r: TestRun) => r.test_suite?.name ?? r.execution_snapshot?.test_suite?.name ?? '—';

export default function SecurityAssessmentsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const targets = useTargets(1, 100);
  const suites = useTestSuites(1, 100);
  const comparisons = useComparisons();
  const [targetId, setTargetId] = useState('');
  const [suiteId, setSuiteId] = useState('');
  const [outcome, setOutcome] = useState<(typeof OUTCOME_FILTERS)[number]['key']>('ALL');

  // Same cache key as useTestRuns; polls only while an execution is still in progress.
  const runs = useQuery({
    queryKey: ['test-runs', RUN_SAMPLE],
    queryFn: () => testRunService.listTestRuns(RUN_SAMPLE),
    refetchInterval: (query) => (query.state.data?.items.some((r) => !isRunTerminal(r.status)) ? 5000 : false),
  });

  const activeTargets = useMemo(() => (targets.data?.items ?? []).filter((t) => t.is_active), [targets.data]);
  const activeSuites = useMemo(() => (suites.data?.items ?? []).filter((s) => s.is_active), [suites.data]);
  const active = useMemo(() => (runs.data?.items ?? []).filter((r) => !isRunTerminal(r.status)), [runs.data]);
  const outcomes = useMemo(
    () =>
      (runs.data?.items ?? []).filter(
        (r) => isRunTerminal(r.status) && (outcome === 'ALL' || r.status === outcome),
      ),
    [runs.data, outcome],
  );

  const launch = () => {
    const params = new URLSearchParams({ target: targetId, suite: suiteId });
    router.push(`/test-runs/new?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security assessments"
        description="Run attack suites against your targets, follow executions as they progress and review their outcomes."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/test-suites">
            <Layers className="h-3.5 w-3.5" /> Manage test suites
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/test-runs/new">
            <Play className="h-3.5 w-3.5" /> New assessment
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3 xl:items-start">
        {/* Start */}
        <Panel headingLevel="h2" title="Start an assessment" description="Pick a target and an attack suite" icon={Radar}>
          {targets.isLoading || suites.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : targets.isError || suites.isError ? (
            <ErrorState
              error={targets.error ?? suites.error}
              onRetry={() => {
                targets.refetch();
                suites.refetch();
              }}
              compact
            />
          ) : !activeTargets.length || !activeSuites.length ? (
            <EmptyState
              bare
              compact
              icon={Radar}
              title={!activeTargets.length ? 'No active targets' : 'No active test suites'}
              description={
                !activeTargets.length
                  ? 'Register or enable a target to assess.'
                  : 'Assemble attack scenarios into a suite to run them.'
              }
              actionText={
                !activeTargets.length
                  ? can(PERMISSIONS.targetsWrite) ? 'Register target' : undefined
                  : can(PERMISSIONS.testSuitesWrite) ? 'Create suite' : undefined
              }
              actionHref={
                !activeTargets.length
                  ? can(PERMISSIONS.targetsWrite) ? '/targets/new' : undefined
                  : can(PERMISSIONS.testSuitesWrite) ? '/test-suites/new' : undefined
              }
            />
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (targetId && suiteId) launch();
              }}
            >
              <NativeSelect
                id="assessment-target"
                label="Target"
                value={targetId}
                onChange={setTargetId}
                placeholder="Select a target"
                options={activeTargets.map((t) => ({ value: t.id, label: t.name }))}
              />
              <NativeSelect
                id="assessment-suite"
                label="Attack suite"
                value={suiteId}
                onChange={setSuiteId}
                placeholder="Select a test suite"
                options={activeSuites.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.scenario_count} scenario${s.scenario_count === 1 ? '' : 's'})`,
                }))}
              />
              <p className="text-[11px] leading-relaxed text-subtle-foreground">
                Concurrency, timeouts and canary tainting are set on the next step, using the standard execution engine.
              </p>
              <Button type="submit" size="sm" className="w-full" disabled={!targetId || !suiteId}>
                Configure &amp; launch <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>
          )}
        </Panel>

        {/* Monitor */}
        <Panel
          headingLevel="h2"
          className="xl:col-span-2"
          title="Active assessments"
          description={active.length ? 'Refreshing every 5 seconds while executions are in progress' : 'Queued and running executions'}
          icon={Activity}
          flush
        >
          {runs.isLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : runs.isError ? (
            <div className="p-5">
              <ErrorState error={runs.error} onRetry={() => runs.refetch()} compact />
            </div>
          ) : !active.length ? (
            <EmptyState bare compact icon={Activity} title="No assessments in progress" description="Executions you launch appear here until they finish." />
          ) : (
            <ul className="divide-y divide-border">
              {active.map((r) => {
                const pct = r.total_cases ? Math.round((r.completed_cases / r.total_cases) * 100) : 0;
                return (
                  <li key={r.id}>
                    <Link href={`/test-runs/${r.id}`} className="block px-5 py-3.5 outline-none transition-colors hover:bg-surface/60 focus-visible:bg-surface">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground">{targetName(r)}</p>
                          <p className="truncate text-[11px] text-subtle-foreground">
                            {suiteName(r)} · started {formatRelativeTime(r.started_at ?? r.created_at)}
                          </p>
                        </div>
                        <RunStatusBadge status={r.status} />
                      </div>
                      <div
                        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pct}
                        aria-label={`${targetName(r)} progress`}
                      >
                        <div className="h-full rounded-full bg-info transition-[width]" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 font-mono text-[11px] tabular-nums text-subtle-foreground">
                        {r.completed_cases}/{r.total_cases} cases · {r.failed_cases} failed so far
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Review */}
      <Panel
        headingLevel="h2"
        title="Assessment outcomes"
        description={`Finished executions from the most recent ${formatNumber(RUN_SAMPLE.page_size)}`}
        flush
        actions={
          <Link href="/test-runs" className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-surface hover:text-foreground">
            All executions <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        }
      >
        <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-3" role="group" aria-label="Filter outcomes">
          {OUTCOME_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={outcome === f.key}
              onClick={() => setOutcome(f.key)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                outcome === f.key
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {runs.isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : runs.isError ? (
          <div className="p-5">
            <ErrorState error={runs.error} onRetry={() => runs.refetch()} compact />
          </div>
        ) : !outcomes.length ? (
          <EmptyState
            bare
            compact
            icon={Radar}
            title={outcome === 'ALL' ? 'No finished assessments yet' : `No ${RUN_STATUS_META[outcome].label.toLowerCase()} assessments`}
            description="Outcomes appear once an execution completes, fails or is cancelled."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <caption className="sr-only">Finished security assessments</caption>
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">
                  <th scope="col" className="px-5 py-2.5 font-medium">Target</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">Suite</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Outcome</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Passed / failed</th>
                  <th scope="col" className="hidden px-3 py-2.5 text-right font-medium lg:table-cell">Duration</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Finished</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {outcomes.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-surface/60">
                    <td className="max-w-0 px-5 py-3">
                      <Link href={`/test-runs/${r.id}`} className="block truncate font-medium text-foreground hover:underline">
                        {targetName(r)}
                      </Link>
                      <span className="font-mono text-[11px] text-subtle-foreground">{shortId(r.id)}</span>
                    </td>
                    <td className="hidden max-w-0 truncate px-3 py-3 text-muted-foreground md:table-cell">{suiteName(r)}</td>
                    <td className="px-3 py-3">
                      <RunStatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs tabular-nums">
                      <span className="text-success">{r.passed_cases}</span>
                      <span className="text-subtle-foreground"> / </span>
                      <span className={r.failed_cases ? 'text-critical' : 'text-muted-foreground'}>{r.failed_cases}</span>
                      <span className="text-subtle-foreground"> of {r.total_cases}</span>
                    </td>
                    <td className="hidden px-3 py-3 text-right font-mono text-xs text-muted-foreground lg:table-cell">
                      {formatDuration(durationBetween(r.started_at, r.completed_at, false))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-xs text-muted-foreground">
                      {formatRelativeTime(r.completed_at ?? r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Compare */}
      <Panel
        headingLevel="h2"
        title="Compare outcomes"
        description="Recorded comparisons of an execution against a saved baseline"
        icon={GitCompareArrows}
        flush
        actions={
          <Link href="/regression" className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-surface hover:text-foreground">
            Regression testing <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        }
      >
        {comparisons.isLoading ? (
          <div className="p-5">
            <Skeleton className="h-16 w-full" />
          </div>
        ) : comparisons.isError ? (
          <div className="p-5">
            <ErrorState error={comparisons.error} onRetry={() => comparisons.refetch()} compact />
          </div>
        ) : !comparisons.data?.length ? (
          <EmptyState
            bare
            compact
            icon={GitCompareArrows}
            title="No comparisons recorded"
            description="Save a completed execution as a baseline, then compare later executions to find new and recurring vulnerabilities."
            actionText="Open regression testing"
            actionHref="/regression"
          />
        ) : (
          <ul className="divide-y divide-border">
            {comparisons.data.slice(0, 5).map((c) => {
              const m = c.comparison_metrics;
              return (
                <li key={c.id}>
                  <Link href={`/regression/${c.id}`} className="flex flex-col gap-1 px-5 py-3 outline-none transition-colors hover:bg-surface/60 focus-visible:bg-surface sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-foreground">Against {c.baseline_name}</span>
                      <span className="block text-[11px] text-subtle-foreground">{formatRelativeTime(c.created_at)}</span>
                    </span>
                    <span className="flex shrink-0 gap-3 font-mono text-xs tabular-nums">
                      <span className={m?.new_findings_count ? 'text-critical' : 'text-muted-foreground'}>{m?.new_findings_count ?? 0} new</span>
                      <span className={m?.recurring_findings_count ? 'text-warning' : 'text-muted-foreground'}>{m?.recurring_findings_count ?? 0} recurring</span>
                      <span className={m?.resolved_findings_count ? 'text-success' : 'text-muted-foreground'}>{m?.resolved_findings_count ?? 0} resolved</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function NativeSelect({
  id,
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-[13px] text-foreground shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
