/**
 * Chart theme. SVG fills cannot read Tailwind classes, so chart colours are hex.
 *
 * SERIES is the light-surface step of the validated categorical palette (same
 * eight hues as before, re-stepped for the white card surface). Validated with
 * the dataviz palette checker against #FFFFFF: lightness band, chroma floor,
 * adjacent CVD separation (worst 9.1) and normal-vision floor (worst 19.6) pass.
 * Slots 3–5 (aqua, yellow, magenta) are below 3:1 contrast on white, so any
 * chart using them must also show values as text (legend values or labels).
 * Assign in fixed order by entity, never by rank, and never cycle: past 8
 * series fold into "Other". Status/severity colours are reserved for state.
 */
export const SERIES = [
  '#2A78D6', // blue
  '#EB6834', // orange
  '#1BAF7A', // aqua
  '#EDA100', // yellow
  '#E87BA4', // magenta
  '#008300', // green
  '#6250D6', // violet
  '#E34948', // red
] as const;

export const CHART = {
  surface: '#FFFFFF',
  grid: '#EDEDED',
  axis: '#D4D4D4',
  tick: '#737373',
  text: '#0A0A0A',
  cursor: '#D4D4D4',
  primary: '#171717',
  info: '#0E7490',
  success: '#047857',
  warning: '#B45309',
  critical: '#DC2626',
  neutral: '#737373',
} as const;

/** Hex equivalents of the semantic tones in `@/lib/status` (same values as the CSS tokens). */
export const TONE_HEX = {
  neutral: '#737373',
  accent: '#171717',
  info: '#0E7490',
  success: '#047857',
  warning: '#B45309',
  high: '#C2410C',
  critical: '#DC2626',
  low: '#2563EB',
} as const;

export const AXIS_TICK = { fill: CHART.tick, fontSize: 11 } as const;

/** Shared props for recessive axes. */
export const xAxisProps = {
  tick: AXIS_TICK,
  tickLine: false,
  axisLine: { stroke: CHART.axis },
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
