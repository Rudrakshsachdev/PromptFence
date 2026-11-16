'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Columns3, FlaskConical, Loader2, Play, Plus, RotateCcw, Scale, X } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SearchInput } from '@/components/forms/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/data-table';
import { ClearFiltersButton, FilterBar, FilterSelect } from '@/components/shared/filter-bar';
import { Pagination, paginate } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { ExperimentStatusBadge } from '@/components/shared/status-badges';
import { NotMeasured } from '@/components/shared/unavailable';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useExperiments, useRunExperiment } from '@/hooks/use-evaluation';
import { useTargets } from '@/hooks/use-targets';
import { formatTimestamp, shortId } from '@/lib/format';
import { EXPERIMENT_STATUS_META } from '@/lib/status';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { EvaluationExperiment, ResearchMetrics } from '@/types/evaluation';
import { CreateExperimentDialog } from './_components/create-experiment-dialog';
import { readMetrics, RESEARCH_METRICS } from './_components/research-metrics';

const PAGE_SIZE = 15;

/** Sorts the full list before client-side pagination (DataTable only sorts the rows it receives). */
function sortRows<T>(rows: T[], columns: DataTableColumn<T>[], sort: SortState): T[] {
  const get = sort ? columns.find((c) => c.id === sort.id)?.sortValue : undefined;
  if (!sort || !get) return rows;
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va === vb) return 0;
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    return va > vb ? dir : -dir;
  });
}

const MAX_COMPARE = 4;

