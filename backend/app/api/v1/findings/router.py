"""Findings API router."""

import math
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.pagination import PaginationParams, get_pagination_params
from app.models.execution import FindingSeverity
from app.models.user import User
from app.repositories.execution_repository import ExecutionRepository
from app.schemas.common import PaginatedResponse
from app.schemas.execution import TaintFindingResponse

router = APIRouter(prefix="/findings", tags=["Findings"])


@router.get("", response_model=PaginatedResponse[TaintFindingResponse])
async def list_all_findings(
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    category: str | None = Query(default=None),
    severity: FindingSeverity | None = Query(default=None),
    test_run_id: uuid.UUID | None = Query(default=None),
):
    """List security findings across test executions with filtering."""
    repo = ExecutionRepository(db)
    items, total = await repo.list_findings(
        test_run_id=test_run_id,
        category=category,
        severity=severity,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    total_pages = math.ceil(total / pagination.page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[TaintFindingResponse.model_validate(f) for f in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.get("/{finding_id}", response_model=TaintFindingResponse)
async def get_finding(
    finding_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve detailed information about a security finding."""
    repo = ExecutionRepository(db)
    finding = await repo.get_finding_by_id(finding_id)
    if not finding:
        raise NotFoundException(f"Finding with ID {finding_id} not found")
    return TaintFindingResponse.model_validate(finding)
