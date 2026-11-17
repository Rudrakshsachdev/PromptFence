"""Security researcher workspace API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.dependencies.permissions import require_permission
from app.permissions.roles import PermissionType
from app.schemas.security import SecurityOverviewResponse
from app.services import security_service

router = APIRouter(prefix="/security", tags=["Security Workspace"])


@router.get(
    "/overview",
    response_model=SecurityOverviewResponse,
    dependencies=[Depends(require_permission(PermissionType.DASHBOARD_READ))],
)
async def get_security_overview(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SecurityOverviewResponse:
    """Posture summary for the researcher workspace, aggregated in a single request."""
    return await security_service.get_security_overview(db)
