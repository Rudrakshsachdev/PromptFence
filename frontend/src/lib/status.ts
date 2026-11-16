/**
 * Single source of truth for how domain enums are presented: label + tone.
 * Tones map onto the semantic colour tokens in globals.css. Status colours are
 * reserved for state and always render with a text label (never colour alone).
 */
import type { AttributionLevel, FindingSeverity, FindingStatus } from '@/types/finding';
import type { RegressionClassification } from '@/types/regression';
import type { ReportFormat, ReportStatus } from '@/types/report';
import type {
  AssertionStatus,
  CanaryStatus,
  TestCaseExecutionStatus,
  TestRunStatus,
} from '@/types/test-run';
import type { TargetType } from '@/types/target';
import { humanize } from '@/lib/format';

export type Tone =
  | 'neutral'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'high'
  | 'critical'
  | 'low';

export interface StatusMeta {
  label: string;
  tone: Tone;
  /** Live/in-progress states animate their dot. */
  live?: boolean;
  description?: string;
}

/** Tailwind classes per tone. Kept as literal strings so Tailwind's JIT sees them. */
export const TONE_CLASSES: Record<Tone, { text: string; dot: string; pill: string; bar: string; soft: string }> = {
  neutral: {
    text: 'text-muted-foreground',
    dot: 'bg-subtle-foreground',
    pill: 'border-border bg-surface text-muted-foreground',
    bar: 'bg-subtle-foreground',
    soft: 'bg-surface',
  },
  accent: {
    text: 'text-primary',
    dot: 'bg-primary',
    pill: 'border-primary/25 bg-primary/10 text-primary',
    bar: 'bg-primary',
    soft: 'bg-primary/10',
  },
  info: {
    text: 'text-info',
    dot: 'bg-info',
    pill: 'border-info/25 bg-info/10 text-info',
    bar: 'bg-info',
    soft: 'bg-info/10',
  },
  success: {
    text: 'text-success',
    dot: 'bg-success',
    pill: 'border-success/25 bg-success/10 text-success',
    bar: 'bg-success',
    soft: 'bg-success/10',
  },
  warning: {
    text: 'text-warning',
    dot: 'bg-warning',
    pill: 'border-warning/25 bg-warning/10 text-warning',
    bar: 'bg-warning',
    soft: 'bg-warning/10',
  },
  high: {
    text: 'text-high',
    dot: 'bg-high',
    pill: 'border-high/25 bg-high/10 text-high',
    bar: 'bg-high',
    soft: 'bg-high/10',
  },
  critical: {
    text: 'text-critical',
    dot: 'bg-critical',
    pill: 'border-critical/30 bg-critical/10 text-critical',
    bar: 'bg-critical',
    soft: 'bg-critical/10',
  },
  low: {
    text: 'text-low',
    dot: 'bg-low',
    pill: 'border-low/25 bg-low/10 text-low',
    bar: 'bg-low',
    soft: 'bg-low/10',
  },
};

function lookup<K extends string>(map: Record<K, StatusMeta>, value: string | null | undefined): StatusMeta {
  if (value && value in map) return map[value as K];
  return { label: humanize(value), tone: 'neutral' };
}

// ── Severity ────────────────────────────────────────────────────────────────

export const SEVERITY_ORDER: FindingSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export const SEVERITY_META: Record<FindingSeverity, StatusMeta> = {
  CRITICAL: { label: 'Critical', tone: 'critical' },
  HIGH: { label: 'High', tone: 'high' },
  MEDIUM: { label: 'Medium', tone: 'warning' },
  LOW: { label: 'Low', tone: 'low' },
  INFO: { label: 'Informational', tone: 'neutral' },
};
export const getSeverityMeta = (v: string | null | undefined) => lookup(SEVERITY_META, v);

/** Hex values for charts (SVG fills cannot use Tailwind classes). Matches tokens. */
export const SEVERITY_HEX: Record<FindingSeverity, string> = {
  CRITICAL: '#F87171',
  HIGH: '#FB923C',
  MEDIUM: '#FBBF24',
  LOW: '#60A5FA',
  INFO: '#64748B',
};

