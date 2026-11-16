import React from 'react';
import { MetaPill } from '@/components/shared/status-pill';
import {
  getAssertionStatusMeta,
  getAttributionMeta,
  getCanaryStatusMeta,
  getCaseStatusMeta,
  getExperimentStatusMeta,
  getFindingStatusMeta,
  getRegressionMeta,
  getReportStatusMeta,
  getRunStatusMeta,
} from '@/lib/status';

type Props = { status: string | null | undefined; variant?: 'pill' | 'plain'; className?: string };

/** Test run lifecycle: pending, queued, running, completed, failed, cancelled. */
export function RunStatusBadge({ status, variant, className }: Props) {
  return <MetaPill meta={getRunStatusMeta(status)} variant={variant} className={className} />;
}

/** Per-scenario execution result inside a run. */
export function CaseStatusBadge({ status, variant, className }: Props) {
  return <MetaPill meta={getCaseStatusMeta(status)} variant={variant} className={className} />;
}

export function AssertionStatusBadge({ status, variant, className }: Props) {
  return <MetaPill meta={getAssertionStatusMeta(status)} variant={variant} className={className} />;
}

/** Vulnerability triage state. */
export function FindingStatusBadge({ status, variant, className }: Props) {
  return <MetaPill meta={getFindingStatusMeta(status)} variant={variant} className={className} />;
}

/** Canary lifecycle. OBSERVED is the only state rendered as an exposure. */
export function CanaryStatusBadge({ status, variant, className }: Props) {
  return <MetaPill meta={getCanaryStatusMeta(status)} variant={variant} className={className} />;
}

/** Provenance attribution level for a finding. */
export function AttributionBadge({ status, variant, className }: Props) {
  return <MetaPill meta={getAttributionMeta(status)} variant={variant} className={className} />;
}

export function RegressionBadge({ status, variant, className }: Props) {
  return <MetaPill meta={getRegressionMeta(status)} variant={variant} className={className} />;
}

export function ReportStatusBadge({ status, variant, className }: Props) {
  return <MetaPill meta={getReportStatusMeta(status)} variant={variant} className={className} />;
}

export function ExperimentStatusBadge({ status, variant, className }: Props) {
  return <MetaPill meta={getExperimentStatusMeta(status)} variant={variant} className={className} />;
}
