'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { RotateCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SearchInput } from '@/components/forms/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { ClearFiltersButton, FilterBar, FilterSelect } from '@/components/shared/filter-bar';
import { Pagination } from '@/components/shared/pagination';
import { Panel } from '@/components/shared/panel';
import { SeverityGlyph, SeverityIndicator } from '@/components/shared/severity-badge';
import { PageSkeleton } from '@/components/shared/skeletons';
import { FindingStatusBadge } from '@/components/shared/status-badges';
import { StatusPill } from '@/components/shared/status-pill';
import { Button } from '@/components/ui/button';
import { SCENARIO_CATEGORIES } from '@/constants/scenarios';
import { useDebounce } from '@/hooks/use-debounce';
import { useFindings } from '@/hooks/use-findings';
import { formatNumber, formatTimestamp, shortId } from '@/lib/format';
import {
  FINDING_STATUS_META,
  FINDING_STATUS_ORDER,
  getEvidenceKind,
  getSeverityMeta,
  SEVERITY_ORDER,
  TONE_CLASSES,
  type Tone,
} from '@/lib/status';
import { cn, formatRelativeTime } from '@/lib/utils';
import { findingService, type FindingListParams } from '@/services/finding.service';
import type { TaintFinding } from '@/types/finding';

const PAGE_SIZE = 25;
const SORTS = ['newest', 'oldest', 'severity', 'status'] as const;
const CATEGORY_VALUES = SCENARIO_CATEGORIES.map((c) => c.value as string);

/** Only pass values the API accepts; anything else is dropped (prevents 422s from hand-edited URLs). */
function pick(value: string | null, allowed: readonly string[]): string {
  return value && allowed.includes(value) ? value : '';
}

const EVIDENCE_TONE: Record<string, Tone> = { exact: 'info', inferred: 'warning', unverified: 'neutral' };

