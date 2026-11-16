'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CircleDashed,
  Fingerprint,
  ScanText,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-react';
import { CodeViewer } from '@/components/shared/code-viewer';
import { DetailList } from '@/components/shared/detail-list';
import { CopyButton, IdChip } from '@/components/shared/id-chip';
import { Panel } from '@/components/shared/panel';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { AttributionBadge, CanaryStatusBadge, FindingStatusBadge } from '@/components/shared/status-badges';
import { StatusPill } from '@/components/shared/status-pill';
import { Timeline, type TimelineItem } from '@/components/shared/timeline';
import { Skeleton } from '@/components/ui/skeleton';
import { useCaseTraces } from '@/hooks/use-test-runs';
import { formatTimestamp, humanize, shortId, errorMessage } from '@/lib/format';
import { getCategoryLabel, getEvidenceKind, type Tone } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { TaintFinding } from '@/types/finding';
import type { DynamicCanary, ExecutionEvent, EventType, TargetTrace } from '@/types/test-run';
import {
  ProvenanceFlow,
  STAGE_STATE_LABEL,
  type FlowStage,
  type StageKey,
} from './provenance-flow';

const meta = (e: ExecutionEvent, key: string): unknown => e.event_metadata?.[key];
const metaStr = (e: ExecutionEvent, key: string): string | null => {
  const v = meta(e, key);
  return v === null || v === undefined ? null : String(v);
};

const byTime = (a: { created_at: string }, b: { created_at: string }) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

/** Findings attributable to this canary: same canary record, or same token preview. */
export function findingsForCanary(canary: DynamicCanary, findings: TaintFinding[]): TaintFinding[] {
  return findings.filter(
    (f) =>
      f.canary_id === canary.id ||
      (!!canary.test_run_case_id &&
        f.test_run_case_id === canary.test_run_case_id &&
        f.evidence_reference?.provenance?.token_preview === canary.token_preview),
  );
}

/** Events that belong to this canary's case, in order. */
export function eventsForCanary(canary: DynamicCanary, events: ExecutionEvent[]): ExecutionEvent[] {
  return events
    .filter((e) =>
      canary.test_run_case_id
        ? e.test_run_case_id === canary.test_run_case_id
        : metaStr(e, 'canary_id') === canary.id,
    )
    .sort(byTime);
}

function ofType(events: ExecutionEvent[], ...types: EventType[]) {
  return events.filter((e) => types.includes(e.event_type));
}

