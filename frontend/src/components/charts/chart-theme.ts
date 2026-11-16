/**
 * Chart theme. SVG fills cannot read Tailwind classes, so chart colours are hex.
 *
 * SERIES is a categorical palette validated (lightness band, chroma floor,
 * adjacent-pair CVD separation, normal-vision floor, ≥3:1 contrast) against the
 * card surface #111B2D. Assign in fixed order by entity, never by rank, and never
 * cycle: past 8 series fold into "Other". Status/severity colours are reserved
 * for state and are not used as series colours.
 */
export const SERIES = [
  '#3987E5', // blue
  '#D95926', // orange
  '#199E70', // aqua
  '#C98500', // yellow
  '#D55181', // magenta
  '#0CA30C', // green
  '#9085E9', // violet
  '#E66767', // red
] as const;

export const CHART = {
  surface: '#111B2D',
  grid: '#263449',
  axis: '#64748B',
  tick: '#94A3B8',
  text: '#F1F5F9',
  cursor: '#334155',
  primary: '#818CF8',
  info: '#22D3EE',
  success: '#34D399',
  warning: '#FBBF24',
  critical: '#F87171',
  neutral: '#64748B',
} as const;

/** Hex equivalents of the semantic tones in `@/lib/status`, for chart fills. */
export const TONE_HEX = {
  neutral: '#64748B',
  accent: '#818CF8',
  info: '#22D3EE',
  success: '#34D399',
  warning: '#FBBF24',
  high: '#FB923C',
  critical: '#F87171',
  low: '#60A5FA',
} as const;

export const AXIS_TICK ={ fill: CHART.tick, fontSize: 11 } as const;

/** Shared props for recessive axes. */
export const xAxisProps = {
  tick: AXIS_TICK,
  tickLine: false,
  axisLine: { stroke: CHART.grid },
  tickMargin: 8,
  minTickGap: 24,
} as const;

export const yAxisProps = {
  tick: AXIS_TICK,
  tickLine: false,
  axisLine: false,
  width: 40,
  tickMargin: 4,
} as const;

export const gridProps = {
  stroke: CHART.grid,
  strokeDasharray: '2 4',
  vertical: false,
} as const;

/** "2026-11-14" → "Nov 14" */
export function formatChartDate(value: string | number): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
