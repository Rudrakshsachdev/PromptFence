"""Schemas for the security researcher workspace overview."""

import uuid
from datetime import datetime

from pydantic import BaseModel


class RunStatusCounts(BaseModel):
    """Test executions by lifecycle state (TestRunStatus values)."""

    total: int
    by_status: dict[str, int]
    assessed_targets: int


class FindingCounts(BaseModel):
    """Findings by triage status and by severity, plus open findings per severity."""

    total: int
    by_status: dict[str, int]
    by_severity: dict[str, int]
    open_by_severity: dict[str, int]


class TargetRiskItem(BaseModel):
    """A target ranked by its recorded findings. Absence of findings is not shown as 'secure'."""

    target_id: uuid.UUID
    target_name: str
    findings: int
    open_findings: int
    critical: int
    high: int


class CategoryCount(BaseModel):
    category: str
    findings: int
    open_findings: int


class FindingStatusChange(BaseModel):
    """A recorded triage decision from the finding status history."""

    finding_id: uuid.UUID
    finding_title: str
    severity: str
    old_status: str
    new_status: str
    changed_at: datetime


class SecurityOverviewResponse(BaseModel):
    """Everything the researcher overview needs, aggregated in one request."""

    runs: RunStatusCounts
    findings: FindingCounts
    top_targets: list[TargetRiskItem]
    categories: list[CategoryCount]
    recent_status_changes: list[FindingStatusChange]