/** Builds the six provenance stages strictly from persisted records. */
export function buildStages(
  canary: DynamicCanary,
  caseEvents: ExecutionEvent[],
  traces: TargetTrace[],
  linkedFindings: TaintFinding[],
): FlowStage[] {
  const generated = ofType(caseEvents, 'CANARY_GENERATED').filter(
    (e) => !metaStr(e, 'canary_id') || metaStr(e, 'canary_id') === canary.id,
  );
  const instrumented = ofType(caseEvents, 'SOURCE_INSTRUMENTED').filter(
    (e) => !metaStr(e, 'source_id') || metaStr(e, 'source_id') === canary.source_id,
  );
  const requests = ofType(caseEvents, 'ADAPTER_REQUEST_SENT');
  const toolCalls = ofType(caseEvents, 'TOOL_CALL_ATTEMPTED');
  const responses = ofType(caseEvents, 'ADAPTER_RESPONSE_RECEIVED');
  const observed = ofType(caseEvents, 'CANARY_OBSERVED');
  const linkedIds = new Set(linkedFindings.map((f) => f.id));
  const findingEvents = ofType(caseEvents, 'FINDING_CREATED').filter((e) => {
    const id = metaStr(e, 'finding_id');
    return id ? linkedIds.has(id) : false;
  });

  const response = responses[0];
  const responseSummary = response
    ? [
        metaStr(response, 'status_code') && `HTTP ${metaStr(response, 'status_code')}`,
        metaStr(response, 'latency_ms') && `${metaStr(response, 'latency_ms')}ms`,
      ]
        .filter(Boolean)
        .join(' · ') || null
    : null;

  const isExposed = observed.length > 0 || canary.status === 'OBSERVED';
  const detectionEvents = [...observed, ...findingEvents].sort(byTime);

  return [
    {
      key: 'source',
      title: 'Source input',
      state: 'recorded',
      events: generated,
      summary: `${canary.source_type}:${canary.source_id}`,
      note: 'Canary record bound to its source. The token is session-scoped to this run and signed with the HMAC key version shown.',
      timestamp: generated[0]?.created_at ?? canary.created_at,
    },
    {
      key: 'injection',
      title: 'Canary injection',
      state: instrumented.length ? 'recorded' : 'missing',
      events: instrumented,
      summary: instrumented.length ? `source ${metaStr(instrumented[0], 'source_id') ?? canary.source_id}` : null,
      note: instrumented.length
        ? 'Synthetic source instrumented with the canary token before dispatch.'
        : 'No SOURCE_INSTRUMENTED event was recorded for this case. The engine only records this event when it instruments a synthetic retrieval document.',
      timestamp: instrumented[0]?.created_at ?? null,
    },
    {
      key: 'model',
      title: 'Model processing',
      state: requests.length ? 'recorded' : 'missing',
      events: requests,
      summary: requests[0]?.message.replace(/^Dispatched request via adapter:\s*/i, '') ?? null,
      note: requests.length
        ? 'Instrumented request dispatched to the target through its adapter.'
        : 'No adapter request event was recorded for this case.',
      timestamp: requests[0]?.created_at ?? null,
    },
    {
      key: 'tooling',
      title: 'Tool / RAG interaction',
      state: toolCalls.length || traces.length ? 'recorded' : 'missing',
      events: toolCalls,
      traces,
      summary:
        toolCalls.length || traces.length
          ? [
              toolCalls.length && `${toolCalls.length} tool call${toolCalls.length > 1 ? 's' : ''}`,
              traces.length && `${traces.length} trace${traces.length > 1 ? 's' : ''}`,
            ]
              .filter(Boolean)
              .join(' · ')
          : null,
      note:
        toolCalls.length || traces.length
          ? 'Target-side tool calls and retrieval traces captured during execution.'
          : 'The target returned no tool-call events or trace records for this case.',
      timestamp: toolCalls[0]?.created_at ?? traces[0]?.created_at ?? null,
    },
    {
      key: 'output',
      title: 'Output observation',
      state: responses.length ? 'recorded' : 'missing',
      events: responses,
      summary: responseSummary,
      note: responses.length
        ? 'Target response received; response text and tool-call arguments are scanned for candidate tokens.'
        : 'No response event was recorded (the case may be pending, cancelled or errored).',
      timestamp: response?.created_at ?? null,
    },
    {
      key: 'detection',
      title: 'Exposure detection',
      state: isExposed ? 'exposure' : responses.length ? 'clear' : 'missing',
      events: detectionEvents,
      summary: isExposed ? canary.token_preview : null,
      note: isExposed
        ? 'Exact canary token found in target output.'
        : responses.length
          ? 'The response was scanned and this canary token was not found. No exposure is claimed.'
          : 'Detection did not run because no response was recorded.',
      timestamp: observed[0]?.created_at ?? null,
    },
  ];
}

const EVIDENCE_TONE: Record<string, Tone> = { exact: 'info', inferred: 'warning', unverified: 'neutral' };

export function EvidenceCell({ canary, linked }: { canary: DynamicCanary; linked: TaintFinding[] }) {
  if (canary.status !== 'OBSERVED' && linked.length === 0) {
    return <span className="text-xs text-subtle-foreground">N/A · not observed</span>;
  }
  const primary = linked[0];
  if (!primary) {
    return <StatusPill tone="neutral" label="Observed · no finding" variant="plain" />;
  }
  const ev = getEvidenceKind(primary.attribution_level);
  const label =
    ev.kind === 'exact' ? 'Exact · HMAC verified' : ev.kind === 'inferred' ? 'Inferred' : 'Unverified';
  return <StatusPill tone={EVIDENCE_TONE[ev.kind]} label={label} variant="plain" />;
}

