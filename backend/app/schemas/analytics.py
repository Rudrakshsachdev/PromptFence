"""Pydantic schemas for Advanced Security Analytics."""

from datetime import datetime
from typing import Any
import uuid
from pydantic import BaseModel, Field


class ScoreBreakdown(BaseModel):
    category: str
    weight_pct: float
    deductions: float
    findings_count: int
    cases_evaluated: int


class SecurityScoreDetail(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0, description="Overall security score normalized 0-100")
    grade: str = Field(..., description="Letter grade A+, A, B, C, D, F")
    formula_version: str = "v1.2-deterministic-weighted"
    coverage_pct: float = Field(..., description="Percentage of standard categories evaluated")
    total_eligible_cases: int
    total_findings_considered: int
    breakdown: list[ScoreBreakdown]
    limitations: list[str]


class MetricRate(BaseModel):
    rate: float = Field(..., ge=0.0, le=1.0)
    percentage: float = Field(..., ge=0.0, le=100.0)
    numerator: int
    denominator: int
    definition: str


class AnalyticsOverview(BaseModel):
    time_window_days: int
    security_score: SecurityScoreDetail
    canary_exposure_rate: MetricRate
    tool_violation_rate: MetricRate
    false_positive_rate: MetricRate
    benign_pass_rate: MetricRate
    total_test_runs: int
    total_cases_executed: int
    total_findings: int
    critical_findings: int
    high_findings: int
    active_canaries_monitored: int


class CategoryDistribution(BaseModel):
    category: str
    count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    percentage: float


class SeverityDistribution(BaseModel):
    severity: str
    count: int
    percentage: float


class StatusDistribution(BaseModel):
    status: str
    count: int
    percentage: float


class DistributionAnalytics(BaseModel):
    by_category: list[CategoryDistribution]
    by_severity: list[SeverityDistribution]
    by_status: list[StatusDistribution]
    by_attribution: dict[str, int]


class TrendPoint(BaseModel):
    date: str
    runs_count: int
    findings_count: int
    canary_exposures: int
    tool_violations: int
    security_score: float
    benign_pass_rate: float


class TrendAnalytics(BaseModel):
    granularity: str
    points: list[TrendPoint]


class TargetComparisonItem(BaseModel):
    target_id: uuid.UUID
    target_name: str
    target_type: str
    target_version: str
    runs_count: int
    cases_evaluated: int
    security_score: float
    critical_findings: int
    high_findings: int
    canary_exposure_rate: float
    tool_violation_rate: float
    coverage_sufficient: bool
    coverage_warning: str | None = None


class TargetVersionComparisonItem(BaseModel):
    target_version: str
    runs_count: int
    cases_evaluated: int
    security_score: float
    findings_count: int
    canary_exposures: int
    tool_violations: int
    benign_pass_rate: float
