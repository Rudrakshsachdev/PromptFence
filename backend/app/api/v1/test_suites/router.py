"""Test suites API router."""

import math
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.pagination import PaginationParams, get_pagination_params
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.schemas.common import SuccessResponse
from app.schemas.test_suite import (
    AddScenarioRequest,
    ReorderScenariosRequest,
    TestSuiteCreate,
    TestSuiteListResponse,
    TestSuiteResponse,
    TestSuiteUpdate,
)
from app.services.test_suite_service import TestSuiteService

router = APIRouter(prefix="/test-suites", tags=["Test Suites"])


async def _get_user_roles(user: User, db: AsyncSession) -> list[str]:
    role_repo = RoleRepository(db)
    roles = await role_repo.get_user_roles(user.id)
    return [r.role.name for r in roles if r.role]


@router.get("", response_model=TestSuiteListResponse)
async def list_test_suites(
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List test suites with pagination and scenario counts."""
    suite_service = TestSuiteService(db)
    roles = await _get_user_roles(current_user, db)
    items, total = await suite_service.list_suites(
        current_user, roles, page=pagination.page, page_size=pagination.page_size
    )

    total_pages = math.ceil(total / pagination.page_size) if total > 0 else 0
    return TestSuiteListResponse(
        items=[
            TestSuiteResponse(
                id=s.id,
                owner_id=s.owner_id,
                name=s.name,
                description=s.description,
                is_active=s.is_active,
                created_at=s.created_at,
                updated_at=s.updated_at,
                scenario_count=count,
            )
            for s, count in items
        ],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=TestSuiteResponse, status_code=status.HTTP_201_CREATED)
async def create_test_suite(
    data: TestSuiteCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new test suite."""
    suite_service = TestSuiteService(db)
    suite = await suite_service.create_suite(current_user, name=data.name, description=data.description)
    return TestSuiteResponse(
        id=suite.id,
        owner_id=suite.owner_id,
        name=suite.name,
        description=suite.description,
        is_active=suite.is_active,
        created_at=suite.created_at,
        updated_at=suite.updated_at,
        scenario_count=0,
    )


@router.get("/{suite_id}", response_model=TestSuiteResponse)
async def get_test_suite(
    suite_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve test suite by ID."""
    suite_service = TestSuiteService(db)
    roles = await _get_user_roles(current_user, db)
    suite, count = await suite_service.get_suite(suite_id, current_user, roles)
    return TestSuiteResponse(
        id=suite.id,
        owner_id=suite.owner_id,
        name=suite.name,
        description=suite.description,
        is_active=suite.is_active,
        created_at=suite.created_at,
        updated_at=suite.updated_at,
        scenario_count=count,
    )


@router.patch("/{suite_id}", response_model=TestSuiteResponse)
async def update_test_suite(
    suite_id: uuid.UUID,
    data: TestSuiteUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a test suite."""
    suite_service = TestSuiteService(db)
    roles = await _get_user_roles(current_user, db)
    suite = await suite_service.update_suite(
        suite_id, current_user, roles, data.model_dump(exclude_unset=True)
    )
    _, count = await suite_service.get_suite(suite_id, current_user, roles)
    return TestSuiteResponse(
        id=suite.id,
        owner_id=suite.owner_id,
        name=suite.name,
        description=suite.description,
        is_active=suite.is_active,
        created_at=suite.created_at,
        updated_at=suite.updated_at,
        scenario_count=count,
    )


@router.delete("/{suite_id}", response_model=SuccessResponse)
async def delete_test_suite(
    suite_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a test suite."""
    suite_service = TestSuiteService(db)
    roles = await _get_user_roles(current_user, db)
    await suite_service.delete_suite(suite_id, current_user, roles)
    return SuccessResponse(message="Test suite deleted successfully")


@router.post("/{suite_id}/scenarios", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def add_scenario_to_suite(
    suite_id: uuid.UUID,
    data: AddScenarioRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Assign a scenario to a test suite."""
    suite_service = TestSuiteService(db)
    roles = await _get_user_roles(current_user, db)
    await suite_service.add_scenario(
        suite_id=suite_id,
        test_case_id=data.test_case_id,
        execution_order=data.execution_order,
        user=current_user,
        user_roles=roles,
    )
    return SuccessResponse(message="Scenario added to test suite successfully")


@router.delete("/{suite_id}/scenarios/{scenario_id}", response_model=SuccessResponse)
async def remove_scenario_from_suite(
    suite_id: uuid.UUID,
    scenario_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Remove a scenario from a test suite."""
    suite_service = TestSuiteService(db)
    roles = await _get_user_roles(current_user, db)
    await suite_service.remove_scenario(suite_id, scenario_id, current_user, roles)
    return SuccessResponse(message="Scenario removed from test suite successfully")


@router.patch("/{suite_id}/scenarios/order", response_model=SuccessResponse)
async def reorder_scenarios_in_suite(
    suite_id: uuid.UUID,
    data: ReorderScenariosRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Reorder scenarios within a test suite."""
    suite_service = TestSuiteService(db)
    roles = await _get_user_roles(current_user, db)
    await suite_service.reorder_scenarios(suite_id, data.scenario_orders, current_user, roles)
    return SuccessResponse(message="Scenarios reordered successfully")

