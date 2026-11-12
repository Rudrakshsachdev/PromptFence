'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionChartProps {
  title: string;
  data: Record<string, number>;
  type?: 'bar' | 'pie';
}

const COLORS = [
  '#0D9488', // Teal
  '#2563EB', // Blue
  '#7C3AED', // Purple
  '#D97706', // Amber
  '#DC2626', // Red
  '#16A34A', // Green
];

export function DistributionChart({
  title,
  data,
  type = 'bar',
}: DistributionChartProps) {
  const chartData = Object.entries(data || {}).map(([key, value]) => ({
    name: key.replace(/_/g, ' '),
    rawKey: key,
    value,
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const isEmpty = chartData.length === 0 || chartData.every((d) => d.value === 0);

  return (
    <Card className="border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {title}
        </CardTitle>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          Total: {total}
        </span>
      </CardHeader>
      <CardContent className="pt-2">
        {isEmpty ? (
          <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-400">
            <span className="text-slate-300 dark:text-slate-600 text-lg mb-1">⊘</span>
            <span>No data recorded yet</span>
          </div>
        ) : type === 'pie' ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={1}
                    stroke="#ffffff"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      color: '#FFF',
                      borderRadius: '6px',
                      fontSize: '11px',
                      padding: '6px 10px',
                    }}
                    formatter={(val: number) => [`${val} items`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex-1 space-y-1.5 overflow-hidden w-full">
              {chartData.slice(0, 4).map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate capitalize">{item.name}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  interval={0}
                  tickFormatter={(val) => (val.length > 8 ? `${val.slice(0, 8)}.` : val)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 9, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    color: '#FFF',
                    borderRadius: '6px',
                    fontSize: '11px',
                    padding: '6px 10px',
                  }}
                  formatter={(val: number) => [`${val} scenarios`, 'Count']}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
