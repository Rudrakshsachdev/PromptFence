'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatsCard } from '@/components/dashboard/stats-card';
import { FormField } from '@/components/forms/form-field';
import { SearchInput } from '@/components/forms/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { CodeViewer } from '@/components/shared/code-viewer';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/data-table';
import { DetailList } from '@/components/shared/detail-list';
import { ClearFiltersButton, FilterBar, FilterSelect } from '@/components/shared/filter-bar';
import { IdChip } from '@/components/shared/id-chip';
import { Pagination, paginate } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { ReportStatusBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateReport, useReports } from '@/hooks/use-reports';
import { useTargets } from '@/hooks/use-targets';
import { useTestRuns } from '@/hooks/use-test-runs';
import { formatBytes, formatNumber, formatTimestamp, shortId } from '@/lib/format';
import { REPORT_FORMAT_LABELS, REPORT_STATUS_META } from '@/lib/status';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { reportService } from '@/services/report.service';
import type { ReportFormat, ReportJob } from '@/types/report';

const PAGE_SIZE = 15;
const ALL = '__all__';

/**
 * Formats offered for generation. The backend renders every CSV_* format as the
 * same findings export, so only the findings CSV is offered to avoid implying
 * distinct case/assertion/metric exports.
 */
const GENERATABLE_FORMATS: { value: ReportFormat; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'PDF', label: 'PDF report', description: 'Executive summary, findings tables and remediation guidance.', icon: FileText },
  { value: 'JSON', label: 'JSON evidence', description: 'Machine-readable v3.0 bundle with redacted evidence.', icon: FileJson },
  { value: 'CSV_FINDINGS', label: 'CSV findings', description: 'One row per finding for spreadsheets and SIEM import.', icon: FileSpreadsheet },
];

const FORMAT_ICON: Record<string, React.ElementType> = {
  PDF: FileText,
  JSON: FileJson,
};

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

function scopeString(scope: Record<string, unknown> | null | undefined, key: string): string | undefined {
  const v = scope?.[key];
  return typeof v === 'string' && v ? v : undefined;
}

