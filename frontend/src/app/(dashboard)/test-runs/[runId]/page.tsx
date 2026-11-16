'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Fingerprint,
  Layers,
  ListChecks,
  RotateCw,
  ScrollText,
  ShieldAlert,
  StopCircle,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import { BarList, SegmentBar } from '@/components/charts/bar-list';
import { TONE_HEX } from '@/components/charts/chart-theme';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { DetailList } from '@/components/shared/detail-list';
import { ErrorState } from '@/components/shared/error-state';
import { IdChip } from '@/components/shared/id-chip';
import { Panel } from '@/components/shared/panel';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { PageSkeleton } from '@/components/shared/skeletons';
import { CanaryStatusBadge, CaseStatusBadge, RunStatusBadge } from '@/components/shared/status-badges';
import { UnavailableNotice } from '@/components/shared/unavailable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCancelTestRun,
  useRunCanaries,
  useRunFindings,
  useTestRun,
  useTestRunCases,
  useTestRunProgress,
} from '@/hooks/use-test-runs';
import { durationBetween, formatDuration, formatNumber, formatTimestamp } from '@/lib/format';
import {
  getSeverityMeta,
  getTargetTypeLabel,
  isRunTerminal,
  SEVERITY_HEX,
  SEVERITY_ORDER,
} from '@/lib/status';
import { testRunService } from '@/services/test-run.service';
import type { TestRunCase } from '@/types/test-run';
import { CanaryTable } from '../_components/canary-table';
import { EventStream } from '../_components/event-stream';
import { RunFindingsTable } from '../_components/findings-table';

