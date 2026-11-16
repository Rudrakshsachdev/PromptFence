'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Activity, FileJson, FlaskConical, Loader2, Play, Settings2, StickyNote } from 'lucide-react';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { CodeViewer } from '@/components/shared/code-viewer';
import { DetailList } from '@/components/shared/detail-list';
import { ErrorState } from '@/components/shared/error-state';
import { IdChip } from '@/components/shared/id-chip';
import { Panel } from '@/components/shared/panel';
import { PageSkeleton } from '@/components/shared/skeletons';
import { ExperimentStatusBadge } from '@/components/shared/status-badges';
import { StatusPill } from '@/components/shared/status-pill';
import { NotMeasured, UnavailableNotice } from '@/components/shared/unavailable';
import { Button } from '@/components/ui/button';
import { useExperiment, useRunExperiment } from '@/hooks/use-evaluation';
import { useTarget } from '@/hooks/use-targets';
import { formatNumber, formatTimestamp, shortId } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import { readMetrics, RESEARCH_METRICS } from '../_components/research-metrics';

export default function ExperimentDetailPage() {
  const params = useParams<{ experimentId: string }>();
  const experimentId = params?.experimentId || '';

  const experimentQuery = useExperiment(experimentId);
  const experiment = experimentQuery.data;
  const targetQuery = useTarget(experiment?.target_id ?? '');
  const runMutation = useRunExperiment();

  if (experimentQuery.isLoading) return <PageSkeleton />;

  if (experimentQuery.isError || !experiment) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Experiment unavailable"
          backHref="/evaluation/experiments"
          backLabel="Research experiments"
        />
        <ErrorState
          title="Research experiment could not be loaded"
          error={experimentQuery.error ?? 'The experiment does not exist or you do not have access to it.'}
          onRetry={() => experimentQuery.refetch()}
        />
      </div>
    );
  }

  const summary = experiment.results_summary;
  const metrics = readMetrics(summary?.metrics);
  const linkedRunId = typeof summary?.test_run_id === 'string' ? summary.test_run_id : undefined;
  const notes = Array.isArray(summary?.notes) ? summary.notes.filter((n): n is string => typeof n === 'string') : [];
  const isRunning = runMutation.isPending || experiment.status === 'RUNNING';

  const onRun = () =>
    runMutation.mutate(experiment.id, {
      // The shared hook only invalidates the list; refresh this record explicitly.
      onSettled: () => experimentQuery.refetch(),
    });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FlaskConical}
        backHref="/evaluation/experiments"
        backLabel="Research experiments"
        title={experiment.name}
        badge={<ExperimentStatusBadge status={experiment.status} />}
        description={experiment.description || undefined}
        meta={
          <>
            <HeaderMeta label="ID">
              <IdChip value={experiment.id} />
            </HeaderMeta>
            <HeaderMeta label="Dataset">
              <span className="font-mono text-xs">
                {experiment.dataset_name}@{experiment.dataset_version}
              </span>
            </HeaderMeta>
            <HeaderMeta label="Registered">{formatDate(experiment.created_at)}</HeaderMeta>
            {experiment.completed_at && <HeaderMeta label="Completed">{formatDate(experiment.completed_at)}</HeaderMeta>}
          </>
        }
      >
        {linkedRunId && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/test-runs/${linkedRunId}`}>
              <Activity className="h-3.5 w-3.5" /> View test run
            </Link>
          </Button>
        )}
        {experiment.status === 'DRAFT' && (
          <Button size="sm" onClick={onRun} disabled={isRunning}>
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {isRunning ? 'Running experiment…' : 'Run experiment'}
          </Button>
        )}
      </PageHeader>

      {experiment.status === 'DRAFT' && !metrics && (
        <UnavailableNotice
          title="Metrics not yet measured"
          description="This experiment is a draft. Running it executes the target against the ground-truth manifest and computes the six research metrics below."
        />
      )}
      {experiment.status === 'FAILED' && (
        <UnavailableNotice
          title="Experiment failed"
          description="The run did not complete, so metrics were not computed. Inspect the raw results summary below for details."
        />
      )}

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="eyebrow mb-2">
          Research metrics
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {RESEARCH_METRICS.map((def) => {
            const value = metrics?.[def.key];
            return (
              <div key={def.key} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-panel">
                <span className="eyebrow truncate" title={def.label}>
                  {def.label}
                </span>
                {typeof value === 'number' ? (
                  <span className="font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">
                    {def.format(value)}
                  </span>
                ) : (
                  <NotMeasured className="py-1" />
                )}
                <p className="text-[11px] leading-snug text-subtle-foreground">
                  {def.description} {def.higherIsBetter ? '↑ better' : '↓ better'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Results" icon={Activity} className="lg:col-span-1">
          {summary ? (
            <DetailList
              columns={1}
              items={[
                {
                  label: 'Linked test run',
                  value: linkedRunId ? (
                    <Link href={`/test-runs/${linkedRunId}`} className="font-mono text-xs text-primary hover:underline">
                      {shortId(linkedRunId)}
                    </Link>
                  ) : (
                    <NotMeasured label="Not recorded" />
                  ),
                },
                {
                  label: 'Cases evaluated',
                  value:
                    typeof summary.total_cases_evaluated === 'number' ? (
                      <span className="font-mono">{formatNumber(summary.total_cases_evaluated)}</span>
                    ) : (
                      <NotMeasured label="Not recorded" />
                    ),
                },
                {
                  label: 'Findings detected',
                  value:
                    typeof summary.findings_detected === 'number' ? (
                      <span className="font-mono">{formatNumber(summary.findings_detected)}</span>
                    ) : (
                      <NotMeasured label="Not recorded" />
                    ),
                },
                { label: 'Completed', value: <span className="font-mono text-xs">{formatTimestamp(experiment.completed_at)}</span> },
              ]}
            />
          ) : (
            <p className="text-xs italic text-subtle-foreground">No results recorded yet.</p>
          )}
        </Panel>

        <Panel title="Notes" icon={StickyNote} className="lg:col-span-2">
          {notes.length ? (
            <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-subtle-foreground" aria-hidden />
                  {n}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs italic text-subtle-foreground">No methodology or result notes recorded.</p>
          )}
        </Panel>
      </div>

      <Panel title="Configuration" icon={Settings2}>
        <div className="space-y-5">
          <DetailList
            columns={4}
            items={[
              {
                label: 'Target',
                value: (
                  <Link href={`/targets/${experiment.target_id}`} className="hover:text-primary">
                    {targetQuery.data?.name ?? <span className="font-mono text-xs">{shortId(experiment.target_id)}</span>}
                  </Link>
                ),
              },
              { label: 'Target version', value: experiment.target_version, mono: true },
              { label: 'Dataset', value: experiment.dataset_name, mono: true },
              { label: 'Dataset version', value: experiment.dataset_version, mono: true },
              { label: 'Repetitions', value: <span className="font-mono">{experiment.repetitions}</span> },
              {
                label: 'Trace linkage',
                value: (
                  <StatusPill
                    tone={experiment.trace_linkage_enabled ? 'success' : 'neutral'}
                    label={experiment.trace_linkage_enabled ? 'Enabled' : 'Disabled'}
                  />
                ),
              },
              { label: 'Created by', value: <IdChip value={experiment.created_by} /> },
              { label: 'Created', value: formatTimestamp(experiment.created_at), mono: true },
            ]}
          />
          <div className="grid gap-3 xl:grid-cols-2">
            <CodeViewer
              title="Ground-truth manifest"
              value={experiment.ground_truth_manifest}
              maxHeight={360}
            />
            <CodeViewer
              title="Canary configuration"
              value={experiment.canary_config}
              emptyText="Default canary configuration (none specified)"
              maxHeight={360}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Raw results summary" icon={FileJson} description="Exact payload returned by the API">
        <CodeViewer value={summary} emptyText="No results summary recorded" maxHeight={320} />
      </Panel>
    </div>
  );
}
