"""Pydantic schemas for Security Regression Testing."""

from datetime import datetime
from typing import Any
import uuid
from pydantic import BaseModel, Field

from app.models.phase3 import RegressionClassification


class BaselineCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    source_run_id: uuid.UUID


class BaselineResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    target_id: uuid.UUID
    target_version: str
    test_suite_id: uuid.UUID | None
    source_run_id: uuid.UUID
    baseline_snapshot: dict[str, Any]
    metrics_summary: dict[str, Any]
    is_active: bool
    created_by: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class RegressionLaunchRequest(BaseModel):
    baseline_id: uuid.UUID
    target_version: str = Field(default="v2.0.0", max_length=50)
    concurrency: int = Field(default=2, ge=1, le=10)
    timeout_seconds: int = Field(default=30, ge=5, le=300)


class FindingMatchDetail(BaseModel):
    id: uuid.UUID
    baseline_finding_id: uuid.UUID | None
    comparison_finding_id: uuid.UUID | None
    classification: RegressionClassification
    fingerprint: str
    confidence: str
    rationale: str
    created_at: datetime
    baseline_finding: dict[str, Any] | None = None
    comparison_finding: dict[str, Any] | None = None

    class Config:
        from_attributes = True


class RegressionComparisonDetail(BaseModel):
    id: uuid.UUID
    baseline_id: uuid.UUID
    baseline_name: str
    comparison_run_id: uuid.UUID
    target_id: uuid.UUID
    target_version: str
    comparison_metrics: dict[str, Any]
    summary_verdict: str
    created_by: uuid.UUID
    created_at: datetime
    finding_matches: list[FindingMatchDetail]

    class Config:
        from_attributes = True
