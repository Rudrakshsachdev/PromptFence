"""Findings API router."""

import math
import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.pagination import PaginationParams, get_pagination_params
from app.models.execution import FindingSeverity
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.execution import (
    FindingStatusHistoryResponse,
    FindingStatusUpdate,
    TaintFindingResponse,
)
from app.services import findings_service

router = APIRouter(prefix="/findings", tags=["Findings"])


@router.get("", response_model=PaginatedResponse[TaintFindingResponse])
async def list_all_findings(
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    category: str | None = Query(default=None),
    severity: FindingSeverity | None = Query(default=None),
    status: str | None = Query(default=None),
    test_run_id: uuid.UUID | None = Query(default=None),
    target_id: uuid.UUID | None = Query(default=None),
    detection_method: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=200),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    sort: str = Query(default="newest", pattern="^(newest|oldest|severity|status)$"),
):
    """List findings with search, filters and sorting."""
    items, total = await findings_service.list_findings(
        db, page=pagination.page, page_size=pagination.page_size, status=status,
        severity=severity, category=category, test_run_id=test_run_id, target_id=target_id,
        detection_method=detection_method, search=search,
        date_from=date_from, date_to=date_to, sort=sort,
    )
    total_pages = math.ceil(total / pagination.page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[TaintFindingResponse.model_validate(f) for f in items],
        total=total, page=pagination.page, page_size=pagination.page_size, total_pages=total_pages,
    )


@router.get("/{finding_id}", response_model=TaintFindingResponse)
async def get_finding(
    finding_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    finding = await findings_service.get_finding(db, finding_id)
    if not finding:
        raise NotFoundException(f"Finding with ID {finding_id} not found")
    return TaintFindingResponse.model_validate(finding)


@router.patch("/{finding_id}/status", response_model=TaintFindingResponse)
async def update_finding_status(
    finding_id: uuid.UUID,
    body: FindingStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    finding = await findings_service.get_finding(db, finding_id)
    if not finding:
        raise NotFoundException(f"Finding with ID {finding_id} not found")
    finding = await findings_service.change_status(
        db, finding, new_status=body.status, user_id=current_user.id,
        rationale=body.rationale, review_date=body.review_date,
    )
    return TaintFindingResponse.model_validate(finding)


@router.get("/{finding_id}/history", response_model=list[FindingStatusHistoryResponse])
async def get_finding_history(
    finding_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if not await findings_service.get_finding(db, finding_id):
        raise NotFoundException(f"Finding with ID {finding_id} not found")
    rows = await findings_service.get_history(db, finding_id)
    return [FindingStatusHistoryResponse.model_validate(r) for r in rows]
