"""Pydantic schemas for test execution, canaries, events, findings, and assertions."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.execution import (
    AssertionStatus,
    AssertionType,
    AttributionLevel,
    CanaryStatus,
    EventType,
    FindingSeverity,
    TestCaseExecutionStatus,
    TestRunStatus,
)


class TestRunCreate(BaseModel):
    """Schema for launching a test run."""
    target_id: uuid.UUID = Field(..., description="ID of the target AI application/endpoint to test")
    test_suite_id: uuid.UUID = Field(..., description="ID of the test suite containing scenarios")
    canary_tainting_enabled: bool = Field(default=True, description="Enable dynamic session-bound canary tokens")
    concurrency: int = Field(default=1, ge=1, le=10, description="Parallel scenario execution limit")
    timeout_seconds: int = Field(default=30, ge=5, le=300, description="Execution timeout per scenario in seconds")


class TargetBrief(BaseModel):
    id: uuid.UUID
    name: str
    target_type: str
    base_url: str
    endpoint: str


class TestSuiteBrief(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None


class TestRunResponse(BaseModel):
    """Schema for test run details."""
    id: uuid.UUID
    target_id: uuid.UUID | None = None
    test_suite_id: uuid.UUID | None = None
    initiated_by: uuid.UUID
    status: TestRunStatus
    total_cases: int
    completed_cases: int
    passed_cases: int
    failed_cases: int
    error_cases: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    is_cancelled: bool
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime
    execution_snapshot: dict[str, Any] | None = None
    target: TargetBrief | None = None
    test_suite: TestSuiteBrief | None = None

    class Config:
        from_attributes = True


class TestRunProgressResponse(BaseModel):
    """Live progress update schema."""
    id: uuid.UUID
    status: TestRunStatus
    total_cases: int
    completed_cases: int
    passed_cases: int
    failed_cases: int
    error_cases: int
    percent_complete: float
    is_cancelled: bool
    started_at: datetime | None = None
    completed_at: datetime | None = None
    latest_event: str | None = None


class TestRunCaseResponse(BaseModel):
    """Schema for a single test case execution within a run."""
    id: uuid.UUID
    test_run_id: uuid.UUID
    scenario_id: uuid.UUID | None = None
    scenario_version: int
    scenario_snapshot: dict[str, Any] | None = None
    status: TestCaseExecutionStatus
    execution_order: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_ms: int | None = None
    normalized_request_metadata: dict[str, Any] | None = None
    normalized_response_metadata: dict[str, Any] | None = None
    error_code: str | None = None
    error_message: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class DynamicCanaryResponse(BaseModel):
    """Schema for dynamic canary token metadata."""
    id: uuid.UUID
    test_run_id: uuid.UUID
    test_run_case_id: uuid.UUID | None = None
    source_id: str
    source_type: str
    key_version: str
    status: CanaryStatus
    token_preview: str
    metadata_json: dict[str, Any] | None = None
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ExecutionEventResponse(BaseModel):
    """Schema for structured execution events."""
    id: uuid.UUID
    test_run_id: uuid.UUID
    test_run_case_id: uuid.UUID | None = None
    event_type: EventType
    level: str
    message: str
    event_metadata: dict[str, Any] | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExecutionLogResponse(BaseModel):
    """Schema for redacted execution logs."""
    id: uuid.UUID
    test_run_id: uuid.UUID
    test_run_case_id: uuid.UUID | None = None
    level: str
    message: str
    log_metadata: dict[str, Any] | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class TaintFindingResponse(BaseModel):
    """Schema for a security finding."""
    id: uuid.UUID
    test_run_id: uuid.UUID
    test_run_case_id: uuid.UUID | None = None
    canary_id: uuid.UUID | None = None
    source_id: str | None = None
    category: str
    title: str
    description: str
    severity: FindingSeverity
    confidence: str
    observation_location: str
    detection_method: str
    attribution_level: AttributionLevel
    evidence_reference: dict[str, Any] | None = None
    deduplication_key: str | None = None
    observed_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class AssertionResultResponse(BaseModel):
    """Schema for an assertion evaluation result."""
    id: uuid.UUID
    test_run_case_id: uuid.UUID
    assertion_id: str
    assertion_type: AssertionType
    status: AssertionStatus
    expected_value: str | None = None
    actual_value: str | None = None
    evidence: dict[str, Any] | None = None
    evaluated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class TargetTraceResponse(BaseModel):
    """Schema for target traces."""
    id: uuid.UUID
    test_run_id: uuid.UUID
    test_run_case_id: uuid.UUID | None = None
    source_id: str | None = None
    trace_type: str
    trace_metadata: dict[str, Any] | None = None
    evidence_reference: dict[str, Any] | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdapterInfoResponse(BaseModel):
    """Schema for supported adapter information."""
    name: str
    target_type: str
    description: str
    supported_capabilities: list[str]


class TargetHealthCheckResponse(BaseModel):
    """Schema for target connectivity probe."""
    target_id: uuid.UUID
    is_reachable: bool
    status_code: int | None = None
    latency_ms: int
    message: str
    timestamp: datetime
