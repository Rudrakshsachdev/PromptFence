'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CircleDashed,
  Fingerprint,
  Play,
  RotateCw,
  ShieldCheck,
  ShieldQuestion,
  Siren,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { SearchInput } from '@/components/forms/search-input';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { ErrorState } from '@/components/shared/error-state';
import { FilterBar, SegmentedControl } from '@/components/shared/filter-bar';
import { CopyButton } from '@/components/shared/id-chip';
import { Pagination, paginate } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { PageSkeleton } from '@/components/shared/skeletons';
import { CanaryStatusBadge, RunStatusBadge } from '@/components/shared/status-badges';
import { UnavailableNotice } from '@/components/shared/unavailable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTestRun, useTestRuns } from '@/hooks/use-test-runs';
import { formatNumber, formatTimestamp, shortId } from '@/lib/format';
import { getEvidenceKind, isRunTerminal } from '@/lib/status';
import { formatRelativeTime } from '@/lib/utils';
import { testRunService } from '@/services/test-run.service';
import type { DynamicCanary, TestRun } from '@/types/test-run';
import {
  CanaryInspector,
  EvidenceCell,
  EvidenceLegend,
  eventsForCanary,
  findingsForCanary,
} from './_components/canary-inspector';

const PAGE_SIZE = 25;
type ExposureFilter = 'all' | 'exposed' | 'not_observed';

function runLabel(r: TestRun) {
  return r.target?.name ?? r.execution_snapshot?.target?.name ?? 'Unknown target';
}

function ProvenanceInspectorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const runParam = searchParams.get('run') ?? '';
  const canaryParam = searchParams.get('canary') ?? '';

  const runs = useTestRuns({ page: 1, page_size: 100 });

  const runId = useMemo(() => {
    if (runParam) return runParam;
    const items = runs.data?.items ?? [];
    return (items.find((r) => r.status === 'COMPLETED') ?? items[0])?.id ?? '';
  }, [runParam, runs.data]);

  const run = useTestRun(runId);
  const live = !!run.data && !isRunTerminal(run.data.status);
  const refetchInterval = live ? 3000 : false;

  const canaries = useQuery({
    queryKey: ['test-run-canaries', runId],
    queryFn: () => testRunService.getRunCanaries(runId),
    enabled: !!runId,
    refetchInterval,
  });
  const events = useQuery({
    queryKey: ['test-run-events', runId],
    queryFn: () => testRunService.getRunEvents(runId),
    enabled: !!runId,
    refetchInterval,
  });
  const findings = useQuery({
    queryKey: ['test-run-findings', runId],
    queryFn: () => testRunService.getRunFindings(runId),
    enabled: !!runId,
    refetchInterval,
  });

  const [filter, setFilter] = useState<ExposureFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filter, search, runId]);

  const setParams = (next: { run?: string; canary?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.run !== undefined) {
      params.set('run', next.run);
      params.delete('canary');
    }
    if (next.canary !== undefined) {
      if (next.canary) params.set('canary', next.canary);
      else params.delete('canary');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const canaryList = useMemo(() => canaries.data ?? [], [canaries.data]);
  const eventList = useMemo(() => events.data ?? [], [events.data]);
  const findingList = useMemo(() => findings.data ?? [], [findings.data]);

  const detectedAt = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of canaryList) {
      const ev = eventsForCanary(c, eventList).find((e) => e.event_type === 'CANARY_OBSERVED');
      if (ev) map.set(c.id, ev.created_at);
    }
    return map;
  }, [canaryList, eventList]);

  const linkedByCanary = useMemo(() => {
    const map = new Map<string, ReturnType<typeof findingsForCanary>>();
    for (const c of canaryList) map.set(c.id, findingsForCanary(c, findingList));
    return map;
  }, [canaryList, findingList]);

  const kpis = useMemo(() => {
    const exposed = canaryList.filter((c) => c.status === 'OBSERVED').length;
    let exact = 0;
    let inferred = 0;
    for (const f of findingList) {
      const k = getEvidenceKind(f.attribution_level).kind;
      if (k === 'exact') exact += 1;
      else if (k === 'inferred') inferred += 1;
    }
    return { total: canaryList.length, exposed, notObserved: canaryList.length - exposed, exact, inferred };
  }, [canaryList, findingList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return canaryList
      .filter((c) =>
        filter === 'exposed' ? c.status === 'OBSERVED' : filter === 'not_observed' ? c.status !== 'OBSERVED' : true,
      )
      .filter(
        (c) =>
          !q ||
          `${c.token_preview} ${c.source_id} ${c.source_type} ${c.id} ${c.test_run_case_id ?? ''}`
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => {
        // Exposed first, then chronological.
        if ((a.status === 'OBSERVED') !== (b.status === 'OBSERVED')) return a.status === 'OBSERVED' ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }, [canaryList, filter, search]);

  const paged = paginate(filtered, page, PAGE_SIZE);

  const selectedCanary = useMemo<DynamicCanary | undefined>(() => {
    if (canaryParam) return canaryList.find((c) => c.id === canaryParam);
    return canaryList.find((c) => c.status === 'OBSERVED') ?? canaryList[0];
  }, [canaryParam, canaryList]);

  const selectCanary = (c: DynamicCanary) => {
    setParams({ canary: c.id });
    window.requestAnimationFrame(() =>
      document.getElementById('provenance-inspector')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  // Ensure the selected run appears in the selector even if older than the first 100.
  const runOptions = useMemo(() => {
    const items = runs.data?.items ?? [];
    if (run.data && !items.some((r) => r.id === run.data?.id)) return [run.data, ...items];
    return items;
  }, [runs.data, run.data]);

  const columns: DataTableColumn<DynamicCanary>[] = [
    {
      id: 'token',
      header: 'Token',
      sortValue: (c) => c.token_preview,
      cell: (c) => (
        <span className="inline-flex items-center gap-1">
          <span className="font-mono text-[12px] text-foreground">{c.token_preview}</span>
          <CopyButton value={c.token_preview} label="Copy token preview" />
        </span>
      ),
    },
    {
      id: 'source',
      header: 'Source',
      sortValue: (c) => c.source_id,
      cell: (c) => (
        <div className="min-w-0 max-w-[220px]">
          <p className="truncate font-mono text-[12px] text-foreground/90" title={c.source_id}>
            {c.source_id}
          </p>
          <p className="truncate text-[11px] text-subtle-foreground">{c.source_type}</p>
        </div>
      ),
    },
    {
      id: 'case',
      header: 'Case',
      hideBelow: 'md',
      cell: (c) =>
        c.test_run_case_id ? (
          <Link
            href={`/test-runs/${c.test_run_id}/cases/${c.test_run_case_id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-[12px] text-primary hover:underline"
          >
            {shortId(c.test_run_case_id)}
          </Link>
        ) : (
          <span className="text-subtle-foreground">—</span>
        ),
    },
    {
      id: 'created',
      header: 'Created',
      hideBelow: 'lg',
      sortValue: (c) => c.created_at,
      cell: (c) => <span className="font-mono text-[11px] text-muted-foreground">{formatTimestamp(c.created_at)}</span>,
    },
    {
      id: 'expires',
      header: 'Expires',
      hideBelow: 'xl',
      sortValue: (c) => c.expires_at,
      cell: (c) => <span className="font-mono text-[11px] text-muted-foreground">{formatTimestamp(c.expires_at)}</span>,
    },
    {
      id: 'detected',
      header: 'Detected',
      sortValue: (c) => detectedAt.get(c.id) ?? null,
      cell: (c) => {
        const ts = detectedAt.get(c.id);
        return ts ? (
          <span className="font-mono text-[11px] text-critical">{formatTimestamp(ts)}</span>
        ) : (
          <span className="text-subtle-foreground">—</span>
        );
      },
    },
    { id: 'status', header: 'Status', sortValue: (c) => c.status, cell: (c) => <CanaryStatusBadge status={c.status} /> },
    {
      id: 'evidence',
      header: 'Evidence / HMAC',
      hideBelow: 'sm',
      cell: (c) => <EvidenceCell canary={c} linked={linkedByCanary.get(c.id) ?? []} />,
    },
  ];

  const taintingDisabled = run.data?.execution_snapshot?.parameters?.canary_tainting_enabled === false;
  const dataError = canaries.error ?? events.error ?? findings.error;

  if (runs.isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Fingerprint}
        title="Canary & Provenance"
        description="Session-bound canary tokens, their lifecycle, and the recorded taint path from source to exposure. Exposure is only reported when the exact token is observed in target output."
        meta={
          run.data ? (
            <>
              <HeaderMeta label="Run">
                <Link href={`/test-runs/${run.data.id}`} className="font-mono hover:text-primary">
                  {shortId(run.data.id)}
                </Link>
              </HeaderMeta>
              <HeaderMeta label="Target">{runLabel(run.data)}</HeaderMeta>
              <HeaderMeta label="Status">
                <RunStatusBadge status={run.data.status} variant="plain" />
              </HeaderMeta>
              <HeaderMeta label="Started">{formatRelativeTime(run.data.started_at ?? run.data.created_at)}</HeaderMeta>
            </>
          ) : undefined
        }
      >
        {runOptions.length > 0 && (
          <Select value={runId || undefined} onValueChange={(v) => setParams({ run: v })}>
            <SelectTrigger className="h-8 w-[280px] max-w-full" aria-label="Select test run">
              <SelectValue placeholder="Select a test run" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {runOptions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{shortId(r.id)}</span>
                    <span className="truncate">{runLabel(r)}</span>
                    <span className="text-[11px] text-subtle-foreground">{formatRelativeTime(r.created_at)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {runId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              canaries.refetch();
              events.refetch();
              findings.refetch();
            }}
            disabled={canaries.isFetching || events.isFetching}
          >
            <RotateCw className={`h-3.5 w-3.5 ${canaries.isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        )}
      </PageHeader>

      {runs.isError ? (
        <ErrorState error={runs.error} onRetry={() => runs.refetch()} />
      ) : runOptions.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No test runs yet"
          description="Canary tokens are generated per case when a test run executes with canary tainting enabled."
          actionText="Launch test run"
          actionHref="/test-runs/new"
        />
      ) : (
        <>
          {live && (
            <p className="flex items-center gap-2 text-xs text-info">
              <span className="h-1.5 w-1.5 animate-status-pulse rounded-full bg-info" aria-hidden />
              Run in progress — canaries, events and findings refresh every 3 seconds.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <StatsCard
              title="Canaries generated"
              value={formatNumber(kpis.total)}
              subtitle="Session-bound to this run"
              icon={Fingerprint}
              isLoading={canaries.isLoading}
            />
            <StatsCard
              title="Exposed"
              value={formatNumber(kpis.exposed)}
              subtitle="Exact token observed in output"
              icon={Siren}
              tone="critical"
              isLoading={canaries.isLoading}
            />
            <StatsCard
              title="Not observed"
              value={formatNumber(kpis.notObserved)}
              subtitle="Generated, never seen in output"
              icon={CircleDashed}
              isLoading={canaries.isLoading}
            />
            <StatsCard
              title="Exact-token findings"
              value={formatNumber(kpis.exact)}
              subtitle="HMAC-verified attribution"
              icon={ShieldCheck}
              tone="info"
              isLoading={findings.isLoading}
            />
            <StatsCard
              title="Inferred findings"
              value={formatNumber(kpis.inferred)}
              subtitle="No exact token match"
              icon={ShieldQuestion}
              tone="warning"
              isLoading={findings.isLoading}
            />
          </div>

          {taintingDisabled && (
            <UnavailableNotice
              title="Canary tainting was disabled for this run"
              description="This execution ran without session-bound canaries, so there is no token lifecycle or exposure evidence to inspect. Launch a new run with canary tainting enabled to trace provenance."
            />
          )}

          {dataError ? (
            <ErrorState
              error={dataError}
              onRetry={() => {
                canaries.refetch();
                events.refetch();
                findings.refetch();
              }}
            />
          ) : (
            <Panel
              title="Canary tokens"
              description="Select a token to inspect its provenance chain"
              icon={Fingerprint}
              flush
            >
              <FilterBar
                actions={
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(filtered.length)} of {formatNumber(canaryList.length)}
                  </span>
                }
              >
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  placeholder="Search token, source, case or ID…"
                  className="sm:w-72"
                />
                <SegmentedControl<ExposureFilter>
                  label="Exposure filter"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'exposed', label: `Exposed · ${kpis.exposed}` },
                    { value: 'not_observed', label: 'Not observed' },
                  ]}
                />
              </FilterBar>
              <DataTable
                label="Canary tokens"
                columns={columns}
                data={paged.items}
                getRowId={(c) => c.id}
                isLoading={canaries.isLoading}
                onRowClick={selectCanary}
                rowClassName={(c) => (c.id === selectedCanary?.id ? 'bg-primary/[0.07]' : undefined)}
                empty={
                  canaryList.length === 0 ? (
                    <EmptyState
                      bare
                      compact
                      icon={Fingerprint}
                      title="No canaries generated for this run"
                      description={
                        taintingDisabled
                          ? 'Canary tainting was disabled when this run was launched.'
                          : live
                            ? 'Tokens appear as each case starts executing.'
                            : 'No case in this run generated a canary token.'
                      }
                    >
                      <Button asChild size="sm" variant="outline">
                        <Link href="/test-runs/new">
                          <Play className="h-3.5 w-3.5" /> Launch new run
                        </Link>
                      </Button>
                    </EmptyState>
                  ) : (
                    <EmptyState
                      bare
                      compact
                      icon={Fingerprint}
                      title="No tokens match these filters"
                      description="Adjust the search or exposure filter."
                    />
                  )
                }
              />
              {filtered.length > PAGE_SIZE && (
                <Pagination
                  page={paged.page}
                  totalPages={paged.totalPages}
                  total={paged.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  itemLabel="tokens"
                />
              )}
            </Panel>
          )}

          {selectedCanary && !dataError ? (
            <CanaryInspector
              key={selectedCanary.id}
              canary={selectedCanary}
              runId={runId}
              events={eventList}
              findings={findingList}
            />
          ) : (
            !dataError &&
            canaryList.length === 0 &&
            !canaries.isLoading && (
              <Panel title="Evidence classes" description="How PromptFence classifies leakage evidence">
                <EvidenceLegend />
              </Panel>
            )
          )}
        </>
      )}
    </div>
  );
}

export default function ProvenancePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProvenanceInspectorPage />
    </Suspense>
  );
}
