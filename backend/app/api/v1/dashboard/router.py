"""Dashboard API router."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardActivity, DashboardDistributions, DashboardOverview
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve aggregate platform metrics and recent items for user."""
    dashboard_service = DashboardService(db)
    data = await dashboard_service.get_overview(current_user)
    return DashboardOverview(**data)


@router.get("/activity", response_model=DashboardActivity)
async def get_dashboard_activity(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve chronological audit and creation activity feed."""
    dashboard_service = DashboardService(db)
    data = await dashboard_service.get_activity(current_user)
    return DashboardActivity(**data)


@router.get("/distributions", response_model=DashboardDistributions)
async def get_dashboard_distributions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve distribution breakdowns by target type, scenario category, and severity."""
    dashboard_service = DashboardService(db)
    data = await dashboard_service.get_distributions(current_user)
    return DashboardDistributions(**data)

