'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Activity,
  ArrowUpRight,
  BookOpenCheck,
  FileSearch,
  Fingerprint,
  History,
  Info,
  ListChecks,
  PencilLine,
  SearchX,
  ShieldAlert,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { CodeViewer, RequestResponseViewer } from '@/components/shared/code-viewer';
import { DetailList } from '@/components/shared/detail-list';
import { ErrorState } from '@/components/shared/error-state';
import { CopyButton, IdChip } from '@/components/shared/id-chip';
import { Panel } from '@/components/shared/panel';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { PageSkeleton } from '@/components/shared/skeletons';
import {
  AttributionBadge,
  CaseStatusBadge,
  FindingStatusBadge,
} from '@/components/shared/status-badges';
import { StatusPill } from '@/components/shared/status-pill';
import { Timeline } from '@/components/shared/timeline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/lib/api-client';
import { useFinding, useFindingHistory } from '@/hooks/use-findings';
import { useTestCaseDetail, useTestRun } from '@/hooks/use-test-runs';
import { formatDuration, formatTimestamp, humanize, shortId } from '@/lib/format';
import {
  ATTRIBUTION_META,
  getAttributionMeta,
  getCategoryLabel,
  getEvidenceKind,
  getFindingStatusMeta,
  type Tone,
} from '@/lib/status';
import { formatRelativeTime } from '@/lib/utils';
import type { AttributionLevel } from '@/types/finding';
import { getCategoryGuidance } from '../_components/finding-guidance';
import { EvidenceLegend } from '../../provenance/_components/canary-inspector';
import { TriageDialog } from '../_components/triage-dialog';

const EVIDENCE_TONE: Record<string, Tone> = { exact: 'info', inferred: 'warning', unverified: 'neutral' };
const ATTRIBUTION_ORDER: AttributionLevel[] = [
  'CONFIRMED_SOURCE_MATCH',
  'OBSERVED_CANARY',
  'TRACE_CORRELATED',
  'INFERRED',
  'UNATTRIBUTED',
];

