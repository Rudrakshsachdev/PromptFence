'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertOctagon,
  ArrowLeftRight,
  Clock,
  FileText,
  Fingerprint,
  GitBranch,
  ListChecks,
  ScrollText,
  ShieldAlert,
  Waypoints,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { CodeViewer, RequestResponseViewer } from '@/components/shared/code-viewer';
import { DetailList } from '@/components/shared/detail-list';
import { ErrorState } from '@/components/shared/error-state';
import { IdChip } from '@/components/shared/id-chip';
import { Panel } from '@/components/shared/panel';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { PageSkeleton } from '@/components/shared/skeletons';
import {
  AssertionStatusBadge,
  AttributionBadge,
  CanaryStatusBadge,
  CaseStatusBadge,
} from '@/components/shared/status-badges';
import { StatusPill } from '@/components/shared/status-pill';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCaseAssertions,
  useCaseEvents,
  useCaseTraces,
  useRunCanaries,
  useRunFindings,
  useTestCaseDetail,
} from '@/hooks/use-test-runs';
import { formatDuration, formatTimestamp, humanize } from '@/lib/format';
import { getCanaryStatusMeta, getEvidenceKind } from '@/lib/status';
import { testRunService } from '@/services/test-run.service';
import type { AssertionResult } from '@/types/test-run';
import { EventStream } from '../../../_components/event-stream';
import { tokenPrefix } from '../../../_components/event-meta';
import { RunFindingsTable } from '../../../_components/findings-table';
import { LogViewer } from '../../../_components/log-viewer';
import { ProvenanceFlow } from '../../../_components/provenance-flow';

const TABS = ['overview', 'payload', 'assertions', 'provenance', 'timeline', 'logs', 'findings'] as const;
type TabId = (typeof TABS)[number];

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
function asNumber(value: unknown): number | null {
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
}

