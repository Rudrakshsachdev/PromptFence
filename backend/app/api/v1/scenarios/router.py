"""Scenarios (Test Cases) API router."""

import math
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.pagination import PaginationParams, get_pagination_params
from app.models.test_case import TestCaseCategory, TestCaseSeverity
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.schemas.common import SuccessResponse
from app.schemas.test_case import (
    TestCaseCreate,
    TestCaseListResponse,
    TestCaseResponse,
    TestCaseStatusUpdate,
    TestCaseUpdate,
)
from app.services.test_case_service import TestCaseService

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


async def _get_user_roles(user: User, db: AsyncSession) -> list[str]:
    role_repo = RoleRepository(db)
    roles = await role_repo.get_user_roles(user.id)
    return [r.role.name for r in roles if r.role]


@router.get("", response_model=TestCaseListResponse)
async def list_scenarios(
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    category: TestCaseCategory | None = Query(None, description="Filter by category"),
    severity: TestCaseSeverity | None = Query(None, description="Filter by severity"),
):
    """List scenarios with optional category/severity filtering and pagination."""
    test_case_service = TestCaseService(db)
    roles = await _get_user_roles(current_user, db)
    items, total = await test_case_service.list_test_cases(
        current_user,
        roles,
        page=pagination.page,
        page_size=pagination.page_size,
        category=category,
        severity=severity,
    )

    total_pages = math.ceil(total / pagination.page_size) if total > 0 else 0
    return TestCaseListResponse(
        items=[TestCaseResponse.model_validate(tc) for tc in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario(
    data: TestCaseCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new scenario."""
    test_case_service = TestCaseService(db)
    tc = await test_case_service.create_test_case(current_user, data.model_dump())
    return TestCaseResponse.model_validate(tc)


@router.get("/{scenario_id}", response_model=TestCaseResponse)
async def get_scenario(
    scenario_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve a scenario by ID."""
    test_case_service = TestCaseService(db)
    roles = await _get_user_roles(current_user, db)
    tc = await test_case_service.get_test_case(scenario_id, current_user, roles)
    return TestCaseResponse.model_validate(tc)


@router.patch("/{scenario_id}", response_model=TestCaseResponse)
async def update_scenario(
    scenario_id: uuid.UUID,
    data: TestCaseUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a scenario."""
    test_case_service = TestCaseService(db)
    roles = await _get_user_roles(current_user, db)
    tc = await test_case_service.update_test_case(
        scenario_id, current_user, roles, data.model_dump(exclude_unset=True)
    )
    return TestCaseResponse.model_validate(tc)


@router.delete("/{scenario_id}", response_model=SuccessResponse)
async def delete_scenario(
    scenario_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a scenario."""
    test_case_service = TestCaseService(db)
    roles = await _get_user_roles(current_user, db)
    await test_case_service.delete_test_case(scenario_id, current_user, roles)
    return SuccessResponse(message="Scenario deleted successfully")


@router.patch("/{scenario_id}/status", response_model=TestCaseResponse)
async def update_scenario_status(
    scenario_id: uuid.UUID,
    data: TestCaseStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Enable or disable a scenario."""
    test_case_service = TestCaseService(db)
    roles = await _get_user_roles(current_user, db)
    tc = await test_case_service.update_status(scenario_id, current_user, roles, data.is_enabled)
    return TestCaseResponse.model_validate(tc)


@router.post("/{scenario_id}/validate")
async def validate_scenario(
    scenario_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Validate scenario configuration for executable completeness."""
    test_case_service = TestCaseService(db)
    roles = await _get_user_roles(current_user, db)
    tc = await test_case_service.get_test_case(scenario_id, current_user, roles)
    
    issues = []
    if not tc.attack_input_template:
        issues.append("Missing attack input template")
    if not tc.name:
        issues.append("Missing scenario name")

    return {
        "scenario_id": str(scenario_id),
        "is_valid": len(issues) == 0,
        "issues": issues,
        "category": tc.category.value,
        "severity": tc.severity.value,
    }


@router.get("/{scenario_id}/capabilities")
async def get_scenario_capabilities(
    scenario_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get required capabilities for a scenario."""
    test_case_service = TestCaseService(db)
    roles = await _get_user_roles(current_user, db)
    tc = await test_case_service.get_test_case(scenario_id, current_user, roles)

    req_caps = ["CHAT_API", "COMPLETION_API"]
    if tc.category == TestCaseCategory.TOOL_EXECUTION:
        req_caps.append("TOOL_INVOCATION")
    if tc.category in (TestCaseCategory.PROMPT_INJECTION, TestCaseCategory.DATA_DISCLOSURE):
        req_caps.append("RAG_RETRIEVAL")

    return {
        "scenario_id": str(scenario_id),
        "required_capabilities": req_caps,
        "applicable_target_types": tc.applicable_target_types or ["CHAT_API", "COMPLETION_API", "AGENT_API", "CUSTOM"],
    }

