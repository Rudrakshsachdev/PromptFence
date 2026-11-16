'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ExternalLink, GitCompareArrows, Minus } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { ErrorState } from '@/components/shared/error-state';
import { SegmentedControl } from '@/components/shared/filter-bar';
import { IdChip } from '@/components/shared/id-chip';
import { Panel } from '@/components/shared/panel';
import { PageSkeleton } from '@/components/shared/skeletons';
import { RegressionBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import { useBaseline, useComparison } from '@/hooks/use-regression';
import { useTarget } from '@/hooks/use-targets';
import { formatNumber, humanize } from '@/lib/format';
import { REGRESSION_META, TONE_CLASSES, type Tone } from '@/lib/status';
import { cn, formatDate } from '@/lib/utils';
import type { FindingMatchDetail, RegressionClassification } from '@/types/regression';
import { getVerdictMeta, VerdictBadge } from '../_components/verdict';

const CLASSIFICATIONS: RegressionClassification[] = ['NEW', 'RESOLVED', 'RECURRING', 'UNCHANGED', 'INCONCLUSIVE'];

type Direction = 'lower-better' | 'higher-better' | 'neutral';

/** Signed change indicator. Tone follows security impact, not the sign. */
function Delta({ value, direction }: { value: number | undefined; direction: Direction }) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return <span className="text-xs text-subtle-foreground">—</span>;
  }
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-xs text-subtle-foreground">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  }
  let tone: Tone = 'neutral';
  if (direction === 'lower-better') tone = value > 0 ? 'critical' : 'success';
  if (direction === 'higher-better') tone = value > 0 ? 'success' : 'critical';
  const Icon = value > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-mono text-xs tabular-nums', TONE_CLASSES[tone].text)}>
      <Icon className="h-3 w-3" aria-hidden />
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

function MetricRow({
  label,
  value,
  delta,
  direction,
}: {
  label: string;
  value: number | undefined;
  delta?: number;
  direction?: Direction;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-3">
        {direction && <Delta value={delta} direction={direction} />}
        <span className="w-12 text-right font-mono text-[13px] tabular-nums text-foreground">
          {value === undefined ? '—' : formatNumber(value)}
        </span>
      </span>
    </div>
  );
}