function FindingsView() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const severity = pick(sp.get('severity'), SEVERITY_ORDER);
  const status = pick(sp.get('status'), FINDING_STATUS_ORDER);
  const category = pick(sp.get('category'), CATEGORY_VALUES);
  const sort = pick(sp.get('sort'), SORTS) || 'newest';
  const query = sp.get('q') ?? '';
  const page = Math.max(1, Number(sp.get('page')) || 1);

  const update = (patch: Record<string, string | number | null>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || (k === 'page' && v === 1) || (k === 'sort' && v === 'newest')) params.delete(k);
      else params.set(k, String(v));
    }
    if (!('page' in patch)) params.delete('page');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Search input is local for responsiveness; the debounced value is written to the URL.
  const [searchInput, setSearchInput] = useState(query);
  const debounced = useDebounce(searchInput.trim(), 300);
  useEffect(() => setSearchInput(query), [query]);
  useEffect(() => {
    if (debounced !== query) update({ q: debounced || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const baseFilters: FindingListParams = {
    status: status || undefined,
    category: category || undefined,
    search: query || undefined,
  };

  const findings = useFindings({
    ...baseFilters,
    severity: severity || undefined,
    sort,
    page,
    page_size: PAGE_SIZE,
  });

  // Exact per-severity totals under the current non-severity filters (5 requests, page_size 1).
  const severityCounts = useQueries({
    queries: SEVERITY_ORDER.map((sev) => {
      const params: FindingListParams = { ...baseFilters, severity: sev, page: 1, page_size: 1 };
      return {
        queryKey: ['findings', params],
        queryFn: () => findingService.listFindings(params),
        staleTime: 30_000,
      };
    }),
  });

  const hasFilters = !!(severity || status || category || query);

  const columns: DataTableColumn<TaintFinding>[] = useMemo(
    () => [
      {
        id: 'title',
        header: 'Finding',
        cell: (f) => (
          <div className="min-w-0 max-w-[460px]">
            <Link
              href={`/findings/${f.id}`}
              onClick={(e) => e.stopPropagation()}
              className="line-clamp-1 font-medium text-foreground hover:text-primary"
              title={f.title}
            >
              {f.title}
            </Link>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{f.description}</p>
            <p className="mt-0.5 font-mono text-[11px] text-subtle-foreground">
              {shortId(f.id)} · {f.observation_location}
            </p>
          </div>
        ),
      },
      { id: 'severity', header: 'Severity', cell: (f) => <SeverityIndicator severity={f.severity} /> },
      { id: 'category', header: 'Category', hideBelow: 'md', cell: (f) => <CategoryBadge category={f.category} /> },
      { id: 'status', header: 'Status', cell: (f) => <FindingStatusBadge status={f.status} /> },
      {
        id: 'evidence',
        header: 'Evidence',
        hideBelow: 'lg',
        cell: (f) => {
          const ev = getEvidenceKind(f.attribution_level);
          return (
            <div className="min-w-0">
              <StatusPill tone={EVIDENCE_TONE[ev.kind]} label={ev.label} variant="plain" />
              <p className="mt-0.5 font-mono text-[10px] text-subtle-foreground">{f.detection_method}</p>
            </div>
          );
        },
      },
      {
        id: 'run',
        header: 'Test run',
        hideBelow: 'xl',
        cell: (f) => (
          <Link
            href={`/test-runs/${f.test_run_id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-[12px] text-primary hover:underline"
          >
            {shortId(f.test_run_id)}
          </Link>
        ),
      },
      {
        id: 'detected',
        header: 'Detected',
        align: 'right',
        hideBelow: 'sm',
        cell: (f) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground" title={formatTimestamp(f.observed_at)}>
            {formatRelativeTime(f.observed_at || f.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldAlert}
        title="Findings"
        description="Vulnerabilities, canary exposures and policy violations detected during test executions, with evidence and triage state."
      >
        <Button variant="outline" size="sm" onClick={() => findings.refetch()} disabled={findings.isFetching}>
          <RotateCw className={cn('h-3.5 w-3.5', findings.isFetching && 'animate-spin')} /> Refresh
        </Button>
      </PageHeader>

      {/* Severity summary — doubles as a severity filter */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Filter by severity">
        {SEVERITY_ORDER.map((sev, i) => {
          const q = severityCounts[i];
          const meta = getSeverityMeta(sev);
          const active = severity === sev;
          return (
            <button
              key={sev}
              type="button"
              aria-pressed={active}
              onClick={() => update({ severity: active ? null : sev })}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-3 text-left shadow-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                active ? 'border-primary/60 bg-primary/[0.06]' : 'border-border hover:border-border-strong',
              )}
            >
              <span className={cn('flex items-center gap-2 text-xs font-medium', TONE_CLASSES[meta.tone].text)}>
                <SeverityGlyph severity={sev} />
                {meta.label}
              </span>
              <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
                {q.isLoading ? '·' : q.isError ? '—' : formatNumber(q.data?.total ?? 0)}
              </span>
            </button>
          );
        })}
      </div>

      <Panel flush>
        <FilterBar
          actions={
            <span className="text-xs tabular-nums text-muted-foreground">
              {findings.data ? `${formatNumber(findings.data.total)} findings` : ''}
            </span>
          }
        >
          <SearchInput
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onClear={() => setSearchInput('')}
            placeholder="Search title, description, category…"
            className="sm:w-72"
          />
          <FilterSelect
            label="Severity"
            value={severity}
            onChange={(v) => update({ severity: v })}
            options={SEVERITY_ORDER.map((s) => ({ value: s, label: getSeverityMeta(s).label }))}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => update({ status: v })}
            options={FINDING_STATUS_ORDER.map((s) => ({ value: s, label: FINDING_STATUS_META[s].label }))}
          />
          <FilterSelect
            label="Category"
            value={category}
            onChange={(v) => update({ category: v })}
            options={SCENARIO_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <FilterSelect
            label="Sort"
            value={sort === 'newest' ? '' : sort}
            allLabel="Newest"
            onChange={(v) => update({ sort: v || null })}
            options={[
              { value: 'oldest', label: 'Oldest' },
              { value: 'severity', label: 'Severity' },
              { value: 'status', label: 'Status' },
            ]}
          />
          <ClearFiltersButton
            visible={hasFilters}
            onClick={() => {
              setSearchInput('');
              router.replace(pathname, { scroll: false });
            }}
          />
        </FilterBar>

        <DataTable
          label="Findings"
          columns={columns}
          data={findings.data?.items}
          getRowId={(f) => f.id}
          isLoading={findings.isLoading}
          error={findings.error}
          onRetry={() => findings.refetch()}
          onRowClick={(f) => router.push(`/findings/${f.id}`)}
          skeletonRows={8}
          empty={
            hasFilters ? (
              <EmptyState
                bare
                compact
                icon={ShieldAlert}
                title="No findings match these filters"
                description="Adjust or clear the filters to widen the result set."
              />
            ) : (
              <EmptyState
                bare
                icon={ShieldCheck}
                title="No findings recorded"
                description="Findings are created when a test run observes a failed security assertion or canary exposure."
                actionText="Launch test run"
                actionHref="/test-runs/new"
              />
            )
          }
        />

        {findings.data && findings.data.total > 0 && (
          <Pagination
            page={page}
            totalPages={findings.data.total_pages}
            total={findings.data.total}
            pageSize={PAGE_SIZE}
            onPageChange={(p) => update({ page: p })}
            itemLabel="findings"
          />
        )}
      </Panel>
    </div>
  );
}

export default function FindingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FindingsView />
    </Suspense>
  );
}
