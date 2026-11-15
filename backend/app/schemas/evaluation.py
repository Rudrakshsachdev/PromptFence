"""Pydantic schemas for Security-Utility Evaluation and Research Experiments."""

from datetime import datetime
from typing import Any
import uuid
from pydantic import BaseModel, Field


# ---------------------------------------------
# Security-Utility Paired Testing
# ---------------------------------------------

class PairedEvaluationItem(BaseModel):
    pair_id: str
    adversarial_case_id: uuid.UUID | None = None
    benign_case_id: uuid.UUID | None = None
    security_verdict: str  # PASSED, FAILED, INCONCLUSIVE
    utility_verdict: str   # SATISFIED, OVER_REFUSAL, TASK_FAILED, INCONCLUSIVE
    is_over_refusal: bool
    is_utility_regression: bool
    details: dict[str, Any] | None = None
    evaluated_at: datetime


class SecurityUtilitySummary(BaseModel):
    total_pairs: int
    security_pass_rate_pct: float
    benign_completion_rate_pct: float
    over_refusal_rate_pct: float
    utility_regression_rate_pct: float
    over_refusals_detected: int
    pairs: list[PairedEvaluationItem]
    methodology_notes: list[str]


# ---------------------------------------------
# Research Evaluation Experiments
# ---------------------------------------------

class ResearchMetrics(BaseModel):
    provenance_attribution_accuracy: float = Field(..., description="Correct source mappings / ground-truth attribution cases")
    precision: float = Field(..., description="True positive flagged exposures / total flagged exposures")
    recall: float = Field(..., description="True positive flagged exposures / total planted exposures in dataset")
    false_positive_rate: float = Field(..., description="Benign controls incorrectly flagged / total benign controls")
    event_completeness: float = Field(..., description="Captured execution events / expected observable events")
    execution_latency_overhead_ms: float = Field(..., description="Additional latency introduced by instrumentation")


class ExperimentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    dataset_name: str = Field(..., max_length=100)
    dataset_version: str = Field(default="1.0.0", max_length=50)
    target_id: uuid.UUID
    target_version: str = Field(default="1.0.0", max_length=50)
    canary_config: dict[str, Any] | None = None
    trace_linkage_enabled: bool = True
    ground_truth_manifest: dict[str, Any] = Field(
        ...,
        description="Manifest defining planted canaries, attack documents, and benign control IDs",
    )
    repetitions: int = Field(default=1, ge=1, le=5)


class ExperimentResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    dataset_name: str
    dataset_version: str
    target_id: uuid.UUID
    target_version: str
    canary_config: dict[str, Any] | None
    trace_linkage_enabled: bool
    ground_truth_manifest: dict[str, Any]
    status: str
    repetitions: int
    results_summary: dict[str, Any] | None
    created_by: uuid.UUID
    created_at: datetime
    completed_at: datetime | None

    class Config:
        from_attributes = True
