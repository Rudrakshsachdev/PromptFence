/**
 * Analytics TypeScript definitions for Phase 3.
 */

export interface ScoreBreakdown {
  category: string;
  weight_pct: number;
  deductions: number;
  findings_count: number;
  cases_evaluated: number;
}

export interface SecurityScoreDetail {
  score: number;
  grade: string;
  formula_version: string;
  coverage_pct: number;
  total_eligible_cases: number;
  total_findings_considered: number;
  breakdown: ScoreBreakdown[];
  limitations: string[];
}

export interface MetricRate {
  rate: number;
  percentage: number;
  numerator: number;
  denominator: number;
  definition: string;
}

export interface AnalyticsOverview {
  time_window_days: number;
  security_score: SecurityScoreDetail;
  canary_exposure_rate: MetricRate;
  tool_violation_rate: MetricRate;
  false_positive_rate: MetricRate;
  benign_pass_rate: MetricRate;
  total_test_runs: number;
  total_cases_executed: number;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  active_canaries_monitored: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  percentage: number;
}

export interface SeverityDistribution {
  severity: string;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface DistributionAnalytics {
  by_category: CategoryDistribution[];
  by_severity: SeverityDistribution[];
  by_status: StatusDistribution[];
  by_attribution: Record<string, number>;
}

export interface TrendPoint {
  date: string;
  runs_count: number;
  findings_count: number;
  canary_exposures: number;
  tool_violations: number;
  security_score: number;
  benign_pass_rate: number;
}

export interface TrendAnalytics {
  granularity: string;
  points: TrendPoint[];
}

export interface TargetComparisonItem {
  target_id: string;
  target_name: string;
  target_type: string;
  target_version: string;
  runs_count: number;
  cases_evaluated: number;
  security_score: number;
  critical_findings: number;
  high_findings: number;
  canary_exposure_rate: number;
  tool_violation_rate: number;
  coverage_sufficient: boolean;
  coverage_warning: string | null;
}

export interface TargetVersionComparisonItem {
  target_version: string;
  runs_count: number;
  cases_evaluated: number;
  security_score: number;
  findings_count: number;
  canary_exposures: number;
  tool_violations: number;
  benign_pass_rate: number;
}