export default function RegressionComparisonDetailPage() {
  const params = useParams<{ comparisonId: string }>();
  const comparisonId = params?.comparisonId || '';
  const [filter, setFilter] = useState<RegressionClassification | 'ALL'>('ALL');

  const comparison = useComparison(comparisonId);
  const baseline = useBaseline(comparison.data?.baseline_id ?? '');
  const target = useTarget(comparison.data?.target_id ?? '');

  const matches = useMemo(() => comparison.data?.finding_matches ?? [], [comparison.data]);
  const classCounts = useMemo(() => {
    const counts: Record<RegressionClassification, number> = {
      NEW: 0,
      RESOLVED: 0,
      RECURRING: 0,
      UNCHANGED: 0,
      INCONCLUSIVE: 0,
    };
    for (const m of matches) counts[m.classification] = (counts[m.classification] ?? 0) + 1;
    return counts;
  }, [matches]);
  const visibleMatches = filter === 'ALL' ? matches : matches.filter((m) => m.classification === filter);

  if (comparison.isLoading) return <PageSkeleton />;

  if (comparison.isError || !comparison.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Regression comparison" backHref="/regression" backLabel="Regression testing" />
        <ErrorState
          title="Comparison not found"
          error={comparison.error ?? 'The comparison does not exist or you do not have access to it.'}
          onRetry={() => comparison.refetch()}
        />
      </div>
    );
  }

  const c = comparison.data;
  const m = c.comparison_metrics ?? ({} as typeof c.comparison_metrics);
  const bm = baseline.data?.metrics_summary;
  const plus = (base: number | undefined, diff: number | undefined) =>
    base === undefined || diff === undefined ? undefined : base + diff;
  const verdict = getVerdictMeta(c.summary_verdict);

  const columns: DataTableColumn<FindingMatchDetail>[] = [
    {
      id: 'classification',
      header: 'Classification',
      sortValue: (r) => CLASSIFICATIONS.indexOf(r.classification),
      cell: (r) => <RegressionBadge status={r.classification} />,
    },
    {
      id: 'rationale',
      header: 'Rationale',
      cell: (r) => (
        <p className="max-w-[420px] text-xs leading-relaxed text-foreground/90">
          {r.rationale || <span className="text-subtle-foreground">No rationale recorded</span>}
        </p>
      ),
    },
    {
      id: 'fingerprint',
      header: 'Fingerprint',
      hideBelow: 'md',
      cell: (r) => <IdChip value={r.fingerprint} length={16} />,
    },
    {
      id: 'baseline',
      header: 'Baseline finding',
      hideBelow: 'lg',
      cell: (r) =>
        r.baseline_finding_id ? (
          <Link href={`/findings/${r.baseline_finding_id}`} className="font-mono text-xs text-primary hover:underline">
            {r.baseline_finding_id.slice(0, 8)}
          </Link>
        ) : (
          <span className="text-xs text-subtle-foreground">—</span>
        ),
    },
    {
      id: 'current',
      header: 'Current finding',
      hideBelow: 'sm',
      cell: (r) =>
        r.comparison_finding_id ? (
          <Link href={`/findings/${r.comparison_finding_id}`} className="font-mono text-xs text-primary hover:underline">
            {r.comparison_finding_id.slice(0, 8)}
          </Link>
        ) : (
          <span className="text-xs text-subtle-foreground">—</span>
        ),
    },
    {
      id: 'confidence',
      header: 'Confidence',
      align: 'right',
      sortValue: (r) => r.confidence,
      cell: (r) => <span className="font-mono text-xs text-muted-foreground">{humanize(r.confidence)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/regression"
        backLabel="Regression testing"
        icon={GitCompareArrows}
        title={c.baseline_name}
        badge={<VerdictBadge verdict={c.summary_verdict} />}
        description={verdict.description}
        meta={
          <>
            <HeaderMeta label="Comparison">
              <IdChip value={c.id} />
            </HeaderMeta>
            <HeaderMeta label="Target">
              {target.data ? (
                <Link href={`/targets/${c.target_id}`} className="hover:text-primary">
                  {target.data.name}
                </Link>
              ) : (
                <span className="font-mono">{c.target_id.slice(0, 8)}</span>
              )}
            </HeaderMeta>
            <HeaderMeta label="Evaluated">
              <span className="font-mono">{formatDate(c.created_at)}</span>
            </HeaderMeta>
          </>
        }
      >
        {baseline.data && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/test-runs/${baseline.data.source_run_id}`}>
              Baseline run <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        )}
        <Button asChild size="sm">
          <Link href={`/test-runs/${c.comparison_run_id}`}>
            Current run <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </PageHeader>

      {/* Side-by-side comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          title="Baseline"
          description={baseline.data ? `Created ${formatDate(baseline.data.created_at)}` : 'Reference snapshot'}
        >
          {baseline.isError ? (
            <ErrorState compact error={baseline.error} onRetry={() => baseline.refetch()} />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Version{' '}
                  <span className="font-mono text-foreground">{baseline.data?.target_version ?? '—'}</span>
                </span>
                {baseline.data && (
                  <span className="inline-flex items-center gap-1">
                    Run <IdChip value={baseline.data.source_run_id} />
                  </span>
                )}
              </div>
              <MetricRow label="Cases executed" value={bm?.total_cases} />
              <MetricRow label="Passed" value={bm?.passed_cases} />
              <MetricRow label="Failed" value={bm?.failed_cases} />
              <MetricRow label="Findings (fingerprinted)" value={m.baseline_findings_count} />
            </>
          )}
        </Panel>
        <Panel title="Current run" description="Change versus baseline">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Version <span className="font-mono text-foreground">{c.target_version || '—'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              Run <IdChip value={c.comparison_run_id} />
            </span>
          </div>
          <MetricRow label="Cases executed" value={plus(bm?.total_cases, m.cases_diff)} delta={m.cases_diff} direction="neutral" />
          <MetricRow label="Passed" value={plus(bm?.passed_cases, m.passed_diff)} delta={m.passed_diff} direction="higher-better" />
          <MetricRow label="Failed" value={plus(bm?.failed_cases, m.failed_diff)} delta={m.failed_diff} direction="lower-better" />
          <MetricRow
            label="Findings (fingerprinted)"
            value={m.current_findings_count}
            delta={
              m.current_findings_count !== undefined && m.baseline_findings_count !== undefined
                ? m.current_findings_count - m.baseline_findings_count
                : undefined
            }
            direction="lower-better"
          />
        </Panel>
      </div>

      {/* Classification summary — click to filter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CLASSIFICATIONS.map((cls) => {
          const meta = REGRESSION_META[cls];
          const active = filter === cls;
          const count = classCounts[cls];
          return (
            <button
              key={cls}
              type="button"
              onClick={() => setFilter(active ? 'ALL' : cls)}
              aria-pressed={active}
              className={cn(
                'rounded-lg border bg-card p-4 text-left shadow-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                active ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-border-strong',
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full', TONE_CLASSES[meta.tone].dot)} aria-hidden />
                <span className="eyebrow">{meta.label}</span>
              </div>
              <p
                className={cn(
                  'mt-2 text-2xl font-semibold tabular-nums',
                  count > 0 ? TONE_CLASSES[meta.tone].text : 'text-foreground',
                )}
              >
                {count}
              </p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{meta.description}</p>
            </button>
          );
        })}
      </div>

      <Panel
        title="Finding matches"
        description="Matched by deterministic SHA-256 finding fingerprint"
        flush
        actions={
          <SegmentedControl
            label="Filter by classification"
            value={filter}
            onChange={setFilter}
            className="hidden md:inline-flex"
            options={[
              { value: 'ALL', label: `All ${matches.length}` },
              ...CLASSIFICATIONS.map((cls) => ({
                value: cls,
                label: `${REGRESSION_META[cls].label} ${classCounts[cls]}`,
              })),
            ]}
          />
        }
      >
        <DataTable
          label="Finding matches"
          columns={columns}
          data={visibleMatches}
          getRowId={(r) => r.id}
          initialSort={{ id: 'classification', direction: 'asc' }}
          empty={
            <EmptyState
              bare
              compact
              icon={GitCompareArrows}
              title={filter === 'ALL' ? 'No findings in either run' : `No ${REGRESSION_META[filter].label.toLowerCase()} findings`}
              description={
                filter === 'ALL'
                  ? 'Neither the baseline nor the current run produced fingerprinted findings.'
                  : 'Select another classification to see its matches.'
              }
            />
          }
        />
      </Panel>
    </div>
  );
}
