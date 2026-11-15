"""Pydantic schemas for Evidence-Based Reporting."""

from datetime import datetime
from typing import Any
import uuid
from pydantic import BaseModel, Field

from app.models.phase3 import ReportFormat, ReportStatus


class ReportCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    format: ReportFormat = Field(default=ReportFormat.PDF)
    scope: dict[str, Any] = Field(
        default_factory=dict,
        description="Report scope specifying test_run_id, target_id, baseline_id, date_range, or categories",
    )


class ReportJobResponse(BaseModel):
    id: uuid.UUID
    title: str
    format: ReportFormat
    scope: dict[str, Any]
    status: ReportStatus
    artifact_path: str | None
    file_size_bytes: int | None
    content_hash: str | None
    error_message: str | None
    created_by: uuid.UUID
    created_at: datetime
    completed_at: datetime | None

    class Config:
        from_attributes = True