/** Legend separating exact-token evidence from inferred leakage. */
export function EvidenceLegend({ className }: { className?: string }) {
  const rows = [
    {
      icon: ShieldCheck,
      tone: 'text-info',
      title: 'Exact token match · HMAC-verified',
      body: 'The session-bound token appeared verbatim in target output and its HMAC-SHA256 digest verified against this run.',
    },
    {
      icon: ShieldQuestion,
      tone: 'text-warning',
      title: 'Inferred / semantic leakage',
      body: 'Leakage concluded from indirect evidence without an exact token. Treat as a lead, not proof.',
    },
    {
      icon: CircleDashed,
      tone: 'text-subtle-foreground',
      title: 'Not observed',
      body: 'A token was generated but never seen in output. Generation alone is never reported as a leak.',
    },
  ];
  return (
    <ul className={cn('space-y-2.5', className)}>
      {rows.map((r) => (
        <li key={r.title} className="flex gap-2.5">
          <r.icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', r.tone)} aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">{r.title}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{r.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CanaryInspector({
  canary,
  runId,
  events,
  findings,
}: {
  canary: DynamicCanary;
  runId: string;
  events: ExecutionEvent[];
  findings: TaintFinding[];
}) {
  const caseId = canary.test_run_case_id ?? '';
  const tracesQuery = useCaseTraces(runId, caseId);
  const traces = useMemo(() => tracesQuery.data ?? [], [tracesQuery.data]);

  const caseEvents = useMemo(() => eventsForCanary(canary, events), [canary, events]);
  const linked = useMemo(() => findingsForCanary(canary, findings), [canary, findings]);
  const stages = useMemo(
    () => buildStages(canary, caseEvents, traces, linked),
    [canary, caseEvents, traces, linked],
  );

  // The parent keys this component by canary id, so stage selection resets per canary.
  const [selected, setSelected] = useState<StageKey>('detection');
  const stage = stages.find((s) => s.key === selected) ?? stages[stages.length - 1];

  const primary = linked[0];
  const provenance = primary?.evidence_reference?.provenance;
  const evidence = primary ? getEvidenceKind(primary.attribution_level) : null;
  const scenarioCategory =
    typeof canary.metadata_json?.category === 'string' ? canary.metadata_json.category : null;

  const hmacValue =
    canary.status !== 'OBSERVED' && !primary ? (
      <span className="text-muted-foreground">Not applicable — not observed</span>
    ) : evidence?.hmacVerified === true ? (
      <StatusPill tone="info" label="Verified" variant="plain" />
    ) : evidence?.hmacVerified === false ? (
      <StatusPill tone="neutral" label="Not verified" variant="plain" />
    ) : evidence?.kind === 'inferred' ? (
      <StatusPill tone="warning" label="No exact token (inferred)" variant="plain" />
    ) : (
      <span className="text-muted-foreground">No linked finding</span>
    );

  const stageTimeline: TimelineItem[] = stage.events.map((e) => ({
    id: e.id,
    title: humanize(e.event_type),
    description: e.message,
    timestamp: e.created_at,
    tone:
      e.event_type === 'CANARY_OBSERVED' || e.event_type === 'FINDING_CREATED'
        ? 'critical'
        : e.level === 'ERROR'
          ? 'warning'
          : 'info',
    meta: <span className="font-mono text-[10px] text-subtle-foreground">{e.event_type}</span>,
    details: e.event_metadata ?? undefined,
  }));

  return (
    <Panel
      id="provenance-inspector"
      title={
        <span className="flex items-center gap-2">
          Provenance inspector
          <span className="font-mono text-xs font-normal text-muted-foreground">{canary.token_preview}</span>
        </span>
      }
      description={`Canary ${shortId(canary.id)} · ${canary.source_type}`}
      icon={Fingerprint}
      actions={
        <div className="flex items-center gap-3">
          <CanaryStatusBadge status={canary.status} />
          {canary.test_run_case_id && (
            <Link
              href={`/test-runs/${runId}/cases/${canary.test_run_case_id}`}
              className="hidden items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              Open case <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <ProvenanceFlow stages={stages} selected={selected} onSelect={setSelected} />
        {tracesQuery.isError && (
          <p className="text-xs text-warning">
            Trace records could not be loaded ({errorMessage(tracesQuery.error)}); the Tool / RAG stage may be
            incomplete.
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-5">
          {/* Stage detail */}
          <div className="min-w-0 space-y-3 lg:col-span-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
              <h3 className="text-[13px] font-semibold text-foreground">{stage.title}</h3>
              <span className="eyebrow">{STAGE_STATE_LABEL[stage.state]}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{stage.note}</p>

            {stage.key === 'source' && (
              <DetailList
                columns={2}
                items={[
                  { label: 'Source ID', value: canary.source_id, mono: true },
                  { label: 'Source type', value: canary.source_type, mono: true },
                  { label: 'HMAC key version', value: canary.key_version, mono: true },
                  {
                    label: 'Scenario category',
                    value: scenarioCategory ? getCategoryLabel(scenarioCategory) : '—',
                  },
                  { label: 'Created', value: formatTimestamp(canary.created_at), mono: true },
                  { label: 'Expires', value: formatTimestamp(canary.expires_at), mono: true },
                ]}
              />
            )}

            {stageTimeline.length > 0 ? (
              <Timeline items={stageTimeline} />
            ) : (
              stage.key !== 'source' &&
              stage.key !== 'tooling' && (
                <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs italic text-subtle-foreground">
                  No events persisted for this stage.
                </p>
              )
            )}

            {stage.key === 'tooling' &&
              (tracesQuery.isLoading && caseId ? (
                <Skeleton className="h-24 w-full" />
              ) : traces.length > 0 ? (
                <div className="space-y-2">
                  {traces.map((t) => (
                    <CodeViewer
                      key={t.id}
                      title={`${t.trace_type}${t.source_id ? ` · ${t.source_id}` : ''}`}
                      value={t.trace_metadata ?? t.evidence_reference ?? {}}
                      highlight={canary.token_preview}
                      maxHeight={220}
                      collapsible
                    />
                  ))}
                </div>
              ) : (
                stageTimeline.length === 0 && (
                  <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs italic text-subtle-foreground">
                    No tool-call events or trace records persisted for this case.
                  </p>
                )
              ))}
          </div>

          {/* Evidence */}
          <div className="min-w-0 space-y-4 lg:col-span-2">
            <section className="rounded-md border border-border bg-surface/30 p-3.5">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <ScanText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> Matched token evidence
              </h3>
              <DetailList
                columns={1}
                items={[
                  {
                    label: 'Token preview',
                    value: (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono text-[12px] text-foreground">{canary.token_preview}</span>
                        <CopyButton value={canary.token_preview} label="Copy token preview" />
                      </span>
                    ),
                  },
                  { label: 'HMAC verification', value: hmacValue },
                  {
                    label: 'Observation location',
                    value: primary?.observation_location ?? '—',
                    mono: true,
                  },
                  { label: 'Detection method', value: primary?.detection_method ?? '—', mono: true },
                  {
                    label: 'Attribution',
                    value: primary ? <AttributionBadge status={primary.attribution_level} /> : '—',
                  },
                ]}
              />
              {provenance?.explanation && (
                <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-foreground/85">
                  {provenance.explanation}
                </p>
              )}
              {!!provenance?.limitations?.length && (
                <div className="mt-3">
                  <p className="eyebrow mb-1">Limitations</p>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
                    {provenance.limitations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-md border border-border p-3.5">
              <h3 className="mb-3 text-[13px] font-semibold text-foreground">Associated execution</h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Test run</span>
                  <Link href={`/test-runs/${runId}`} className="font-mono text-primary hover:underline">
                    {shortId(runId)}
                  </Link>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Case</span>
                  {canary.test_run_case_id ? (
                    <Link
                      href={`/test-runs/${runId}/cases/${canary.test_run_case_id}`}
                      className="font-mono text-primary hover:underline"
                    >
                      {shortId(canary.test_run_case_id)}
                    </Link>
                  ) : (
                    <span className="text-subtle-foreground">—</span>
                  )}
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Canary ID</span>
                  <IdChip value={canary.id} />
                </li>
              </ul>
              <div className="mt-3 border-t border-border pt-3">
                <p className="eyebrow mb-2">Linked findings · {linked.length}</p>
                {linked.length === 0 ? (
                  <p className="text-xs text-subtle-foreground">No finding references this canary.</p>
                ) : (
                  <ul className="space-y-2">
                    {linked.map((f) => (
                      <li key={f.id}>
                        <Link
                          href={`/findings/${f.id}`}
                          className="block rounded-md border border-border px-2.5 py-2 transition-colors hover:border-border-strong hover:bg-surface/50"
                        >
                          <p className="line-clamp-2 text-xs font-medium text-foreground">{f.title}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <SeverityBadge severity={f.severity} compact />
                            <FindingStatusBadge status={f.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="rounded-md border border-border p-3.5">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> Evidence classes
              </h3>
              <EvidenceLegend />
            </section>
          </div>
        </div>

        {/* All case events for completeness */}
        <details className="group rounded-md border border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-[13px] font-medium text-foreground">
            <span className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              Full case event sequence
              <span className="font-mono text-xs text-subtle-foreground">{caseEvents.length}</span>
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">Expand</span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">Collapse</span>
          </summary>
          <div className="border-t border-border p-3.5">
            {caseEvents.length === 0 ? (
              <p className="text-xs text-subtle-foreground">No events recorded for this case.</p>
            ) : (
              <Timeline
                items={caseEvents.map((e) => ({
                  id: e.id,
                  title: humanize(e.event_type),
                  description: e.message,
                  timestamp: e.created_at,
                  tone: e.event_type === 'CANARY_OBSERVED' ? 'critical' : 'neutral',
                  details: e.event_metadata ?? undefined,
                }))}
              />
            )}
          </div>
        </details>
      </div>
    </Panel>
  );
}
