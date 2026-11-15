"""Regression testing and baselines API router."""

from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.user import User
from app.schemas.regression import (
    BaselineCreate,
    BaselineResponse,
    FindingMatchDetail,
    RegressionComparisonDetail,
    RegressionLaunchRequest,
)
from app.services import regression_service

router = APIRouter(prefix="/regression", tags=["Regression"])


@router.post("/baselines", response_model=BaselineResponse)
async def create_baseline(
    body: BaselineCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create an immutable security baseline snapshot from a completed test run."""
    baseline = await regression_service.create_baseline(
        db,
        name=body.name,
        description=body.description,
        source_run_id=body.source_run_id,
        user_id=current_user.id,
    )
    return baseline


@router.get("/baselines", response_model=list[BaselineResponse])
async def list_baselines(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    target_id: uuid.UUID | None = Query(default=None),
):
    """List all saved security baselines."""
    return await regression_service.list_baselines(db, target_id=target_id)


@router.get("/baselines/{baseline_id}", response_model=BaselineResponse)
async def get_baseline(
    baseline_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve details of a security baseline."""
    baseline = await regression_service.get_baseline(db, baseline_id)
    if not baseline:
        raise HTTPException(status_code=404, detail="Baseline not found")
    return baseline


@router.post("/execute", response_model=RegressionComparisonDetail)
async def execute_regression(
    body: RegressionLaunchRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Launch regression test execution against a baseline and compute comparative findings diff."""
    comparison = await regression_service.execute_regression_run(
        db,
        baseline_id=body.baseline_id,
        target_version=body.target_version,
        concurrency=body.concurrency,
        timeout_seconds=body.timeout_seconds,
        user_id=current_user.id,
    )
    # Reload full comparison
    full = await regression_service.get_comparison(db, comparison.id)
    if not full:
        raise HTTPException(status_code=500, detail="Failed to retrieve comparison result")

    return RegressionComparisonDetail(
        id=full.id,
        baseline_id=full.baseline_id,
        baseline_name=full.baseline.name,
        comparison_run_id=full.comparison_run_id,
        target_id=full.target_id,
        target_version=full.target_version,
        comparison_metrics=full.comparison_metrics,
        summary_verdict=full.summary_verdict,
        created_by=full.created_by,
        created_at=full.created_at,
        finding_matches=[FindingMatchDetail.model_validate(m) for m in full.finding_matches],
    )


@router.get("/comparisons/{comparison_id}", response_model=RegressionComparisonDetail)
async def get_comparison(
    comparison_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve full regression comparison result and finding matches."""
    full = await regression_service.get_comparison(db, comparison_id)
    if not full:
        raise HTTPException(status_code=404, detail="Comparison not found")

    return RegressionComparisonDetail(
        id=full.id,
        baseline_id=full.baseline_id,
        baseline_name=full.baseline.name,
        comparison_run_id=full.comparison_run_id,
        target_id=full.target_id,
        target_version=full.target_version,
        comparison_metrics=full.comparison_metrics,
        summary_verdict=full.summary_verdict,
        created_by=full.created_by,
        created_at=full.created_at,
        finding_matches=[FindingMatchDetail.model_validate(m) for m in full.finding_matches],
    )


@router.get("/comparisons", response_model=list[RegressionComparisonDetail])
async def list_comparisons(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    baseline_id: uuid.UUID | None = Query(default=None),
):
    """List historical regression comparisons."""
    comps = await regression_service.list_comparisons(db, baseline_id=baseline_id)
    results = []
    for c in comps:
        results.append(
            RegressionComparisonDetail(
                id=c.id,
                baseline_id=c.baseline_id,
                baseline_name=c.baseline.name if c.baseline else "Baseline",
                comparison_run_id=c.comparison_run_id,
                target_id=c.target_id,
                target_version=c.target_version,
                comparison_metrics=c.comparison_metrics,
                summary_verdict=c.summary_verdict,
                created_by=c.created_by,
                created_at=c.created_at,
                finding_matches=[],
            )
        )
    return results
