import React from 'react';
import { cn } from '@/lib/utils';

const VIEW_W = 100;
const VIEW_H = 32;
const PAD_TOP = 3;

/**
 * Minimal trend line for metric cards. Decorative next to the card's number
 * (hidden from assistive tech, which reads the value and subtitle); the
 * `summary` is shown as a native tooltip on hover. Renders nothing for fewer
 * than two points, so a single day never draws a misleading flat line.
 */
export function Sparkline({
  values,
  color,
  summary,
  height = 32,
  className,
}: {
  values: number[];
  color: string;
  summary: string;
  height?: number;
  className?: string;
}) {
  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const step = VIEW_W / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(2)},${(VIEW_H - (v / max) * (VIEW_H - PAD_TOP)).toFixed(2)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden
      data-testid="sparkline"
      className={cn('block w-full overflow-visible', className)}
      style={{ height }}
    >
      <title>{summary}</title>
      <polygon points={`0,${VIEW_H} ${points} ${VIEW_W},${VIEW_H}`} fill={color} fillOpacity={0.1} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
