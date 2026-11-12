"""TestCase (scenario) schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.test_case import TestCaseCategory, TestCaseSeverity


class TestCaseCreate(BaseModel):
    """Create a test case / scenario."""
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    category: TestCaseCategory
    severity: TestCaseSeverity
    attack_input_template: str = Field(min_length=1)
    expected_behavior: str | None = None
    assertion_config: dict | None = None
    applicable_target_types: list[str] | None = None


class TestCaseUpdate(BaseModel):
    """Update a test case / scenario."""
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    category: TestCaseCategory | None = None
    severity: TestCaseSeverity | None = None
    attack_input_template: str | None = None
    expected_behavior: str | None = None
    assertion_config: dict | None = None
    applicable_target_types: list[str] | None = None


class TestCaseStatusUpdate(BaseModel):
    """Enable / disable a test case."""
    is_enabled: bool


class TestCaseResponse(BaseModel):
    """Test case response."""
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None = None
    category: TestCaseCategory
    severity: TestCaseSeverity
    attack_input_template: str
    expected_behavior: str | None = None
    assertion_config: dict | None = None
    applicable_target_types: list[str] | None = None
    is_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TestCaseListResponse(BaseModel):
    """Paginated test case list."""
    items: list[TestCaseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