export default function TestRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;

  const { data: run, isLoading, error, refetch, isFetching } = useTestRun(runId);
  const isTerminal = isRunTerminal(run?.status);
  const { data: progress } = useTestRunProgress(runId, isTerminal);
  const cases = useTestRunCases(runId);
  const findings = useRunFindings(runId);
  const canaries = useRunCanaries(runId);
  const events = useQuery({
    queryKey: ['test-run-events', runId],
    queryFn: () => testRunService.getRunEvents(runId),
    enabled: !!runId,
    refetchInterval: isTerminal ? false : 3000,
  });
  const cancelMutation = useCancelTestRun(runId);

  const [activeTab, setActiveTab] = useState('summary');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [, setTick] = useState(0);

  const currentStatus = progress?.status ?? run?.status;
  const progressTerminal = isRunTerminal(currentStatus);

  // When progress polling reports a terminal state, refresh the run and its artefacts once.
  useEffect(() => {
    if (run && progressTerminal && !isRunTerminal(run.status)) {
      refetch();
      cases.refetch();
      findings.refetch();
      canaries.refetch();
      events.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressTerminal, run?.status]);

  // While active: refresh case list periodically and tick live duration.
  useEffect(() => {
    if (progressTerminal || !run) return;
    const id = window.setInterval(() => {
      cases.refetch();
      setTick((t) => t + 1);
    }, 3000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressTerminal, run?.id]);

  const findingsByCase = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of findings.data ?? []) {
      if (f.test_run_case_id) m.set(f.test_run_case_id, (m.get(f.test_run_case_id) ?? 0) + 1);
    }
    return m;
  }, [findings.data]);

  const canaryByCase = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of canaries.data ?? []) {
      if (c.test_run_case_id) {
        // An observed token takes precedence over any other token for the same case.
        if (c.status === 'OBSERVED' || !m.has(c.test_run_case_id)) m.set(c.test_run_case_id, c.status);
      }
    }
    return m;
  }, [canaries.data]);

  if (isLoading) return <PageSkeleton />;

  if (error || !run) {
    return (
      <div className="space-y-6">
        <PageHeader title="Test run" backHref="/test-runs" backLabel="Test Runs" />
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <EmptyState
            icon={Activity}
            title="Test run not found"
            description="This execution does not exist or you do not have access to it."
            actionText="Back to test runs"
            actionHref="/test-runs"
          />
        )}
      </div>
    );
  }

  const target = run.target ?? run.execution_snapshot?.target ?? null;
  const suite = run.test_suite ?? run.execution_snapshot?.test_suite ?? null;
  const parameters = run.execution_snapshot?.parameters;

  const total = progress?.total_cases ?? run.total_cases;
  const completed = progress?.completed_cases ?? run.completed_cases;
  const passed = progress?.passed_cases ?? run.passed_cases;
  const failed = progress?.failed_cases ?? run.failed_cases;
  const errored = progress?.error_cases ?? run.error_cases;
  const pct = progress?.percent_complete ?? (total ? (completed / total) * 100 : 0);
  const isActive = !progressTerminal;
  const startedAt = progress?.started_at ?? run.started_at;
  const completedAt = progress?.completed_at ?? run.completed_at;
  const duration = durationBetween(startedAt, completedAt, isActive);

  const observedCanaries = (canaries.data ?? []).filter((c) => c.status === 'OBSERVED').length;
  const canaryTotal = canaries.data?.length ?? 0;

  const severityItems = SEVERITY_ORDER.map((sev) => ({
    key: sev,
    label: getSeverityMeta(sev).label,
    value: (findings.data ?? []).filter((f) => f.severity === sev).length,
    color: SEVERITY_HEX[sev],
  })).filter((i) => i.value > 0);

  const caseColumns: DataTableColumn<TestRunCase>[] = [
    {
      id: 'order',
      header: '#',
      sortValue: (c) => c.execution_order,
      cell: (c) => <span className="font-mono text-xs text-subtle-foreground">{c.execution_order}</span>,
    },
    {
      id: 'scenario',
      header: 'Scenario',
      sortValue: (c) => c.scenario_snapshot?.name ?? '',
      cell: (c) => (
        <div className="min-w-0 max-w-md">
          <Link
            href={`/test-runs/${runId}/cases/${c.id}`}
            onClick={(e) => e.stopPropagation()}
            className="line-clamp-1 font-medium text-foreground hover:text-primary"
          >
            {c.scenario_snapshot?.name ?? 'Unnamed scenario'}
          </Link>
          {c.error_message ? (
            <span className="line-clamp-1 font-mono text-[11px] text-warning" title={c.error_message}>
              {c.error_code ? `${c.error_code}: ` : ''}
              {c.error_message}
            </span>
          ) : (
            <span className="font-mono text-[11px] text-subtle-foreground">{c.id.slice(0, 8)}</span>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      hideBelow: 'lg',
      cell: (c) => (c.scenario_snapshot?.category ? <CategoryBadge category={c.scenario_snapshot.category} /> : '—'),
    },
    {
      id: 'severity',
      header: 'Severity',
      hideBelow: 'md',
      cell: (c) => (c.scenario_snapshot?.severity ? <SeverityBadge severity={c.scenario_snapshot.severity} compact /> : '—'),
    },
    { id: 'status', header: 'Result', sortValue: (c) => c.status, cell: (c) => <CaseStatusBadge status={c.status} /> },
    {
      id: 'canary',
      header: 'Canary',
      hideBelow: 'lg',
      cell: (c) => {
        const s = canaryByCase.get(c.id);
        return s ? <CanaryStatusBadge status={s} variant="plain" /> : <span className="text-subtle-foreground">—</span>;
      },
    },
    {
      id: 'findings',
      header: 'Findings',
      align: 'right',
      sortValue: (c) => findingsByCase.get(c.id) ?? 0,
      cell: (c) => {
        const n = findingsByCase.get(c.id) ?? 0;
        return <span className={`font-mono tabular-nums ${n ? 'text-critical' : 'text-subtle-foreground'}`}>{n}</span>;
      },
    },
    {
      id: 'duration',
      header: 'Duration',
      align: 'right',
      hideBelow: 'sm',
      sortValue: (c) => c.duration_ms ?? -1,
      cell: (c) => <span className="font-mono text-xs text-muted-foreground">{formatDuration(c.duration_ms)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/test-runs"
        backLabel="Test Runs"
        icon={Activity}
        title={target?.name ?? 'Test run'}
        badge={<RunStatusBadge status={currentStatus} />}
        meta={
          <>
            <HeaderMeta label="Run">
              <IdChip value={run.id} length={13} />
            </HeaderMeta>
            <HeaderMeta label="Suite">
              {suite ? (
                <Link href={`/test-suites/${suite.id}`} className="hover:text-primary">
                  {suite.name}
                </Link>
              ) : (
                '—'
              )}
            </HeaderMeta>
            <HeaderMeta label="Started">
              <span className="font-mono">{formatTimestamp(startedAt ?? run.created_at)}</span>
            </HeaderMeta>
          </>
        }
      >
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
        {canaryTotal > 0 && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/provenance?run=${run.id}`}>
              <Fingerprint className="h-3.5 w-3.5" /> Inspect provenance
            </Link>
          </Button>
        )}
        {isActive && (
          <Button variant="destructive" size="sm" onClick={() => setConfirmCancel(true)} disabled={cancelMutation.isPending}>
            <StopCircle className="h-3.5 w-3.5" /> Cancel run
          </Button>
        )}
      </PageHeader>

      {isActive && (
        <Panel>
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <span className="h-1.5 w-1.5 shrink-0 animate-status-pulse rounded-full bg-info" />
                <span className="truncate">{progress?.latest_event ?? 'Waiting for the execution engine…'}</span>
              </span>
              <span className="font-mono tabular-nums text-foreground">
                {Math.min(100, Math.round(pct))}% · {completed}/{total} scenarios
              </span>
            </div>
            <Progress value={pct} indicatorClassName="bg-info" />
          </div>
        </Panel>
      )}

      {run.error_message && (
        <Alert variant="destructive">
          <AlertOctagon />
          <AlertTitle>Execution error</AlertTitle>
          <AlertDescription className="font-mono">{run.error_message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatsCard title="Scenarios" value={formatNumber(total)} subtitle={`${completed} completed`} icon={Layers} />
        <StatsCard title="Passed" value={formatNumber(passed)} icon={CheckCircle2} tone="success" />
        <StatsCard title="Failed" value={formatNumber(failed)} subtitle="Assertion violated" icon={XCircle} tone="critical" />
        <StatsCard title="Errors" value={formatNumber(errored)} subtitle="Adapter / runtime" icon={TriangleAlert} tone="warning" />
        <StatsCard
          title="Findings"
          value={formatNumber(findings.data?.length)}
          icon={ShieldAlert}
          tone="critical"
          isLoading={findings.isLoading}
        />
        <StatsCard
          title="Canaries exposed"
          value={canaryTotal ? `${observedCanaries}/${canaryTotal}` : '0'}
          subtitle={canaryTotal ? 'Exact token observed' : 'None generated'}
          icon={Fingerprint}
          tone={observedCanaries ? 'critical' : undefined}
          isLoading={canaries.isLoading}
        />
        <StatsCard
          title="Duration"
          value={formatDuration(duration)}
          subtitle={isActive ? 'Running' : completedAt ? 'Wall-clock' : 'Not started'}
          icon={Clock}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">
            <ListChecks /> Summary
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Activity /> Timeline {events.data ? <Count n={events.data.length} /> : null}
          </TabsTrigger>
          <TabsTrigger value="cases">
            <Layers /> Scenarios {cases.data ? <Count n={cases.data.length} /> : null}
          </TabsTrigger>
          <TabsTrigger value="canaries">
            <Fingerprint /> Canaries {canaries.data ? <Count n={canaries.data.length} /> : null}
          </TabsTrigger>
          <TabsTrigger value="findings">
            <ShieldAlert /> Findings {findings.data ? <Count n={findings.data.length} /> : null}
          </TabsTrigger>
          <TabsTrigger value="logs">
            <ScrollText /> Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Execution configuration" className="lg:col-span-2">
              <DetailList
                columns={2}
                items={[
                  {
                    label: 'Target',
                    value: target ? (
                      <Link href={`/targets/${target.id}`} className="hover:text-primary">
                        {target.name}
                      </Link>
                    ) : (
                      '—'
                    ),
                  },
                  { label: 'Target type', value: target ? getTargetTypeLabel(target.target_type) : '—' },
                  { label: 'Endpoint', mono: true, wide: true, value: target ? `${target.base_url}${target.endpoint}` : '—' },
                  {
                    label: 'Test suite',
                    value: suite ? (
                      <Link href={`/test-suites/${suite.id}`} className="hover:text-primary">
                        {suite.name}
                      </Link>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: 'Canary tainting',
                    value: parameters ? (parameters.canary_tainting_enabled ? 'Enabled' : 'Disabled') : '—',
                  },
                  { label: 'Concurrency', mono: true, value: parameters?.concurrency ?? '—' },
                  { label: 'Scenario timeout', mono: true, value: parameters ? `${parameters.timeout_seconds}s` : '—' },
                  { label: 'Created', mono: true, value: formatTimestamp(run.created_at) },
                  { label: 'Started', mono: true, value: formatTimestamp(startedAt) },
                  { label: 'Completed', mono: true, value: formatTimestamp(completedAt) },
                  { label: 'Cancelled', value: run.is_cancelled ? 'Yes' : 'No' },
                ]}
              />
            </Panel>
            <div className="space-y-4">
              <Panel title="Scenario outcomes">
                <SegmentBar
                  emptyMessage="No scenarios scheduled"
                  items={[
                    { key: 'passed', label: 'Passed', value: passed, color: TONE_HEX.success },
                    { key: 'failed', label: 'Failed', value: failed, color: TONE_HEX.critical },
                    { key: 'error', label: 'Error', value: errored, color: TONE_HEX.warning },
                    {
                      key: 'pending',
                      label: isActive ? 'Pending' : 'Not executed',
                      value: Math.max(0, total - passed - failed - errored),
                      color: TONE_HEX.neutral,
                    },
                  ]}
                />
              </Panel>
              <Panel title="Findings by severity">
                {findings.isLoading ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : (
                  <BarList items={severityItems} emptyMessage="No findings for this run" />
                )}
              </Panel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Panel title="Execution timeline" description="Engine events in order of occurrence, with millisecond timestamps">
            <EventStream
              runId={runId}
              events={events.data}
              isLoading={events.isLoading}
              error={events.error}
              onRetry={() => events.refetch()}
              showCaseLinks
            />
          </Panel>
        </TabsContent>

        <TabsContent value="cases">
          <Panel flush title="Scenario results" description="Select a scenario to inspect request, response, assertions and provenance">
            <DataTable
              label="Scenario results"
              columns={caseColumns}
              data={cases.data}
              getRowId={(c) => c.id}
              isLoading={cases.isLoading}
              error={cases.error}
              onRetry={() => cases.refetch()}
              initialSort={{ id: 'order', direction: 'asc' }}
              onRowClick={(c) => router.push(`/test-runs/${runId}/cases/${c.id}`)}
              empty={
                <EmptyState
                  bare
                  compact
                  icon={Layers}
                  title="No scenarios scheduled"
                  description={isActive ? 'Scenarios appear as soon as the engine schedules them.' : 'This run did not schedule any scenarios.'}
                />
              }
            />
          </Panel>
        </TabsContent>

        <TabsContent value="canaries">
          <div className="space-y-3">
            <Alert variant="info">
              <Fingerprint />
              <AlertTitle>Generated is not leaked</AlertTitle>
              <AlertDescription>
                Every instrumented scenario receives a canary. Only tokens marked <strong>Exposed</strong> were observed
                verbatim in target output. Active or expired tokens were never observed.
              </AlertDescription>
            </Alert>
            <Panel
              flush
              title="Canary tokens"
              description={`${observedCanaries} of ${canaryTotal} exposed`}
              actions={
                canaryTotal > 0 ? (
                  <Button asChild variant="outline" size="xs">
                    <Link href={`/provenance?run=${runId}`}>Open in provenance inspector</Link>
                  </Button>
                ) : undefined
              }
            >
              <CanaryTable
                runId={runId}
                canaries={canaries.data}
                isLoading={canaries.isLoading}
                error={canaries.error}
                onRetry={() => canaries.refetch()}
              />
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="findings">
          <Panel flush title="Findings generated by this run">
            <RunFindingsTable
              findings={findings.data}
              isLoading={findings.isLoading}
              error={findings.error}
              onRetry={() => findings.refetch()}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="logs">
          <div className="space-y-3">
            <UnavailableNotice
              title="Execution logs are recorded per scenario"
              description="The API does not expose a run-level log stream. Open a scenario below to read its logs; run-level engine events are on the Timeline tab."
            />
            <Panel flush title="Scenario logs">
              {cases.isLoading ? (
                <p className="p-4 text-xs text-muted-foreground">Loading scenarios…</p>
              ) : !cases.data?.length ? (
                <p className="p-4 text-xs text-muted-foreground">No scenarios scheduled.</p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {[...cases.data]
                    .sort((a, b) => a.execution_order - b.execution_order)
                    .map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/test-runs/${runId}/cases/${c.id}?tab=logs`}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface/60"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="font-mono text-xs text-subtle-foreground">{c.execution_order}</span>
                            <span className="truncate text-[13px] text-foreground">
                              {c.scenario_snapshot?.name ?? 'Unnamed scenario'}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-3">
                            <CaseStatusBadge status={c.status} variant="plain" />
                            <span className="text-xs text-primary">View logs</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this test run?"
        description="Scenarios that have not started will be skipped. Results and evidence already collected are kept."
        confirmText="Cancel run"
        cancelText="Keep running"
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={() =>
          cancelMutation.mutate(undefined, {
            onSettled: () => setConfirmCancel(false),
          })
        }
      />
    </div>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="rounded bg-surface px-1.5 py-px font-mono text-[10px] text-muted-foreground">{n}</span>
  );
}
