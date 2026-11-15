"""Evaluation and Research Experiments API router."""

from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.user import User
from app.schemas.evaluation import (
    ExperimentCreate,
    ExperimentResponse,
    SecurityUtilitySummary,
)
from app.services import evaluation_service

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Research"])


@router.get("/security-utility/{test_run_id}", response_model=SecurityUtilitySummary)
async def evaluate_security_utility(
    test_run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Evaluate paired adversarial vs benign control cases, detecting over-refusals and utility regressions."""
    return await evaluation_service.evaluate_security_utility_pairs(db, test_run_id=test_run_id)


@router.post("/experiments", response_model=ExperimentResponse)
async def create_experiment(
    body: ExperimentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new controlled research experiment with ground-truth manifest."""
    return await evaluation_service.create_experiment(db, data=body, user_id=current_user.id)


@router.post("/experiments/{experiment_id}/run", response_model=ExperimentResponse)
async def run_experiment(
    experiment_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Launch execution of a controlled experiment and compute the 6 research metrics."""
    return await evaluation_service.run_experiment(db, experiment_id=experiment_id, user_id=current_user.id)


@router.get("/experiments/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve details and scientific metrics for a research experiment."""
    exp = await evaluation_service.get_experiment(db, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp


@router.get("/experiments", response_model=list[ExperimentResponse])
async def list_experiments(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all research evaluation experiments."""
    return await evaluation_service.list_experiments(db)