function TestCaseDetailView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const runId = params.runId as string;
  const caseId = params.caseId as string;

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.includes(initialTab as TabId) ? (initialTab as TabId) : 'overview',
  );

  const { data: testCase, isLoading, error, refetch } = useTestCaseDetail(runId, caseId);
  const assertions = useCaseAssertions(runId, caseId);
  const traces = useCaseTraces(runId, caseId);
  const events = useCaseEvents(runId, caseId);
  const runCanaries = useRunCanaries(runId);
  const runFindings = useRunFindings(runId);
  const logs = useQuery({
    queryKey: ['test-case-logs', runId, caseId],
    queryFn: () => testRunService.getCaseLogs(runId, caseId),
    enabled: !!runId && !!caseId,
  });

  const caseCanaries = useMemo(
    () => (runCanaries.data ?? []).filter((c) => c.test_run_case_id === caseId),
    [runCanaries.data, caseId],
  );
  const canary = caseCanaries.find((c) => c.status === 'OBSERVED') ?? caseCanaries[0];
  const caseFindings = useMemo(
    () => (runFindings.data ?? []).filter((f) => f.test_run_case_id === caseId),
    [runFindings.data, caseId],
  );
  const canaryFinding = caseFindings.find((f) => f.canary_id && canary && f.canary_id === canary.id) ?? caseFindings.find((f) => f.canary_id);

  if (isLoading) return <PageSkeleton />;

  if (error || !testCase) {
    return (
      <div className="space-y-6">
        <PageHeader title="Scenario case" backHref={`/test-runs/${runId}`} backLabel={`Run ${runId.slice(0, 8)}`} />
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <EmptyState
            icon={FileText}
            title="Scenario case not found"
            description="This case does not exist in the selected run."
            actionText="Back to run"
            actionHref={`/test-runs/${runId}`}
          />
        )}
      </div>
    );
  }

  const scenario = testCase.scenario_snapshot ?? {};
  const reqMeta = testCase.normalized_request_metadata ?? null;
  const respMeta = testCase.normalized_response_metadata ?? null;
  const responsePreview = asString(respMeta?.response_preview);
  const statusCode = asNumber(respMeta?.status_code);
  const latency = asNumber(respMeta?.latency_ms);
  const prefix = tokenPrefix(canary?.token_preview);
  const prefixInResponse = !!(prefix && responsePreview?.includes(prefix));

  const passedAssertions = (assertions.data ?? []).filter((a) => a.status === 'PASSED').length;
  const failedAssertions = (assertions.data ?? []).filter((a) => a.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/test-runs/${runId}`}
        backLabel={`Run ${runId.slice(0, 8)}`}
        icon={ListChecks}
        title={scenario.name ?? 'Scenario case'}
        badge={<CaseStatusBadge status={testCase.status} />}
        description={scenario.description}
        meta={
          <>
            <HeaderMeta label="Step">
              <span className="font-mono">#{testCase.execution_order}</span>
            </HeaderMeta>
            <HeaderMeta label="Case">
              <IdChip value={testCase.id} />
            </HeaderMeta>
            <HeaderMeta label="Run">
              <Link href={`/test-runs/${runId}`} className="font-mono text-xs hover:text-primary">
                {runId.slice(0, 8)}
              </Link>
            </HeaderMeta>
            <HeaderMeta label="Executed">
              <span className="font-mono">{formatTimestamp(testCase.started_at ?? testCase.created_at)}</span>
            </HeaderMeta>
          </>
        }
      />

      {testCase.error_message && (
        <Alert variant={testCase.status === 'ERROR' ? 'warning' : 'destructive'}>
          <AlertOctagon />
          <AlertTitle>
            Execution error{testCase.error_code ? <span className="ml-2 font-mono text-xs">{testCase.error_code}</span> : null}
          </AlertTitle>
          <AlertDescription className="font-mono">{testCase.error_message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatsCard
          title="Assertions"
          value={assertions.data ? `${passedAssertions}/${assertions.data.length}` : '—'}
          subtitle={failedAssertions ? `${failedAssertions} failed` : 'passed'}
          icon={ListChecks}
          tone={failedAssertions ? 'critical' : undefined}
          isLoading={assertions.isLoading}
        />
        <StatsCard
          title="Findings"
          value={caseFindings.length}
          icon={ShieldAlert}
          tone="critical"
          isLoading={runFindings.isLoading}
        />
        <StatsCard
          title="Canary"
          value={canary ? getCanaryStatusMeta(canary.status).label : 'None'}
          subtitle={canary ? canary.token_preview : 'Not instrumented'}
          icon={Fingerprint}
          tone={canary?.status === 'OBSERVED' ? 'critical' : undefined}
          isLoading={runCanaries.isLoading}
        />
        <StatsCard
          title="Target response"
          value={statusCode !== null ? String(statusCode) : '—'}
          subtitle={latency !== null ? `${latency} ms adapter latency` : 'No response recorded'}
          icon={ArrowLeftRight}
          tone={statusCode !== null && statusCode >= 400 ? 'warning' : undefined}
        />
        <StatsCard title="Duration" value={formatDuration(testCase.duration_ms)} subtitle="Case wall-clock" icon={Clock} />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <TabsList>
          <TabsTrigger value="overview">
            <FileText /> Overview
          </TabsTrigger>
          <TabsTrigger value="payload">
            <ArrowLeftRight /> Request &amp; response
          </TabsTrigger>
          <TabsTrigger value="assertions">
            <ListChecks /> Assertions {assertions.data ? <Count n={assertions.data.length} /> : null}
          </TabsTrigger>
          <TabsTrigger value="provenance">
            <GitBranch /> Canary &amp; provenance
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Activity /> Timeline {events.data ? <Count n={events.data.length} /> : null}
          </TabsTrigger>
          <TabsTrigger value="logs">
            <ScrollText /> Logs {logs.data ? <Count n={logs.data.length} /> : null}
          </TabsTrigger>
          <TabsTrigger value="findings">
            <ShieldAlert /> Findings <Count n={caseFindings.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Scenario snapshot" description={`Version ${testCase.scenario_version} at execution time`}>
              <DetailList
                columns={1}
                items={[
                  { label: 'Category', value: scenario.category ? <CategoryBadge category={scenario.category} /> : '—' },
                  { label: 'Severity', value: scenario.severity ? <SeverityBadge severity={scenario.severity} /> : '—' },
                  {
                    label: 'Scenario',
                    value: testCase.scenario_id ? (
                      <Link href={`/scenarios/${testCase.scenario_id}`} className="font-mono text-xs hover:text-primary">
                        {testCase.scenario_id.slice(0, 8)} · open in library
                      </Link>
                    ) : (
                      'Deleted from library'
                    ),
                  },
                  { label: 'Expected behaviour', value: scenario.expected_behavior || '—' },
                  { label: 'Started', mono: true, value: formatTimestamp(testCase.started_at) },
                  { label: 'Completed', mono: true, value: formatTimestamp(testCase.completed_at) },
                ]}
              />
            </Panel>
            <div className="space-y-4 lg:col-span-2">
              <CodeViewer
                title="Attack input template"
                value={scenario.attack_input_template ?? ''}
                language="text"
                emptyText="No input template in snapshot"
                maxHeight={280}
              />
              {scenario.assertion_config && Object.keys(scenario.assertion_config).length > 0 && (
                <CodeViewer title="Assertion configuration" value={scenario.assertion_config} maxHeight={240} collapsible />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payload">
          <div className="space-y-3">
            <Alert variant="info">
              <ArrowLeftRight />
              <AlertTitle>Redacted evidence</AlertTitle>
              <AlertDescription>
                The engine stores normalized request metadata (not the full prompt, which may contain live canary tokens)
                and the first 200 characters of the target response.
                {prefix && responsePreview && (
                  <>
                    {' '}
                    {prefixInResponse ? (
                      <span className="text-critical">
                        The canary token prefix <span className="font-mono">{prefix}</span> is highlighted in the response.
                      </span>
                    ) : (
                      <span>
                        The canary token prefix <span className="font-mono">{prefix}</span> does not appear in the recorded
                        preview.
                      </span>
                    )}
                  </>
                )}
              </AlertDescription>
            </Alert>
            <RequestResponseViewer
              requestTitle="Request metadata"
              request={reqMeta}
              responseTitle="Response preview"
              response={responsePreview ?? ''}
              responseMeta={
                statusCode !== null ? (
                  <span className={`font-mono text-[11px] ${statusCode >= 400 ? 'text-warning' : 'text-success'}`}>
                    {statusCode}
                    {latency !== null ? <span className="text-subtle-foreground"> · {latency}ms</span> : null}
                  </span>
                ) : undefined
              }
              highlight={prefixInResponse ? prefix : null}
            />
            <CodeViewer title="Response metadata" value={respMeta} collapsible defaultCollapsed maxHeight={260} />
          </div>
        </TabsContent>

        <TabsContent value="assertions">
          <Panel flush title="Security assertions" description="Deterministic checks evaluated against the target response">
            {assertions.isLoading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : assertions.error ? (
              <div className="p-4">
                <ErrorState error={assertions.error} onRetry={() => assertions.refetch()} compact />
              </div>
            ) : !assertions.data?.length ? (
              <EmptyState bare compact icon={ListChecks} title="No assertions evaluated" description="Assertions are evaluated after the target responds." />
            ) : (
              <ul className="divide-y divide-border/70">
                {assertions.data.map((a) => (
                  <AssertionRow key={a.id} assertion={a} />
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="provenance">
          <div className="space-y-4">
            <Panel
              title="Taint propagation"
              description="Stages reconstructed from recorded engine events for this case"
              icon={Waypoints}
              actions={
                <Link href={`/provenance?run=${runId}`} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  Run-wide inspector
                </Link>
              }
            >
              {events.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : events.error ? (
                <ErrorState error={events.error} onRetry={() => events.refetch()} compact />
              ) : (
                <ProvenanceFlow events={events.data ?? []} canary={canary} />
              )}
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Canary detection" icon={Fingerprint}>
                {runCanaries.isLoading ? (
                  <Skeleton className="h-28 w-full" />
                ) : !canary ? (
                  <EmptyState
                    bare
                    compact
                    icon={Fingerprint}
                    title="No canary for this case"
                    description="Canary tainting was disabled for the run, or this scenario category is not instrumented."
                  />
                ) : (
                  <DetailList
                    columns={2}
                    items={[
                      { label: 'Token preview', mono: true, value: canary.token_preview },
                      { label: 'Exposure', value: <CanaryStatusBadge status={canary.status} /> },
                      { label: 'Source', mono: true, value: canary.source_id },
                      { label: 'Source type', value: humanize(canary.source_type) },
                      { label: 'HMAC key version', mono: true, value: canary.key_version },
                      {
                        label: 'Detection',
                        value:
                          canary.status === 'OBSERVED'
                            ? 'Exact token match in output'
                            : 'Not observed in recorded output',
                      },
                      { label: 'Generated', mono: true, value: formatTimestamp(canary.created_at) },
                      { label: 'Expires', mono: true, value: formatTimestamp(canary.expires_at) },
                      ...(caseCanaries.length > 1
                        ? [{ label: 'Tokens for this case', value: `${caseCanaries.length}`, wide: true }]
                        : []),
                    ]}
                  />
                )}
              </Panel>

              <Panel title="Attribution" icon={GitBranch}>
                {runFindings.isLoading ? (
                  <Skeleton className="h-28 w-full" />
                ) : !canaryFinding ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {canary?.status === 'OBSERVED'
                      ? 'The token was observed but no canary-linked finding is recorded for this case.'
                      : 'No canary exposure finding for this case. Nothing to attribute.'}
                  </p>
                ) : (
                  <AttributionDetail findingId={canaryFinding.id} level={canaryFinding.attribution_level} provenance={canaryFinding.evidence_reference?.provenance} />
                )}
              </Panel>
            </div>

            <Panel flush title="Target traces" description="Intermediate traces returned by the target adapter (tool and retrieval activity)">
              {traces.isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : traces.error ? (
                <div className="p-4">
                  <ErrorState error={traces.error} onRetry={() => traces.refetch()} compact />
                </div>
              ) : !traces.data?.length ? (
                <EmptyState bare compact icon={Waypoints} title="No traces returned" description="The adapter did not return intermediate traces for this case." />
              ) : (
                <ul className="space-y-3 p-4">
                  {traces.data.map((tr) => (
                    <li key={tr.id}>
                      <CodeViewer
                        title={humanize(tr.trace_type)}
                        meta={
                          <span className="font-mono text-[11px] text-subtle-foreground">
                            source {tr.source_id ?? 'unattributed'}
                          </span>
                        }
                        value={tr.evidence_reference ? { trace: tr.trace_metadata, evidence: tr.evidence_reference } : tr.trace_metadata}
                        maxHeight={240}
                        collapsible
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Panel title="Case event timeline">
            <EventStream
              runId={runId}
              events={events.data}
              isLoading={events.isLoading}
              error={events.error}
              onRetry={() => events.refetch()}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="logs">
          <Panel title="Execution logs">
            <LogViewer logs={logs.data} isLoading={logs.isLoading} error={logs.error} onRetry={() => logs.refetch()} />
          </Panel>
        </TabsContent>

        <TabsContent value="findings">
          <Panel flush title="Findings from this case">
            <RunFindingsTable
              findings={runFindings.data ? caseFindings : undefined}
              isLoading={runFindings.isLoading}
              error={runFindings.error}
              onRetry={() => runFindings.refetch()}
              emptyDescription="This scenario did not produce any findings."
            />
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssertionRow({ assertion: a }: { assertion: AssertionResult }) {
  const hasEvidence = !!a.evidence && Object.keys(a.evidence).length > 0;
  return (
    <li className="space-y-2.5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <AssertionStatusBadge status={a.status} />
          <span className="text-[13px] font-medium text-foreground">{humanize(a.assertion_type)}</span>
          <span className="truncate font-mono text-[11px] text-subtle-foreground">{a.assertion_id}</span>
        </div>
        <span className="font-mono text-[11px] text-subtle-foreground">{formatTimestamp(a.evaluated_at)}</span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <ValueBox label="Expected" value={a.expected_value} />
        <ValueBox label="Actual" value={a.actual_value} tone={a.status === 'FAILED' ? 'critical' : undefined} />
      </div>
      {hasEvidence && <CodeViewer title="Evidence" value={a.evidence} collapsible defaultCollapsed maxHeight={220} />}
    </li>
  );
}

function ValueBox({ label, value, tone }: { label: string; value: string | null; tone?: 'critical' }) {
  return (
    <div className={`min-w-0 rounded-md border bg-background/60 px-3 py-2 ${tone === 'critical' ? 'border-critical/30' : 'border-border'}`}>
      <p className="eyebrow mb-1">{label}</p>
      <p className="break-words font-mono text-[12px] text-foreground/90">
        {value ?? <span className="italic text-subtle-foreground">not recorded</span>}
      </p>
    </div>
  );
}

function AttributionDetail({
  findingId,
  level,
  provenance,
}: {
  findingId: string;
  level: string;
  provenance?: {
    attribution_level: string;
    token_preview: string;
    source_id?: string;
    source_type?: string;
    explanation: string;
    limitations: string[];
  };
}) {
  const ev = getEvidenceKind(level);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <AttributionBadge status={level} />
        <StatusPill
          tone={ev.kind === 'exact' ? 'info' : ev.kind === 'inferred' ? 'warning' : 'neutral'}
          label={ev.label}
          variant="plain"
        />
        <StatusPill
          tone={ev.hmacVerified ? 'success' : ev.hmacVerified === false ? 'warning' : 'neutral'}
          label={ev.hmacVerified ? 'HMAC verified' : ev.hmacVerified === false ? 'HMAC not verified' : 'HMAC n/a'}
          variant="plain"
        />
      </div>
      {provenance?.explanation && <p className="text-xs leading-relaxed text-muted-foreground">{provenance.explanation}</p>}
      {!!provenance?.limitations?.length && (
        <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-subtle-foreground">
          {provenance.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
      <Link href={`/findings/${findingId}`} className="inline-block text-xs font-medium text-primary hover:underline">
        Open finding {findingId.slice(0, 8)}
      </Link>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="rounded bg-surface px-1.5 py-px font-mono text-[10px] text-muted-foreground">{n}</span>;
}

export default function TestCaseDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TestCaseDetailView />
    </Suspense>
  );
}
