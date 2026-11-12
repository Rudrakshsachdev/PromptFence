"""Target-related schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl

from app.models.target import AuthenticationType, TargetType


class TargetCreate(BaseModel):
    """Create a target."""
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    target_type: TargetType
    base_url: str = Field(max_length=2048)
    endpoint: str = Field(max_length=2048)
    http_method: str = Field(default="GET", max_length=10)
    authentication_type: AuthenticationType = AuthenticationType.NONE
    headers_config: dict | None = None
    request_template: dict | None = None
    expected_response_format: str | None = None
    timeout_seconds: int = Field(default=30, ge=1, le=300)


class TargetUpdate(BaseModel):
    """Update a target."""
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    target_type: TargetType | None = None
    base_url: str | None = Field(None, max_length=2048)
    endpoint: str | None = Field(None, max_length=2048)
    http_method: str | None = Field(None, max_length=10)
    authentication_type: AuthenticationType | None = None
    headers_config: dict | None = None
    request_template: dict | None = None
    expected_response_format: str | None = None
    timeout_seconds: int | None = Field(None, ge=1, le=300)


class TargetStatusUpdate(BaseModel):
    """Update target active status."""
    is_active: bool


class TargetResponse(BaseModel):
    """Target response."""
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None = None
    target_type: TargetType
    base_url: str
    endpoint: str
    http_method: str
    authentication_type: AuthenticationType
    headers_config: dict | None = None
    request_template: dict | None = None
    expected_response_format: str | None = None
    timeout_seconds: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TargetListResponse(BaseModel):
    """Paginated target list."""
    items: list[TargetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TargetValidationResponse(BaseModel):
    """Result of validating target connectivity."""
    reachable: bool
    status_code: int | None = None
    response_time_ms: float | None = None
    error: str | None = None


class TargetVersionResponse(BaseModel):
    """Target version snapshot."""
    id: uuid.UUID
    target_id: uuid.UUID
    version_number: int
    configuration_snapshot: dict
    created_at: datetime

    model_config = {"from_attributes": True}
