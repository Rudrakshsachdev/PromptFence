"""TestSuite schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class TestSuiteCreate(BaseModel):
    """Create a test suite."""
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class TestSuiteUpdate(BaseModel):
    """Update a test suite."""
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class TestSuiteResponse(BaseModel):
    """Test suite response."""
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    scenario_count: int = 0

    model_config = {"from_attributes": True}


class TestSuiteListResponse(BaseModel):
    """Paginated test suite list."""
    items: list[TestSuiteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AddScenarioRequest(BaseModel):
    """Add a scenario (test case) to a suite."""
    test_case_id: uuid.UUID
    execution_order: int = 0


class ReorderScenariosRequest(BaseModel):
    """Reorder scenarios in a suite."""
    scenario_orders: list[dict]  # [{"suite_test_case_id": uuid, "execution_order": int}]
