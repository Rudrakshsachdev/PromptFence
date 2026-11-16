import { formatNumber, formatRatio } from '@/lib/format';
import type { ResearchMetrics } from '@/types/evaluation';

export interface MetricDefinition {
  key: keyof ResearchMetrics;
  label: string;
  description: string;
  /** Whether a higher value is better (used to mark the best value in comparisons). */
  higherIsBetter: boolean;
  format: (value: number) => string;
}

/** The six formal research metrics computed by an experiment run. Ratios are 0–1. */
export const RESEARCH_METRICS: MetricDefinition[] = [
  {
    key: 'provenance_attribution_accuracy',
    label: 'Attribution accuracy',
    description: 'Leaks attributed to the correct instrumented source.',
    higherIsBetter: true,
    format: (v) => formatRatio(v),
  },
  {
    key: 'precision',
    label: 'Precision',
    description: 'True positives / all detections.',
    higherIsBetter: true,
    format: (v) => formatRatio(v),
  },
  {
    key: 'recall',
    label: 'Recall',
    description: 'True positives / ground-truth leaks.',
    higherIsBetter: true,
    format: (v) => formatRatio(v),
  },
  {
    key: 'false_positive_rate',
    label: 'False-positive rate',
    description: 'Spurious taint flags on benign controls.',
    higherIsBetter: false,
    format: (v) => formatRatio(v),
  },
  {
    key: 'event_completeness',
    label: 'Event completeness',
    description: 'Expected lifecycle events actually recorded.',
    higherIsBetter: true,
    format: (v) => formatRatio(v),
  },
  {
    key: 'execution_latency_overhead_ms',
    label: 'Latency overhead',
    description: 'Added cost of canary generation and trace correlation.',
    higherIsBetter: false,
    format: (v) => `${formatNumber(v, 1)} ms`,
  },
];

/** Returns metrics only if every value is a finite number; otherwise null (not measured). */
export function readMetrics(metrics: Partial<ResearchMetrics> | null | undefined): Partial<ResearchMetrics> | null {
  if (!metrics || typeof metrics !== 'object') return null;
  const out: Partial<ResearchMetrics> = {};
  let any = false;
  for (const def of RESEARCH_METRICS) {
    const v = metrics[def.key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[def.key] = v;
      any = true;
    }
  }
  return any ? out : null;
}