// ── Categories ──────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  PROMPT_INJECTION: 'Prompt Injection',
  DATA_DISCLOSURE: 'Data Disclosure',
  TOOL_EXECUTION: 'Tool Execution',
  INSTRUCTION_CONFLICT: 'Instruction Conflict',
  REGRESSION: 'Regression',
};
export const getCategoryLabel = (v: string | null | undefined) =>
  (v && CATEGORY_LABELS[v]) || humanize(v);

// ── Targets ─────────────────────────────────────────────────────────────────

export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  CHAT_API: 'Chat API',
  COMPLETION_API: 'Completion API',
  AGENT_API: 'Agent API',
  CUSTOM: 'Custom HTTP',
};
export const getTargetTypeLabel = (v: string | null | undefined) =>
  (v && TARGET_TYPE_LABELS[v as TargetType]) || humanize(v);

// ── Test runs & cases ───────────────────────────────────────────────────────

export const RUN_STATUS_META: Record<TestRunStatus, StatusMeta> = {
  PENDING: { label: 'Pending', tone: 'neutral' },
  QUEUED: { label: 'Queued', tone: 'neutral' },
  RUNNING: { label: 'Running', tone: 'info', live: true },
  COMPLETED: { label: 'Completed', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'critical' },
  CANCELLED: { label: 'Cancelled', tone: 'warning' },
};
export const getRunStatusMeta = (v: string | null | undefined) => lookup(RUN_STATUS_META, v);
export const TERMINAL_RUN_STATUSES: TestRunStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED'];
export const isRunTerminal = (s: string | null | undefined) =>
  !!s && (TERMINAL_RUN_STATUSES as string[]).includes(s);

