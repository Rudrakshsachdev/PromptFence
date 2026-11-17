'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { ChartEmpty, ChartLegend, ChartTooltipCard } from '@/components/charts/chart-parts';
import { CHART, formatChartDate, gridProps, xAxisProps, yAxisProps } from '@/components/charts/chart-theme';

export interface ColumnSeries {
  key: string;
  label: string;
  color: string;
}

/**
 * Vertical column chart for counts over time or by category. Multiple series
 * stack (part-to-whole per column) with a 2px surface gap between segments.
 */
export function ColumnChart<T extends object>({
  data,
  xKey,
  series,
  height = 220,
  stacked = true,
  xFormatter = formatChartDate,
  valueFormatter = (v: number) => String(v),
  emptyMessage,
  emptyHint,
  legendTotals = false,
}: {
  data: T[];
  xKey: keyof T & string;
  series: ColumnSeries[];
  height?: number;
  stacked?: boolean;
  xFormatter?: (value: string) => string;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  emptyHint?: string;
  /**
   * Show each series' total for the plotted range in the legend. Use it when a
   * series colour is below 3:1 on the surface, so values never rely on colour.
   */
  legendTotals?: boolean;
}) {
  if (!data.length) return <ChartEmpty height={height} message={emptyMessage} hint={emptyHint} />;

  const renderTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    return (
      <ChartTooltipCard
        title={xFormatter(String(label))}
        rows={payload.map((p) => {
          const s = series.find((x) => x.key === p.dataKey);
          return {
            name: s?.label ?? String(p.name),
            color: s?.color,
            value: typeof p.value === 'number' ? valueFormatter(p.value) : '—',
          };
        })}
      />
    );
  };

  return (
    <div>
      {series.length > 1 && (
        <ChartLegend
          className="mb-3"
          items={series.map((s) => ({
            label: s.label,
            color: s.color,
            value: legendTotals
              ? valueFormatter(
                  data.reduce((sum, row) => {
                    const v = (row as Record<string, unknown>)[s.key];
                    return sum + (typeof v === 'number' ? v : 0);
                  }, 0),
                )
              : undefined,
          }))}
        />
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={xKey} {...xAxisProps} tickFormatter={xFormatter} />
            <YAxis {...yAxisProps} allowDecimals={false} tickFormatter={(v: number) => valueFormatter(v)} />
            <Tooltip content={renderTooltip} cursor={{ fill: CHART.cursor, fillOpacity: 0.25 }} />
            {series.map((s, idx) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId={stacked ? 'stack' : undefined}
                fill={s.color}
                stroke={CHART.surface}
                strokeWidth={stacked && series.length > 1 ? 1 : 0}
                radius={!stacked || idx === series.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={36}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
