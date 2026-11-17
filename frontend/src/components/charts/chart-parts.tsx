import React from 'react';
import { cn } from '@/lib/utils';

export interface TooltipRow {
  name: string;
  value: React.ReactNode;
  color?: string;
}

/** Tooltip card used by every chart. Text uses ink tokens; colour lives in the swatch. */
export function ChartTooltipCard({ title, rows }: { title?: React.ReactNode; rows: TooltipRow[] }) {
  return (
    <div className="min-w-[160px] rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-overlay">
      {title && <p className="mb-1.5 font-medium text-foreground">{title}</p>}
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.color && (
                <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: r.color }} />
              )}
              {r.name}
            </span>
            <span className="font-mono tabular-nums text-foreground">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface LegendItem {
  label: string;
  color: string;
  value?: React.ReactNode;
  /** Render as a line swatch (line charts) instead of a square. */
  line?: boolean;
  dashed?: boolean;
}

/** HTML legend placed above the plot (keeps text crisp and wraps on mobile). */
export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs', className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-muted-foreground">
          {i.line ? (
            <svg width="14" height="8" aria-hidden>
              <line
                x1="0"
                y1="4"
                x2="14"
                y2="4"
                stroke={i.color}
                strokeWidth="2"
                strokeDasharray={i.dashed ? '3 2' : undefined}
              />
            </svg>
          ) : (
            <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: i.color }} aria-hidden />
          )}
          <span>{i.label}</span>
          {i.value !== undefined && (
            <span className="font-mono tabular-nums text-foreground">{i.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Placeholder shown inside a chart area when the API returned no points. */
export function ChartEmpty({
  height,
  message = 'No data in this period',
  hint,
}: {
  height: number;
  message?: string;
  hint?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface/40 text-center"
      style={{ height }}
    >
      <p className="text-xs font-medium text-muted-foreground">{message}</p>
      {hint && <p className="mt-1 max-w-xs text-[11px] text-subtle-foreground">{hint}</p>}
    </div>
  );
}