export const CASE_STATUS_META: Record<TestCaseExecutionStatus, StatusMeta> = {
  PENDING: { label: 'Pending', tone: 'neutral' },
  RUNNING: { label: 'Running', tone: 'info', live: true },
  PASSED: { label: 'Passed', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'critical' },
  ERROR: { label: 'Error', tone: 'warning' },
  SKIPPED: { label: 'Skipped', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};
export const getCaseStatusMeta = (v: string | null | undefined) => lookup(CASE_STATUS_META, v);

export const ASSERTION_STATUS_META: Record<AssertionStatus, StatusMeta> = {
  PASSED: { label: 'Passed', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'critical' },
  ERROR: { label: 'Error', tone: 'warning' },
  SKIPPED: { label: 'Skipped', tone: 'neutral' },
};
export const getAssertionStatusMeta = (v: string | null | undefined) =>
  lookup(ASSERTION_STATUS_META, v);

// ── Canaries & provenance ───────────────────────────────────────────────────

export const CANARY_STATUS_META: Record<CanaryStatus, StatusMeta> = {
  ACTIVE: {
    label: 'Active',
    tone: 'info',
    description: 'Token generated and armed. Not observed in any target output.',
  },
  OBSERVED: {
    label: 'Exposed',
    tone: 'critical',
    description: 'Exact token observed in target output (response or tool call).',
  },
  EXPIRED: {
    label: 'Expired',
    tone: 'neutral',
    description: 'Token reached its expiry without being observed.',
  },
  REVOKED: { label: 'Revoked', tone: 'neutral', description: 'Token was revoked.' },
};
export const getCanaryStatusMeta = (v: string | null | undefined) => lookup(CANARY_STATUS_META, v);

export const ATTRIBUTION_META: Record<AttributionLevel, StatusMeta> = {
  CONFIRMED_SOURCE_MATCH: {
    label: 'Confirmed source match',
    tone: 'info',
    description: 'Exact canary token observed, HMAC-verified, and linked to its instrumented source.',
  },
  OBSERVED_CANARY: {
    label: 'Observed canary',
    tone: 'info',
    description: 'Exact canary token observed in output and HMAC-verified.',
  },
  TRACE_CORRELATED: {
    label: 'Trace correlated',
    tone: 'accent',
    description: 'Verified token correlated with target-side traces (tool or retrieval).',
  },
  INFERRED: {
    label: 'Inferred',
    tone: 'warning',
    description: 'Leakage inferred from indirect evidence. No exact token match.',
  },
  UNATTRIBUTED: {
    label: 'Unattributed',
    tone: 'neutral',
    description: 'Evidence could not be cryptographically verified against this run.',
  },
};
export const getAttributionMeta = (v: string | null | undefined) => lookup(ATTRIBUTION_META, v);

export type EvidenceKind = 'exact' | 'inferred' | 'unverified';

/**
 * Classifies attribution into exact-token vs inferred evidence. The backend only
 * assigns CONFIRMED_SOURCE_MATCH / OBSERVED_CANARY / TRACE_CORRELATED after a
 * successful HMAC verification; an unverified token is downgraded to UNATTRIBUTED.
 */
export function getEvidenceKind(level: string | null | undefined): {
  kind: EvidenceKind;
  hmacVerified: boolean | null;
  label: string;
} {
  switch (level) {
    case 'CONFIRMED_SOURCE_MATCH':
    case 'OBSERVED_CANARY':
    case 'TRACE_CORRELATED':
      return { kind: 'exact', hmacVerified: true, label: 'Exact token match' };
    case 'INFERRED':
      return { kind: 'inferred', hmacVerified: null, label: 'Inferred leakage' };
    case 'UNATTRIBUTED':
      return { kind: 'unverified', hmacVerified: false, label: 'Unverified' };
    default:
      return { kind: 'unverified', hmacVerified: null, label: 'Unknown' };
  }
}

// ── Findings ────────────────────────────────────────────────────────────────

export const FINDING_STATUS_ORDER: FindingStatus[] = [
  'OPEN',
  'ACKNOWLEDGED',
  'RESOLVED',
  'FALSE_POSITIVE',
  'ACCEPTED_RISK',
];

export const FINDING_STATUS_META: Record<FindingStatus, StatusMeta> = {
  OPEN: { label: 'Open', tone: 'warning' },
  ACKNOWLEDGED: { label: 'Acknowledged', tone: 'info' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
  FALSE_POSITIVE: { label: 'False positive', tone: 'neutral' },
  ACCEPTED_RISK: { label: 'Accepted risk', tone: 'accent' },
};
export const getFindingStatusMeta = (v: string | null | undefined) =>
  lookup(FINDING_STATUS_META, v);

// ── Regression ──────────────────────────────────────────────────────────────

export const REGRESSION_META: Record<RegressionClassification, StatusMeta> = {
  NEW: { label: 'New', tone: 'critical', description: 'Present now, absent in the baseline.' },
  RESOLVED: { label: 'Resolved', tone: 'success', description: 'In the baseline, absent now.' },
  RECURRING: { label: 'Recurring', tone: 'warning', description: 'Present in both runs.' },
  UNCHANGED: { label: 'Unchanged', tone: 'neutral', description: 'No material change.' },
  INCONCLUSIVE: {
    label: 'Inconclusive',
    tone: 'accent',
    description: 'Could not be matched with confidence.',
  },
};
export const getRegressionMeta = (v: string | null | undefined) => lookup(REGRESSION_META, v);

// ── Reports & experiments ───────────────────────────────────────────────────

export const REPORT_STATUS_META: Record<ReportStatus, StatusMeta> = {
  QUEUED: { label: 'Queued', tone: 'neutral' },
  RUNNING: { label: 'Generating', tone: 'info', live: true },
  COMPLETED: { label: 'Ready', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'critical' },
};
export const getReportStatusMeta = (v: string | null | undefined) => lookup(REPORT_STATUS_META, v);

export const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  PDF: 'PDF report',
  JSON: 'JSON evidence bundle',
  CSV_FINDINGS: 'CSV · Findings',
  CSV_CASES: 'CSV · Test cases',
  CSV_ASSERTIONS: 'CSV · Assertions',
  CSV_METRICS: 'CSV · Metrics',
};

export const EXPERIMENT_STATUS_META: Record<'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED', StatusMeta> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  RUNNING: { label: 'Running', tone: 'info', live: true },
  COMPLETED: { label: 'Completed', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'critical' },
};
export const getExperimentStatusMeta = (v: string | null | undefined) =>
  lookup(EXPERIMENT_STATUS_META, v);
