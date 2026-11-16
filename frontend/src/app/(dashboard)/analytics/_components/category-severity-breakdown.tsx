import React from 'react';
import Link from 'next/link';
import { ChartEmpty, ChartLegend } from '@/components/charts/chart-parts';
import { formatNumber, formatPercent } from '@/lib/format';
import { getCategoryLabel, getSeverityMeta, SEVERITY_HEX, SEVERITY_ORDER } from '@/lib/status';
import type { CategoryDistribution } from '@/types/analytics';
import type { FindingSeverity } from '@/types/finding';

const COUNT_KEY: Record<FindingSeverity, keyof CategoryDistribution> = {
  CRITICAL: 'critical_count',
  HIGH: 'high_count',
  MEDIUM: 'medium_count',
  LOW: 'low_count',
  INFO: 'info_count',
};

/**
 * Successful attacks per category, each bar stacked by finding severity.
 * Bar length shares one scale (largest category = full width); segments are
 * separated by a 2px surface gap and every segment has a hover title.
 */
export function CategorySeverityBreakdown({ items }: { items: CategoryDistribution[] }) {
  if (!items.length) {
    return <ChartEmpty height={160} message="No findings in this period" hint="Findings are grouped by the attack category that produced them." />;
  }
  const sorted = [...items].sort((a, b) => b.count - a.count);
  const max = Math.max(...sorted.map((i) => i.count), 1);

  return (
    <div>
      <ChartLegend
        className="mb-4"
        items={SEVERITY_ORDER.map((s) => ({ label: getSeverityMeta(s).label, color: SEVERITY_HEX[s] }))}
      />
      <ul className="space-y-3.5">
        {sorted.map((cat) => {
          const label = getCategoryLabel(cat.category);
          const segments = SEVERITY_ORDER.map((sev) => ({
            sev,
            value: Number(cat[COUNT_KEY[sev]] ?? 0),
          })).filter((s) => s.value > 0);
          return (
            <li key={cat.category}>
              <Link
                href={`/findings?category=${cat.category}`}
                className="block rounded-sm outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                  <span className="truncate text-foreground/90">{label}</span>
                  <span className="flex shrink-0 items-baseline gap-2 font-mono tabular-nums">
                    <span className="text-foreground">{formatNumber(cat.count)}</span>
                    <span className="w-12 text-right text-subtle-foreground">{formatPercent(cat.percentage, 0)}</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface">
                  <div
                    className="flex h-full gap-[2px] overflow-hidden rounded-full"
                    style={{ width: `${(cat.count / max) * 100}%`, minWidth: cat.count > 0 ? 3 : 0 }}
                    role="img"
                    aria-label={`${label}: ${segments.map((s) => `${s.value} ${getSeverityMeta(s.sev).label}`).join(', ')}`}
                  >
                    {segments.map((s) => (
                      <div
                        key={s.sev}
                        title={`${getSeverityMeta(s.sev).label}: ${s.value}`}
                        className="h-full"
                        style={{ flexGrow: s.value, flexBasis: 0, minWidth: 2, backgroundColor: SEVERITY_HEX[s.sev] }}
                      />
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
