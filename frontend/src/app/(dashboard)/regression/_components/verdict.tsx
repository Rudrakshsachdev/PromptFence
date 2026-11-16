import React from 'react';
import { StatusPill } from '@/components/shared/status-pill';
import { humanize } from '@/lib/format';
import type { StatusMeta } from '@/lib/status';

/** Verdicts emitted by the backend regression service. */
export const VERDICT_META: Record<string, StatusMeta> = {
  REGRESSION_DETECTED: {
    label: 'Regression detected',
    tone: 'critical',
    description: 'New findings appeared that were absent in the baseline.',
  },
  IMPROVED: {
    label: 'Improved',
    tone: 'success',
    description: 'Baseline findings were resolved and no new findings appeared.',
  },
  STABLE_VULNERABLE: {
    label: 'Stable · vulnerable',
    tone: 'warning',
    description: 'No change versus baseline, but findings are still present.',
  },
  STABLE_SECURE: {
    label: 'Stable · secure',
    tone: 'success',
    description: 'No findings in either the baseline or the current run.',
  },
};

export function getVerdictMeta(verdict: string | null | undefined): StatusMeta {
  return (verdict && VERDICT_META[verdict]) || { label: humanize(verdict), tone: 'neutral' };
}

export function VerdictBadge({ verdict, className }: { verdict: string | null | undefined; className?: string }) {
  const meta = getVerdictMeta(verdict);
  return <StatusPill tone={meta.tone} label={meta.label} title={meta.description} className={className} />;
}