export default function ReportsPage() {
  const reportsQuery = useReports();
  const reports = useMemo(() => reportsQuery.data ?? [], [reportsQuery.data]);
  const { data: targetsData } = useTargets(1, 100);
  const targets = useMemo(() => targetsData?.items ?? [], [targetsData]);
  const targetNames = useMemo(() => new Map(targets.map((t) => [t.id, t.name])), [targets]);
  const { data: completedRunsData } = useTestRuns({ status: 'COMPLETED', page_size: 50 });
  const completedRuns = completedRunsData?.items ?? [];
  const createReport = useCreateReport();

  // Generate dialog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('PDF');
  const [reportTargetId, setReportTargetId] = useState('');
  const [reportTestRunId, setReportTestRunId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Table state
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ id: 'created', direction: 'desc' });
  const [selected, setSelected] = useState<ReportJob | null>(null);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!reportTitle.trim()) {
      setFormError('Please enter a report title.');
      return;
    }
    const scope: Record<string, unknown> = {};
    if (reportTargetId) scope.target_id = reportTargetId;
    if (reportTestRunId) scope.test_run_id = reportTestRunId;

    try {
      await createReport.mutateAsync({ title: reportTitle.trim(), format: reportFormat, scope });
      setIsModalOpen(false);
      setReportTitle('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to request report generation');
    }
  };

  const counts = useMemo(() => {
    const c = { ready: 0, active: 0, failed: 0 };
    for (const r of reports) {
      if (r.status === 'COMPLETED') c.ready += 1;
      else if (r.status === 'FAILED') c.failed += 1;
      else c.active += 1;
    }
    return c;
  }, [reports]);

  const scopeSummary = (r: ReportJob) => {
    const runId = scopeString(r.scope, 'test_run_id');
    const targetId = scopeString(r.scope, 'target_id');
    if (!runId && !targetId) return <span className="text-xs text-subtle-foreground">Recent findings (all targets)</span>;
    return (
      <div className="min-w-0 space-y-0.5 text-xs">
        {targetId && (
          <Link
            href={`/targets/${targetId}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate text-foreground/90 hover:text-primary"
          >
            {targetNames.get(targetId) ?? <span className="font-mono">{shortId(targetId)}</span>}
          </Link>
        )}
        {runId && (
          <Link
            href={`/test-runs/${runId}`}
            onClick={(e) => e.stopPropagation()}
            className="block font-mono text-[11px] text-muted-foreground hover:text-primary"
          >
            run {shortId(runId)}
          </Link>
        )}
      </div>
    );
  };

  const downloadButton = (r: ReportJob, size: 'xs' | 'sm' = 'xs') =>
    r.status === 'COMPLETED' ? (
      <Button asChild size={size} variant="outline">
        <a
          href={reportService.getDownloadUrl(r.id)}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-3 w-3" /> Download
        </a>
      </Button>
    ) : (
      <span className="text-xs text-subtle-foreground">
        {r.status === 'FAILED' ? 'No artifact' : 'Pending'}
      </span>
    );

  const columns: DataTableColumn<ReportJob>[] = [
    {
      id: 'title',
      header: 'Report',
      sortValue: (r) => r.title.toLowerCase(),
      cell: (r) => {
        const Icon = FORMAT_ICON[r.format] ?? FileSpreadsheet;
        return (
          <div className="flex min-w-0 max-w-[360px] items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-subtle-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{r.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {REPORT_FORMAT_LABELS[r.format] ?? r.format} · <span className="font-mono">{shortId(r.id)}</span>
              </p>
            </div>
          </div>
        );
      },
    },
    { id: 'scope', header: 'Scope', hideBelow: 'md', cell: scopeSummary },
    {
      id: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      cell: (r) => <ReportStatusBadge status={r.status} />,
    },
    {
      id: 'size',
      header: 'Size',
      align: 'right',
      hideBelow: 'lg',
      sortValue: (r) => r.file_size_bytes,
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{formatBytes(r.file_size_bytes)}</span>,
    },
    {
      id: 'hash',
      header: 'SHA-256',
      hideBelow: 'xl',
      cell: (r) => (r.content_hash ? <IdChip value={r.content_hash} length={12} /> : <span className="mono-id">—</span>),
    },
    {
      id: 'created',
      header: 'Generated',
      align: 'right',
      hideBelow: 'sm',
      sortValue: (r) => r.created_at,
      cell: (r) => (
        <span className="text-xs text-muted-foreground" title={formatTimestamp(r.created_at)}>
          {formatRelativeTime(r.completed_at ?? r.created_at)}
        </span>
      ),
    },
    { id: 'download', header: <span className="sr-only">Download</span>, align: 'right', cell: (r) => downloadButton(r) },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter(
      (r) =>
        (!formatFilter || r.format === formatFilter) &&
        (!statusFilter || r.status === statusFilter) &&
        (!q || `${r.title} ${r.id} ${r.content_hash ?? ''}`.toLowerCase().includes(q)),
    );
  }, [reports, search, formatFilter, statusFilter]);

  const paged = paginate(sortRows(filtered, columns, sort), page, PAGE_SIZE);
  const hasFilters = !!search || !!formatFilter || !!statusFilter;
  const presentFormats = Array.from(new Set(reports.map((r) => r.format)));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Reports"
        description="Evidence-grade exports of findings and executions. Every artifact is hashed with SHA-256 at generation time and secrets are redacted."
      >
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Refresh reports"
          title="Refresh"
          onClick={() => reportsQuery.refetch()}
        >
          <RotateCcw className={cn('h-3.5 w-3.5', reportsQuery.isFetching && 'animate-spin')} />
        </Button>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Generate report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard title="Reports" value={formatNumber(reports.length)} icon={FileText} isLoading={reportsQuery.isLoading} />
        <StatsCard
          title="Ready to download"
          value={formatNumber(counts.ready)}
          icon={CheckCircle2}
          tone="success"
          isLoading={reportsQuery.isLoading}
        />
        <StatsCard
          title="In progress"
          value={formatNumber(counts.active)}
          subtitle={counts.active ? 'Auto-refreshing every 3s' : 'Queued or generating'}
          icon={Loader2}
          tone="info"
          isLoading={reportsQuery.isLoading}
        />
        <StatsCard
          title="Failed"
          value={formatNumber(counts.failed)}
          icon={TriangleAlert}
          tone="critical"
          isLoading={reportsQuery.isLoading}
        />
      </div>

      <Panel title="Generated reports" description={`${filtered.length} of ${reports.length}`} flush>
        <FilterBar>
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder="Search title, ID or hash…"
          />
          <FilterSelect
            label="Format"
            value={formatFilter}
            onChange={(v) => {
              setFormatFilter(v);
              setPage(1);
            }}
            options={presentFormats.map((f) => ({ value: f, label: REPORT_FORMAT_LABELS[f] ?? f }))}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={Object.entries(REPORT_STATUS_META).map(([value, m]) => ({ value, label: m.label }))}
          />
          <ClearFiltersButton
            visible={hasFilters}
            onClick={() => {
              setSearch('');
              setFormatFilter('');
              setStatusFilter('');
              setPage(1);
            }}
          />
        </FilterBar>
        <DataTable
          label="Generated reports"
          columns={columns}
          data={paged.items}
          getRowId={(r) => r.id}
          isLoading={reportsQuery.isLoading}
          error={reportsQuery.error}
          onRetry={() => reportsQuery.refetch()}
          onRowClick={setSelected}
          sort={sort}
          onSortChange={(s) => {
            setSort(s);
            setPage(1);
          }}
          empty={
            reports.length === 0 ? (
              <EmptyState
                bare
                icon={FileText}
                title="No reports generated yet"
                description="Generate a PDF, JSON or CSV export scoped to a target or a completed test run."
                actionText="Generate report"
                onAction={() => setIsModalOpen(true)}
              />
            ) : (
              <EmptyState bare compact icon={FileText} title="No reports match" description="Adjust or clear the filters." />
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
            itemLabel="reports"
          />
        )}
      </Panel>

      {/* Report details */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{selected.title}</DialogTitle>
                <DialogDescription>{REPORT_FORMAT_LABELS[selected.format] ?? selected.format}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <DetailList
                  columns={2}
                  items={[
                    { label: 'Status', value: <ReportStatusBadge status={selected.status} /> },
                    { label: 'Report ID', value: <IdChip value={selected.id} full /> },
                    { label: 'Created', value: formatTimestamp(selected.created_at), mono: true },
                    { label: 'Completed', value: formatTimestamp(selected.completed_at), mono: true },
                    { label: 'File size', value: formatBytes(selected.file_size_bytes), mono: true },
                    { label: 'Created by', value: <IdChip value={selected.created_by} /> },
                    {
                      label: 'SHA-256 content hash',
                      wide: true,
                      value: selected.content_hash ? (
                        <IdChip value={selected.content_hash} full className="max-w-full" />
                      ) : (
                        <span className="text-xs text-subtle-foreground">Computed when generation completes</span>
                      ),
                    },
                    { label: 'Scope', wide: true, value: scopeSummary(selected) },
                  ]}
                />
                {selected.error_message && (
                  <CodeViewer title="Error" value={selected.error_message} language="text" maxHeight={160} />
                )}
                <CodeViewer title="Scope payload" value={selected.scope} emptyText="Empty scope" maxHeight={160} />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                  Close
                </Button>
                {selected.status === 'COMPLETED' && downloadButton(selected, 'sm')}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate report */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateReport} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle>Generate report</DialogTitle>
              <DialogDescription>Reports are generated asynchronously; this list refreshes automatically.</DialogDescription>
            </DialogHeader>

            <FormField label="Report title" id="report-title" required>
              <Input
                id="report-title"
                placeholder="e.g. Q4 production assessment — support assistant"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </FormField>

            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-foreground">Format</legend>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                {GENERATABLE_FORMATS.map((f) => {
                  const active = reportFormat === f.value;
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setReportFormat(f.value)}
                      className={cn(
                        'rounded-md border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                        active
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-border bg-background/60 hover:border-border-strong',
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-subtle-foreground')} />
                        {f.label}
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{f.description}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Target" id="report-target">
                <Select
                  value={reportTargetId || ALL}
                  onValueChange={(v) => {
                    setReportTargetId(v === ALL ? '' : v);
                    setReportTestRunId('');
                  }}
                >
                  <SelectTrigger id="report-target" aria-label="Target scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All targets</SelectItem>
                    {targets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Test run" id="report-run">
                <Select value={reportTestRunId || ALL} onValueChange={(v) => setReportTestRunId(v === ALL ? '' : v)}>
                  <SelectTrigger id="report-run" aria-label="Test run scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Latest findings</SelectItem>
                    {completedRuns
                      .filter((r) => !reportTargetId || r.target_id === reportTargetId)
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {(r.test_suite?.name ?? 'Suite') + ' · ' + formatDate(r.created_at) + ' · ' + shortId(r.id)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <p className="text-[11px] leading-relaxed text-subtle-foreground">
              Content is filtered by test run. Without a run, the generator includes the most recent findings across the
              workspace; a selected target is recorded in the report scope for reference.
            </p>

            {formError && (
              <p role="alert" className="rounded-md border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">
                {formError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createReport.isPending}>
                {createReport.isPending ? 'Queuing…' : 'Generate report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
