'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { ChartEmpty, ChartLegend, ChartTooltipCard } from '@/components/charts/chart-parts';
import { CHART, formatChartDate, gridProps, xAxisProps, yAxisProps } from '@/components/charts/chart-theme';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
}

interface TrendChartProps<T extends object> {
  data: T[];
  xKey: keyof T & string;
  series: TrendSeries[];
  height?: number;
  /** `area` fills under a single series; multi-series always renders lines. */
  variant?: 'line' | 'area';
  valueFormatter?: (value: number) => string;
  yDomain?: [number | 'auto', number | 'auto'];
  xFormatter?: (value: string) => string;
  emptyMessage?: string;
  emptyHint?: string;
}

/**
 * Time-series chart. One y-axis only; measures with different scales belong in
 * separate charts. Hover shows a crosshair and all series values for the date.
 */
export function TrendChart<T extends object>({
  data,
  xKey,
  series,
  height = 220,
  variant = 'line',
  valueFormatter = (v) => String(v),
  yDomain = [0, 'auto'],
  xFormatter = formatChartDate,
  emptyMessage,
  emptyHint,
}: TrendChartProps<T>) {
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

  const common = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
  };

  const axes = (
    <>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey={xKey} {...xAxisProps} tickFormatter={xFormatter} />
      <YAxis {...yAxisProps} domain={yDomain} tickFormatter={(v: number) => valueFormatter(v)} allowDecimals={false} />
      <Tooltip content={renderTooltip} cursor={{ stroke: CHART.cursor, strokeWidth: 1 }} />
    </>
  );

  const useArea = variant === 'area' && series.length === 1;

  return (
    <div>
      {series.length > 1 && (
        <ChartLegend
          className="mb-3"
          items={series.map((s) => ({ label: s.label, color: s.color, line: true, dashed: s.dashed }))}
        />
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {useArea ? (
            <AreaChart {...common}>
              <defs>
                <linearGradient id={`fill-${series[0].key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={series[0].color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={series[0].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              {axes}
              <Area
                type="monotone"
                dataKey={series[0].key}
                name={series[0].label}
                stroke={series[0].color}
                strokeWidth={2}
                fill={`url(#fill-${series[0].key})`}
                dot={data.length === 1 ? { r: 4, fill: series[0].color, strokeWidth: 0 } : false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: CHART.surface }}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <LineChart {...common}>
              {axes}
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '4 3' : undefined}
                  dot={data.length === 1 ? { r: 4, fill: s.color, strokeWidth: 0 } : false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: CHART.surface }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
