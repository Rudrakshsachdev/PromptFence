"""Analytics API router."""

from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsOverview,
    DistributionAnalytics,
    TargetComparisonItem,
    TargetVersionComparisonItem,
    TrendAnalytics,
)
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
async def get_overview(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(default=30, ge=1, le=365),
    target_id: uuid.UUID | None = Query(default=None),
    test_run_id: uuid.UUID | None = Query(default=None),
):
    """Retrieve security score, canary exposure rate, tool violation rate, and overall metrics."""
    return await analytics_service.get_overview_analytics(
        db, days=days, target_id=target_id, test_run_id=test_run_id
    )


@router.get("/distribution", response_model=DistributionAnalytics)
async def get_distribution(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(default=30, ge=1, le=365),
    target_id: uuid.UUID | None = Query(default=None),
):
    """Retrieve findings distribution grouped by category, severity, status, and attribution level."""
    return await analytics_service.get_distribution_analytics(db, days=days, target_id=target_id)


@router.get("/trends", response_model=TrendAnalytics)
async def get_trends(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(default=14, ge=3, le=90),
    target_id: uuid.UUID | None = Query(default=None),
):
    """Retrieve daily time-series trends for runs, findings, canary exposures, and security score."""
    return await analytics_service.get_trend_analytics(db, days=days, target_id=target_id)


@router.get("/targets", response_model=list[TargetComparisonItem])
async def get_target_comparisons(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Compare security performance and rates across target applications."""
    return await analytics_service.get_target_comparisons(db)


@router.get("/target-versions/{target_id}", response_model=list[TargetVersionComparisonItem])
async def get_target_version_comparisons(
    target_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Compare historical performance across versions of a specific target."""
    return await analytics_service.get_target_version_comparisons(db, target_id)
