"""Targets API router."""

import math
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.pagination import PaginationParams, get_pagination_params
from app.dependencies.permissions import require_permission
from app.models.user import User
from app.permissions.roles import PermissionType
from app.repositories.role_repository import RoleRepository
from app.schemas.common import SuccessResponse
from app.schemas.target import (
    TargetCreate,
    TargetListResponse,
    TargetResponse,
    TargetStatusUpdate,
    TargetUpdate,
    TargetValidationResponse,
    TargetVersionResponse,
)
from app.services.target_service import TargetService

router = APIRouter(prefix="/targets", tags=["Targets"])


async def _get_user_roles(user: User, db: AsyncSession) -> list[str]:
    role_repo = RoleRepository(db)
    roles = await role_repo.get_user_roles(user.id)
    return [r.role.name for r in roles if r.role]


@router.get(
    "",
    response_model=TargetListResponse,
    dependencies=[Depends(require_permission(PermissionType.TARGETS_READ))],
)
async def list_targets(
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List targets with pagination."""
    target_service = TargetService(db)
    roles = await _get_user_roles(current_user, db)
    items, total = await target_service.list_targets(
        current_user, roles, page=pagination.page, page_size=pagination.page_size
    )

    total_pages = math.ceil(total / pagination.page_size) if total > 0 else 0
    return TargetListResponse(
        items=[TargetResponse.model_validate(t) for t in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.post(
    "",
    response_model=TargetResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionType.TARGETS_WRITE))],
)
async def create_target(
    data: TargetCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new target and capture initial version snapshot."""
    target_service = TargetService(db)
    target = await target_service.create_target(current_user, data.model_dump())
    return TargetResponse.model_validate(target)


@router.get(
    "/{target_id}",
    response_model=TargetResponse,
    dependencies=[Depends(require_permission(PermissionType.TARGETS_READ))],
)
async def get_target(
    target_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve a target by ID."""
    target_service = TargetService(db)
    roles = await _get_user_roles(current_user, db)
    target = await target_service.get_target(target_id, current_user, roles)
    return TargetResponse.model_validate(target)


@router.patch(
    "/{target_id}",
    response_model=TargetResponse,
    dependencies=[Depends(require_permission(PermissionType.TARGETS_WRITE))],
)
async def update_target(
    target_id: uuid.UUID,
    data: TargetUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a target and create a new version snapshot if configuration changed."""
    target_service = TargetService(db)
    roles = await _get_user_roles(current_user, db)
    target = await target_service.update_target(
        target_id, current_user, roles, data.model_dump(exclude_unset=True)
    )
    return TargetResponse.model_validate(target)


@router.delete(
    "/{target_id}",
    response_model=SuccessResponse,
    dependencies=[Depends(require_permission(PermissionType.TARGETS_DELETE))],
)
async def delete_target(
    target_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a target."""
    target_service = TargetService(db)
    roles = await _get_user_roles(current_user, db)
    await target_service.delete_target(target_id, current_user, roles)
    return SuccessResponse(message="Target deleted successfully")


@router.post(
    "/{target_id}/validate",
    response_model=TargetValidationResponse,
    dependencies=[Depends(require_permission(PermissionType.TARGETS_VALIDATE))],
)
async def validate_target_connectivity(
    target_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Validate target connectivity with SSRF protections."""
    target_service = TargetService(db)
    roles = await _get_user_roles(current_user, db)
    result = await target_service.validate_connectivity(target_id, current_user, roles)
    return TargetValidationResponse(**result)


@router.post(
    "/{target_id}/health-check",
    dependencies=[Depends(require_permission(PermissionType.TARGETS_VALIDATE))],
)
async def health_check_target(
    target_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Health check endpoint for probe validation."""
    target_service = TargetService(db)
    roles = await _get_user_roles(current_user, db)
    result = await target_service.validate_connectivity(target_id, current_user, roles)
    return {
        "target_id": str(target_id),
        "is_reachable": result.get("is_valid", False),
        "status_code": result.get("status_code", 200),
        "latency_ms": result.get("latency_ms", 0),
        "message": result.get("message", "Target checked"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get(
    "/{target_id}/versions",
    response_model=list[TargetVersionResponse],
    dependencies=[Depends(require_permission(PermissionType.TARGETS_READ))],
)
async def list_target_versions(
    target_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List historical version snapshots of a target."""
    target_service = TargetService(db)
    roles = await _get_user_roles(current_user, db)
    versions = await target_service.list_versions(target_id, current_user, roles)
    return [TargetVersionResponse.model_validate(v) for v in versions]


@router.patch(
    "/{target_id}/status",
    response_model=TargetResponse,
    dependencies=[Depends(require_permission(PermissionType.TARGETS_WRITE))],
)
async def update_target_status(
    target_id: uuid.UUID,
    data: TargetStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Enable or disable a target."""
    target_service = TargetService(db)
    roles = await _get_user_roles(current_user, db)
    target = await target_service.update_status(target_id, current_user, roles, data.is_active)
    return TargetResponse.model_validate(target)