export default function FindingDetailPage() {
  const params = useParams<{ findingId: string }>();
  const findingId = params?.findingId || '';
  const finding = useFinding(findingId);
  const history = useFindingHistory(findingId);
  const f = finding.data;
  const run = useTestRun(f?.test_run_id ?? '');
  const caseDetail = useTestCaseDetail(f?.test_run_id ?? '', f?.test_run_case_id ?? '');
  const [triageOpen, setTriageOpen] = useState(false);

  if (finding.isLoading) return <PageSkeleton />;

  if (finding.error || !f) {
    const notFound = finding.error instanceof ApiError && finding.error.status === 404;
    return (
      <div className="space-y-6">
        <PageHeader title="Finding" backHref="/findings" backLabel="Findings" />
        {notFound || !finding.error ? (
          <EmptyState
            icon={SearchX}
            title="Finding not found"
            description="This finding does not exist or you do not have permission to view it."
            actionText="Back to findings"
            actionHref="/findings"
          />
        ) : (
          <ErrorState error={finding.error} onRetry={() => finding.refetch()} />
        )}
      </div>
    );
  }

  const evidenceRef = f.evidence_reference;
  const provenance = evidenceRef?.provenance;
  const tokenPreview = provenance?.token_preview ?? null;
  const evidence = getEvidenceKind(f.attribution_level);
  const guidance = getCategoryGuidance(f.category);
  const caseData = caseDetail.data;
  const attackTemplate = caseData?.scenario_snapshot?.attack_input_template;
  const targetName = run.data?.target?.name ?? run.data?.execution_snapshot?.target?.name;

  const hmacLabel =
    evidence.hmacVerified === true
      ? 'Verified (implied by attribution level)'
      : evidence.hmacVerified === false
        ? 'Not verified'
        : evidence.kind === 'inferred'
          ? 'Not applicable — no exact token'
          : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/findings"
        backLabel="Findings"
        title={f.title}
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={f.severity} />
            <FindingStatusBadge status={f.status} />
            <CategoryBadge category={f.category} />
          </div>
        }
        meta={
          <>
            <HeaderMeta label="ID">
              <IdChip value={f.id} />
            </HeaderMeta>
            <HeaderMeta label="Detected">
              <span title={formatTimestamp(f.observed_at)}>{formatRelativeTime(f.observed_at || f.created_at)}</span>
            </HeaderMeta>
            {targetName && <HeaderMeta label="Target">{targetName}</HeaderMeta>}
          </>
        }
      >
        <Button asChild variant="outline" size="sm">
          <Link href={`/provenance?run=${f.test_run_id}${f.canary_id ? `&canary=${f.canary_id}` : ''}`}>
            <Fingerprint className="h-3.5 w-3.5" /> Trace provenance
          </Link>
        </Button>
        <Button size="sm" onClick={() => setTriageOpen(true)}>
          <PencilLine className="h-3.5 w-3.5" /> Triage
        </Button>
      </PageHeader>

      <TriageDialog findingId={f.id} currentStatus={f.status} open={triageOpen} onOpenChange={setTriageOpen} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">
                <Info /> Overview
              </TabsTrigger>
              <TabsTrigger value="evidence">
                <FileSearch /> Evidence
              </TabsTrigger>
              <TabsTrigger value="provenance">
                <Fingerprint /> Provenance
              </TabsTrigger>
              <TabsTrigger value="remediation">
                <BookOpenCheck /> Remediation
              </TabsTrigger>
              <TabsTrigger value="executions">
                <Activity /> Executions
              </TabsTrigger>
              <TabsTrigger value="history">
                <History /> History
                {!!history.data?.length && (
                  <span className="rounded bg-surface px-1 font-mono text-[10px] text-muted-foreground">
                    {history.data.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4">
              <Panel title="Description">
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                  {f.description || '—'}
                </p>
              </Panel>
              <Panel title="Detection">
                <DetailList
                  columns={3}
                  items={[
                    { label: 'Severity', value: <SeverityBadge severity={f.severity} /> },
                    { label: 'Category', value: getCategoryLabel(f.category) },
                    { label: 'Confidence', value: f.confidence ? humanize(f.confidence) : '—' },
                    { label: 'Observation location', value: f.observation_location, mono: true },
                    { label: 'Detection method', value: f.detection_method, mono: true },
                    {
                      label: 'Evidence class',
                      value: <StatusPill tone={EVIDENCE_TONE[evidence.kind]} label={evidence.label} variant="plain" />,
                    },
                    { label: 'Observed at', value: formatTimestamp(f.observed_at), mono: true },
                    { label: 'Recorded at', value: formatTimestamp(f.created_at), mono: true },
                  ]}
                />
              </Panel>
              <Panel title="Impact" description="Category guidance — not specific to this finding" icon={ShieldAlert}>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{guidance.impact}</p>
                <p className="mt-3 text-xs text-subtle-foreground">
                  Observed in <span className="font-mono text-muted-foreground">{f.observation_location}</span> via{' '}
                  <span className="font-mono text-muted-foreground">{f.detection_method}</span>, rated{' '}
                  {f.severity.toLowerCase()}.
                </p>
              </Panel>
            </TabsContent>

            {/* Evidence */}
            <TabsContent value="evidence" className="space-y-4">
              <Panel title="Assertion result" icon={ListChecks}>
                {evidenceRef?.assertion_type || evidenceRef?.assertion_id ? (
                  <DetailList
                    columns={2}
                    className="mb-4"
                    items={[
                      { label: 'Assertion type', value: evidenceRef?.assertion_type ?? '—', mono: true },
                      { label: 'Assertion ID', value: evidenceRef?.assertion_id ?? '—', mono: true },
                    ]}
                  />
                ) : null}
                {evidenceRef?.expected_value || evidenceRef?.actual_value ? (
                  <div className="grid gap-3 xl:grid-cols-2">
                    <CodeViewer title="Expected" value={evidenceRef?.expected_value ?? ''} language="text" maxHeight={240} />
                    <CodeViewer
                      title="Actual"
                      value={evidenceRef?.actual_value ?? ''}
                      language="text"
                      highlight={tokenPreview}
                      maxHeight={240}
                    />
                  </div>
                ) : (
                  <p className="text-xs italic text-subtle-foreground">No expected/actual values were recorded.</p>
                )}
              </Panel>

              <Panel
                title="Reproduction"
                description={f.test_run_case_id ? `Case ${shortId(f.test_run_case_id)}` : 'No case linked'}
                icon={FileSearch}
                actions={
                  f.test_run_case_id ? (
                    <Link
                      href={`/test-runs/${f.test_run_id}/cases/${f.test_run_case_id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Open case <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  ) : undefined
                }
              >
                {!f.test_run_case_id ? (
                  <p className="text-xs italic text-subtle-foreground">
                    This finding is not linked to a specific case, so request/response evidence is unavailable.
                  </p>
                ) : caseDetail.isLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : caseDetail.isError ? (
                  <ErrorState error={caseDetail.error} onRetry={() => caseDetail.refetch()} compact />
                ) : (
                  <div className="space-y-3">
                    {attackTemplate && (
                      <CodeViewer title="Attack input template" value={attackTemplate} language="text" maxHeight={200} />
                    )}
                    <RequestResponseViewer
                      requestTitle="Normalized request metadata"
                      responseTitle="Normalized response metadata"
                      request={caseData?.normalized_request_metadata}
                      response={caseData?.normalized_response_metadata}
                      highlight={tokenPreview}
                      responseMeta={
                        caseData ? (
                          <span className="font-mono text-[10px] text-subtle-foreground">
                            {formatDuration(caseData.duration_ms)}
                          </span>
                        ) : undefined
                      }
                      maxHeight={280}
                    />
                    <p className="text-[11px] text-subtle-foreground">
                      The engine persists normalized metadata (sizes, status, a response preview) rather than full raw
                      payloads.
                    </p>
                  </div>
                )}
              </Panel>

              <CodeViewer
                title="Full evidence reference (JSON)"
                value={evidenceRef ?? {}}
                emptyText="No evidence reference recorded"
                collapsible
                defaultCollapsed
                maxHeight={420}
              />
            </TabsContent>

            {/* Provenance */}
            <TabsContent value="provenance" className="space-y-4">
              <Panel
                title="Attribution"
                icon={Fingerprint}
                actions={
                  <Link
                    href={`/provenance?run=${f.test_run_id}${f.canary_id ? `&canary=${f.canary_id}` : ''}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Open inspector <ArrowUpRight className="h-3 w-3" />
                  </Link>
                }
              >
                <DetailList
                  columns={2}
                  items={[
                    { label: 'Attribution level', value: <AttributionBadge status={f.attribution_level} /> },
                    {
                      label: 'Evidence class',
                      value: <StatusPill tone={EVIDENCE_TONE[evidence.kind]} label={evidence.label} variant="plain" />,
                    },
                    { label: 'HMAC verification', value: hmacLabel },
                    {
                      label: 'Token preview',
                      value: tokenPreview ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="font-mono text-[12px]">{tokenPreview}</span>
                          <CopyButton value={tokenPreview} label="Copy token preview" />
                        </span>
                      ) : (
                        '—'
                      ),
                    },
                    { label: 'Source ID', value: provenance?.source_id ?? f.source_id ?? '—', mono: true },
                    { label: 'Source type', value: provenance?.source_type ?? '—', mono: true },
                    { label: 'Canary ID', value: f.canary_id ? <IdChip value={f.canary_id} /> : '—' },
                  ]}
                />
                {provenance?.explanation && (
                  <p className="mt-4 border-t border-border pt-3 text-[13px] leading-relaxed text-foreground/90">
                    {provenance.explanation}
                  </p>
                )}
                {!!provenance?.limitations?.length && (
                  <div className="mt-3">
                    <p className="eyebrow mb-1">Limitations</p>
                    <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                      {provenance.limitations.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!provenance && (
                  <p className="mt-4 text-xs italic text-subtle-foreground">
                    No provenance record is attached to this finding.
                  </p>
                )}
              </Panel>

              <div className="grid gap-4 md:grid-cols-2">
                <Panel title="Attribution hierarchy" description="Strongest to weakest">
                  <ol className="space-y-1.5">
                    {ATTRIBUTION_ORDER.map((lvl) => {
                      const active = lvl === f.attribution_level;
                      return (
                        <li
                          key={lvl}
                          className={
                            active
                              ? 'rounded-md border border-primary/40 bg-primary/[0.06] px-2.5 py-2'
                              : 'rounded-md border border-transparent px-2.5 py-2'
                          }
                          aria-current={active ? 'true' : undefined}
                        >
                          <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                            {getAttributionMeta(lvl).label}
                            {active && <span className="text-[10px] uppercase tracking-wide text-primary">This finding</span>}
                          </p>
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {ATTRIBUTION_META[lvl].description}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </Panel>
                <Panel title="Evidence classes">
                  <EvidenceLegend />
                </Panel>
              </div>
            </TabsContent>

            {/* Remediation */}
            <TabsContent value="remediation" className="space-y-4">
              <Panel
                title="Recommended remediation (guidance)"
                description={`General hardening for ${getCategoryLabel(f.category)} — validate against your architecture`}
                icon={BookOpenCheck}
              >
                <ol className="space-y-2.5">
                  {guidance.remediation.map((step, i) => (
                    <li key={step} className="flex gap-3 text-[13px] leading-relaxed text-foreground/90">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-surface font-mono text-[10px] text-muted-foreground">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  After mitigating, re-run the suite and compare against a regression baseline before marking this
                  finding resolved.{' '}
                  <Link href="/regression" className="text-primary hover:underline">
                    Regression testing
                  </Link>
                </p>
              </Panel>
            </TabsContent>

            {/* Related executions */}
            <TabsContent value="executions" className="space-y-4">
              <Panel title="Test run" icon={Activity}>
                {run.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : run.isError ? (
                  <ErrorState error={run.error} onRetry={() => run.refetch()} compact />
                ) : (
                  <DetailList
                    columns={2}
                    items={[
                      {
                        label: 'Run',
                        value: (
                          <Link href={`/test-runs/${f.test_run_id}`} className="font-mono text-primary hover:underline">
                            {f.test_run_id}
                          </Link>
                        ),
                      },
                      { label: 'Target', value: targetName ?? '—' },
                      {
                        label: 'Suite',
                        value: run.data?.test_suite?.name ?? run.data?.execution_snapshot?.test_suite?.name ?? '—',
                      },
                      { label: 'Started', value: formatTimestamp(run.data?.started_at), mono: true },
                    ]}
                  />
                )}
              </Panel>
              <Panel title="Case">
                {!f.test_run_case_id ? (
                  <p className="text-xs italic text-subtle-foreground">No case is linked to this finding.</p>
                ) : caseDetail.isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <DetailList
                    columns={2}
                    items={[
                      {
                        label: 'Case',
                        value: (
                          <Link
                            href={`/test-runs/${f.test_run_id}/cases/${f.test_run_case_id}`}
                            className="font-mono text-primary hover:underline"
                          >
                            {f.test_run_case_id}
                          </Link>
                        ),
                      },
                      { label: 'Scenario', value: caseData?.scenario_snapshot?.name ?? '—' },
                      { label: 'Result', value: caseData ? <CaseStatusBadge status={caseData.status} /> : '—' },
                      { label: 'Duration', value: formatDuration(caseData?.duration_ms), mono: true },
                    ]}
                  />
                )}
              </Panel>
            </TabsContent>

            {/* Status history */}
            <TabsContent value="history">
              <Panel title="Status history" description="Immutable triage audit trail" icon={History}>
                {history.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : history.isError ? (
                  <ErrorState error={history.error} onRetry={() => history.refetch()} compact />
                ) : !history.data?.length ? (
                  <p className="text-xs italic text-subtle-foreground">
                    No status changes yet. The finding has been {getFindingStatusMeta(f.status).label.toLowerCase()} since
                    detection.
                  </p>
                ) : (
                  <Timeline
                    timeFormatter={formatTimestamp}
                    items={history.data.map((h) => ({
                      id: h.id,
                      title: (
                        <span className="inline-flex flex-wrap items-center gap-1.5">
                          <FindingStatusBadge status={h.old_status} />
                          <span className="text-subtle-foreground">→</span>
                          <FindingStatusBadge status={h.new_status} />
                        </span>
                      ),
                      tone: getFindingStatusMeta(h.new_status).tone,
                      timestamp: h.created_at,
                      meta: h.changed_by ? (
                        <span className="font-mono text-[10px] text-subtle-foreground">by {shortId(h.changed_by)}</span>
                      ) : undefined,
                      description: (
                        <>
                          {h.rationale && (
                            <span className="mt-1 block rounded-md border border-border bg-surface/40 px-2.5 py-1.5 text-foreground/85">
                              {h.rationale}
                            </span>
                          )}
                          {h.review_date && (
                            <span className="mt-1 block text-subtle-foreground">
                              Review scheduled {formatTimestamp(h.review_date)}
                            </span>
                          )}
                        </>
                      ),
                    }))}
                  />
                )}
              </Panel>
            </TabsContent>
          </Tabs>
        </div>

        {/* Side rail */}
        <aside className="min-w-0 space-y-4">
          <Panel title="Identifiers">
            <DetailList
              columns={1}
              items={[
                { label: 'Finding ID', value: <IdChip value={f.id} full /> },
                { label: 'Fingerprint', value: f.fingerprint ? <IdChip value={f.fingerprint} length={20} /> : '—' },
                {
                  label: 'Deduplication key',
                  value: f.deduplication_key ? <IdChip value={f.deduplication_key} length={20} /> : '—',
                },
                { label: 'Test run', value: <IdChip value={f.test_run_id} /> },
                { label: 'Case', value: f.test_run_case_id ? <IdChip value={f.test_run_case_id} /> : '—' },
                { label: 'Canary', value: f.canary_id ? <IdChip value={f.canary_id} /> : '—' },
              ]}
            />
          </Panel>
          <Panel title="Triage">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Current status</span>
                <FindingStatusBadge status={f.status} />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Last change</span>
                <span className="text-foreground/85">
                  {/* History is returned newest-first. */}
                  {history.data?.length ? formatRelativeTime(history.data[0]?.created_at) : 'Never'}
                </span>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setTriageOpen(true)}>
                <PencilLine className="h-3.5 w-3.5" /> Change status
              </Button>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