export default function ResearchExperimentsPage() {
  const router = useRouter();
  const experimentsQuery = useExperiments();
  const { data: targetsData } = useTargets(1, 100);
  const targets = useMemo(() => targetsData?.items ?? [], [targetsData]);
  const targetNames = useMemo(() => new Map(targets.map((t) => [t.id, t.name])), [targets]);
  const runExperiment = useRunExperiment();

  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [sort, setSort] = useState<SortState>({ id: 'created', direction: 'desc' });

  const experiments = useMemo(() => experimentsQuery.data ?? [], [experimentsQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return experiments.filter(
      (e) =>
        (!status || e.status === status) &&
        (!q ||
          `${e.name} ${e.description ?? ''} ${e.dataset_name} ${targetNames.get(e.target_id) ?? ''}`
            .toLowerCase()
            .includes(q)),
    );
  }, [experiments, search, status, targetNames]);

  const comparable = (e: EvaluationExperiment) => e.status === 'COMPLETED' && !!readMetrics(e.results_summary?.metrics);
  const compareSet = experiments.filter((e) => selected.includes(e.id));

  const toggleSelected = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_COMPARE ? prev : [...prev, id],
    );

  const runningId = runExperiment.isPending ? runExperiment.variables : undefined;

  const metricCell = (e: EvaluationExperiment, render: (m: Partial<ResearchMetrics>) => React.ReactNode) => {
    const m = readMetrics(e.results_summary?.metrics);
    return m ? render(m) : <NotMeasured label="—" />;
  };

  const columns: DataTableColumn<EvaluationExperiment>[] = [
    {
      id: 'select',
      header: <span className="sr-only">Select for comparison</span>,
      cell: (e) => {
        const enabled = comparable(e);
        const checked = selected.includes(e.id);
        return (
          <input
            type="checkbox"
            aria-label={`Select ${e.name} for comparison`}
            title={enabled ? 'Select for comparison' : 'Only completed experiments with metrics can be compared'}
            disabled={!enabled || (!checked && selected.length >= MAX_COMPARE)}
            checked={checked}
            onClick={(ev) => ev.stopPropagation()}
            onChange={() => toggleSelected(e.id)}
            className="h-3.5 w-3.5 cursor-pointer accent-[hsl(var(--primary))] disabled:cursor-not-allowed disabled:opacity-30"
          />
        );
      },
    },
    {
      id: 'name',
      header: 'Experiment',
      sortValue: (e) => e.name.toLowerCase(),
      cell: (e) => (
        <div className="min-w-0 max-w-[340px]">
          <Link
            href={`/evaluation/experiments/${e.id}`}
            onClick={(ev) => ev.stopPropagation()}
            className="block truncate font-medium text-foreground hover:text-primary"
          >
            {e.name}
          </Link>
          <p className="truncate text-[11px] text-muted-foreground" title={e.description ?? undefined}>
            {e.description || <span className="italic text-subtle-foreground">No objective recorded</span>}
          </p>
        </div>
      ),
    },
    {
      id: 'dataset',
      header: 'Dataset',
      hideBelow: 'lg',
      sortValue: (e) => e.dataset_name,
      cell: (e) => (
        <span className="font-mono text-xs text-muted-foreground">
          {e.dataset_name}
          <span className="text-subtle-foreground">@{e.dataset_version}</span>
        </span>
      ),
    },
    {
      id: 'target',
      header: 'Target',
      hideBelow: 'md',
      cell: (e) => (
        <Link
          href={`/targets/${e.target_id}`}
          onClick={(ev) => ev.stopPropagation()}
          className="text-xs text-foreground/90 hover:text-primary"
        >
          {targetNames.get(e.target_id) ?? <span className="font-mono">{shortId(e.target_id)}</span>}
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (e) => e.status,
      cell: (e) => <ExperimentStatusBadge status={e.status} />,
    },
    {
      id: 'accuracy',
      header: 'Attribution',
      align: 'right',
      sortValue: (e) => readMetrics(e.results_summary?.metrics)?.provenance_attribution_accuracy ?? null,
      cell: (e) =>
        metricCell(e, (m) => (
          <span className="font-mono text-xs tabular-nums text-foreground">
            {m.provenance_attribution_accuracy !== undefined ? RESEARCH_METRICS[0].format(m.provenance_attribution_accuracy) : '—'}
          </span>
        )),
    },
    {
      id: 'pr',
      header: 'Precision / Recall',
      align: 'right',
      hideBelow: 'md',
      cell: (e) =>
        metricCell(e, (m) => (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {m.precision !== undefined ? `${(m.precision * 100).toFixed(0)}%` : '—'} /{' '}
            {m.recall !== undefined ? `${(m.recall * 100).toFixed(0)}%` : '—'}
          </span>
        )),
    },
    {
      id: 'reps',
      header: 'Reps',
      align: 'right',
      hideBelow: 'xl',
      cell: (e) => <span className="font-mono text-xs text-muted-foreground">{e.repetitions}</span>,
    },
    {
      id: 'created',
      header: 'Created',
      align: 'right',
      hideBelow: 'lg',
      sortValue: (e) => e.created_at,
      cell: (e) => (
        <span className="text-xs text-muted-foreground" title={formatTimestamp(e.created_at)}>
          {formatRelativeTime(e.created_at)}
          {e.completed_at && (
            <span className="block text-[11px] text-subtle-foreground">done {formatRelativeTime(e.completed_at)}</span>
          )}
        </span>
      ),
    },
    {
      id: 'action',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (e) =>
        e.status === 'DRAFT' ? (
          <Button
            size="xs"
            variant="outline"
            disabled={runExperiment.isPending}
            onClick={(ev) => {
              ev.stopPropagation();
              runExperiment.mutate(e.id);
            }}
          >
            {runningId === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {runningId === e.id ? 'Running…' : 'Run'}
          </Button>
        ) : (
          <Button asChild size="xs" variant="ghost">
            <Link href={`/evaluation/experiments/${e.id}`} onClick={(ev) => ev.stopPropagation()} aria-label={`Open ${e.name}`}>
              Open <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        ),
    },
  ];

  const paged = paginate(sortRows(filtered, columns, sort), page, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FlaskConical}
        title="Research experiments"
        description="Controlled experiments that replay a ground-truth manifest against a target and measure how accurately canary provenance attributes each leak."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/evaluation">
            <Scale className="h-3.5 w-3.5" /> Security evaluation
          </Link>
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Refresh experiments"
          title="Refresh"
          onClick={() => experimentsQuery.refetch()}
        >
          <RotateCcw className={cn('h-3.5 w-3.5', experimentsQuery.isFetching && 'animate-spin')} />
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New experiment
        </Button>
      </PageHeader>

      {selected.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-foreground">
            <span className="font-medium">{selected.length}</span> of {MAX_COMPARE} experiments selected
            {selected.length < 2 && <span className="text-muted-foreground"> · select at least 2 to compare</span>}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="xs" onClick={() => { setSelected([]); setComparing(false); }}>
              <X className="h-3 w-3" /> Clear
            </Button>
            <Button size="xs" disabled={selected.length < 2} onClick={() => setComparing(true)}>
              <Columns3 className="h-3 w-3" /> Compare metrics
            </Button>
          </div>
        </div>
      )}

      {comparing && compareSet.length >= 2 && (
        <Panel
          title="Metric comparison"
          description="Best value per metric is highlighted. Values come directly from each experiment’s results summary."
          icon={Columns3}
          flush
          actions={
            <Button variant="ghost" size="xs" onClick={() => setComparing(false)}>
              <X className="h-3 w-3" /> Close
            </Button>
          }
        >
          <Table aria-label="Experiment metric comparison">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Metric</TableHead>
                {compareSet.map((e) => (
                  <TableHead key={e.id} className="text-right normal-case tracking-normal">
                    <Link href={`/evaluation/experiments/${e.id}`} className="text-foreground hover:text-primary">
                      {e.name}
                    </Link>
                    <span className="block font-mono text-[10px] text-subtle-foreground">
                      {e.dataset_name}@{e.dataset_version}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {RESEARCH_METRICS.map((def) => {
                const values = compareSet.map((e) => readMetrics(e.results_summary?.metrics)?.[def.key]);
                const numeric = values.filter((v): v is number => typeof v === 'number');
                const best = numeric.length
                  ? def.higherIsBetter
                    ? Math.max(...numeric)
                    : Math.min(...numeric)
                  : undefined;
                return (
                  <TableRow key={def.key}>
                    <TableCell>
                      <p className="text-[13px] font-medium">{def.label}</p>
                      <p className="text-[11px] text-subtle-foreground">
                        {def.description} {def.higherIsBetter ? 'Higher is better.' : 'Lower is better.'}
                      </p>
                    </TableCell>
                    {values.map((v, i) => (
                      <TableCell key={compareSet[i].id} className="text-right">
                        {typeof v === 'number' ? (
                          <span
                            className={cn(
                              'font-mono text-[13px] tabular-nums',
                              numeric.length > 1 && v === best ? 'font-semibold text-success' : 'text-foreground',
                            )}
                          >
                            {def.format(v)}
                          </span>
                        ) : (
                          <NotMeasured />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Panel>
      )}

      <Panel
        title="Experiments"
        description={`${filtered.length} of ${experiments.length}`}
        flush
      >
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder="Search name, objective, dataset, target…"
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={Object.entries(EXPERIMENT_STATUS_META).map(([value, m]) => ({ value, label: m.label }))}
          />
          <ClearFiltersButton
            visible={!!search || !!status}
            onClick={() => {
              setSearch('');
              setStatus('');
              setPage(1);
            }}
          />
        </FilterBar>
        <DataTable
          label="Research experiments"
          columns={columns}
          data={paged.items}
          getRowId={(e) => e.id}
          isLoading={experimentsQuery.isLoading}
          error={experimentsQuery.error}
          onRetry={() => experimentsQuery.refetch()}
          onRowClick={(e) => router.push(`/evaluation/experiments/${e.id}`)}
          sort={sort}
          onSortChange={(s) => {
            setSort(s);
            setPage(1);
          }}
          empty={
            experiments.length === 0 ? (
              <EmptyState
                bare
                icon={FlaskConical}
                title="No research experiments yet"
                description="Register an experiment with a ground-truth manifest to measure attribution accuracy, precision, recall and overhead."
                actionText="New experiment"
                onAction={() => setCreateOpen(true)}
              />
            ) : (
              <EmptyState
                bare
                compact
                icon={FlaskConical}
                title="No experiments match"
                description="Adjust the search or status filter."
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
            itemLabel="experiments"
          />
        )}
      </Panel>

      <CreateExperimentDialog open={createOpen} onOpenChange={setCreateOpen} targets={targets} />
    </div>
  );
}
