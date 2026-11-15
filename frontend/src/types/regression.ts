/**
 * Security Regression Testing TypeScript definitions.
 */

export type RegressionClassification =
  | 'NEW'
  | 'RESOLVED'
  | 'RECURRING'
  | 'UNCHANGED'
  | 'INCONCLUSIVE';

export interface SecurityBaseline {
  id: string;
  name: string;
  description: string | null;
  target_id: string;
  target_version: string;
  test_suite_id: string | null;
  source_run_id: string;
  baseline_snapshot: Record<string, unknown>;
  metrics_summary: {
    total_cases?: number;
    passed_cases?: number;
    failed_cases?: number;
    error_cases?: number;
    critical_findings?: number;
    high_findings?: number;
    total_findings?: number;
    [key: string]: unknown;
  };
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface BaselineCreate {
  name: string;
  description?: string;
  source_run_id: string;
}

export interface RegressionLaunchRequest {
  baseline_id: string;
  target_version?: string;
  concurrency?: number;
  timeout_seconds?: number;
}

export interface FindingMatchDetail {
  id: string;
  baseline_finding_id: string | null;
  comparison_finding_id: string | null;
  classification: RegressionClassification;
  fingerprint: string;
  confidence: string;
  rationale: string;
  created_at: string;
}

export interface RegressionComparison {
  id: string;
  baseline_id: string;
  baseline_name: string;
  comparison_run_id: string;
  target_id: string;
  target_version: string;
  comparison_metrics: {
    cases_diff: number;
    passed_diff: number;
    failed_diff: number;
    new_findings_count: number;
    resolved_findings_count: number;
    recurring_findings_count: number;
    inconclusive_count: number;
    baseline_findings_count: number;
    current_findings_count: number;
    [key: string]: unknown;
  };
  summary_verdict: string;
  created_by: string;
  created_at: string;
  finding_matches: FindingMatchDetail[];
}
