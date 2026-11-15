/**
 * Security-Utility Evaluation and Research Experiments TypeScript definitions.
 */

export interface PairedEvaluationItem {
  pair_id: string;
  adversarial_case_id: string | null;
  benign_case_id: string | null;
  security_verdict: 'PASSED' | 'FAILED' | 'INCONCLUSIVE';
  utility_verdict: 'SATISFIED' | 'OVER_REFUSAL' | 'TASK_FAILED' | 'INCONCLUSIVE';
  is_over_refusal: boolean;
  is_utility_regression: boolean;
  details: Record<string, unknown> | null;
  evaluated_at: string;
}

export interface SecurityUtilitySummary {
  total_pairs: number;
  security_pass_rate_pct: number;
  benign_completion_rate_pct: number;
  over_refusal_rate_pct: number;
  utility_regression_rate_pct: number;
  over_refusals_detected: number;
  pairs: PairedEvaluationItem[];
  methodology_notes: string[];
}

export interface ResearchMetrics {
  provenance_attribution_accuracy: number;
  precision: number;
  recall: number;
  false_positive_rate: number;
  event_completeness: number;
  execution_latency_overhead_ms: number;
}

export interface ExperimentCreate {
  name: string;
  description?: string;
  dataset_name: string;
  dataset_version?: string;
  target_id: string;
  target_version?: string;
  canary_config?: Record<string, unknown>;
  trace_linkage_enabled?: boolean;
  ground_truth_manifest: Record<string, unknown>;
  repetitions?: number;
}

export interface EvaluationExperiment {
  id: string;
  name: string;
  description: string | null;
  dataset_name: string;
  dataset_version: string;
  target_id: string;
  target_version: string;
  canary_config: Record<string, unknown> | null;
  trace_linkage_enabled: boolean;
  ground_truth_manifest: Record<string, unknown>;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  repetitions: number;
  results_summary: {
    test_run_id?: string;
    total_cases_evaluated?: number;
    findings_detected?: number;
    metrics?: ResearchMetrics;
    notes?: string[];
    [key: string]: unknown;
  } | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}
