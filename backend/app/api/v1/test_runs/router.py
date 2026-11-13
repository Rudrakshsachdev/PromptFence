"""Test Runs API router."""

import math
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.pagination import PaginationParams, get_pagination_params
from app.engine.orchestrator.service import ExecutionOrchestrator
from app.models.execution import TestRunStatus
from app.models.user import User
from app.repositories.execution_repository import ExecutionRepository
from app.schemas.common import PaginatedResponse
from app.schemas.execution import (
    AssertionResultResponse,
    DynamicCanaryResponse,
    ExecutionEventResponse,
    ExecutionLogResponse,
    TaintFindingResponse,
    TargetTraceResponse,
    TestRunCaseResponse,
    TestRunCreate,
    TestRunProgressResponse,
    TestRunResponse,
)

router = APIRouter(prefix="/test-runs", tags=["Test Runs"])


@router.post("", response_model=TestRunResponse, status_code=status.HTTP_201_CREATED)
async def create_test_run(
    payload: TestRunCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Launch an adversarial security test run against a target."""
    orchestrator = ExecutionOrchestrator(db)
    run = await orchestrator.create_test_run(
        initiated_by=current_user.id,
        target_id=payload.target_id,
        test_suite_id=payload.test_suite_id,
        canary_tainting_enabled=payload.canary_tainting_enabled,
        concurrency=payload.concurrency,
        timeout_seconds=payload.timeout_seconds,
    )
    return TestRunResponse.model_validate(run)


@router.get("", response_model=PaginatedResponse[TestRunResponse])
async def list_test_runs(
    pagination: Annotated[PaginationParams, Depends(get_pagination_params)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    target_id: uuid.UUID | None = Query(default=None),
    test_suite_id: uuid.UUID | None = Query(default=None),
    run_status: TestRunStatus | None = Query(default=None, alias="status"),
):
    """List test runs with optional filtering and pagination."""
    repo = ExecutionRepository(db)
    items, total = await repo.list_runs(
        target_id=target_id,
        test_suite_id=test_suite_id,
        status=run_status,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    total_pages = math.ceil(total / pagination.page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[TestRunResponse.model_validate(r) for r in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.get("/{run_id}", response_model=TestRunResponse)
async def get_test_run(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve detailed information about a test run."""
    repo = ExecutionRepository(db)
    run = await repo.get_run_by_id(run_id)
    if not run:
        raise NotFoundException(f"Test run {run_id} not found")
    return TestRunResponse.model_validate(run)


@router.post("/{run_id}/cancel", response_model=TestRunResponse)
async def cancel_test_run(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Cancel an active or queued test run."""
    orchestrator = ExecutionOrchestrator(db)
    run = await orchestrator.cancel_test_run(run_id)
    return TestRunResponse.model_validate(run)


@router.get("/{run_id}/progress", response_model=TestRunProgressResponse)
async def get_test_run_progress(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get live progress metrics for a test run."""
    repo = ExecutionRepository(db)
    run = await repo.get_run_by_id(run_id)
    if not run:
        raise NotFoundException(f"Test run {run_id} not found")

    events = await repo.list_events_for_run(run_id)
    latest_event = events[-1].message if events else None
    pct = (run.completed_cases / run.total_cases * 100.0) if run.total_cases > 0 else 0.0

    return TestRunProgressResponse(
        id=run.id,
        status=run.status,
        total_cases=run.total_cases,
        completed_cases=run.completed_cases,
        passed_cases=run.passed_cases,
        failed_cases=run.failed_cases,
        error_cases=run.error_cases,
        percent_complete=round(pct, 1),
        is_cancelled=run.is_cancelled,
        started_at=run.started_at,
        completed_at=run.completed_at,
        latest_event=latest_event,
    )


@router.get("/{run_id}/cases", response_model=list[TestRunCaseResponse])
async def list_cases_for_run(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List test cases associated with a run."""
    repo = ExecutionRepository(db)
    cases = await repo.list_cases_for_run(run_id)
    return [TestRunCaseResponse.model_validate(c) for c in cases]


@router.get("/{run_id}/cases/{case_id}", response_model=TestRunCaseResponse)
async def get_test_case_detail(
    run_id: uuid.UUID,
    case_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve details for a specific test case within a run."""
    repo = ExecutionRepository(db)
    case = await repo.get_case_by_id(case_id)
    if not case or case.test_run_id != run_id:
        raise NotFoundException(f"Test case {case_id} not found in run {run_id}")
    return TestRunCaseResponse.model_validate(case)


@router.get("/{run_id}/cases/{case_id}/events", response_model=list[ExecutionEventResponse])
async def list_case_events(
    run_id: uuid.UUID,
    case_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List events for a test case."""
    repo = ExecutionRepository(db)
    events = await repo.list_events_for_case(case_id)
    return [ExecutionEventResponse.model_validate(e) for e in events]


@router.get("/{run_id}/cases/{case_id}/logs", response_model=list[ExecutionLogResponse])
async def list_case_logs(
    run_id: uuid.UUID,
    case_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List redacted logs for a test case."""
    repo = ExecutionRepository(db)
    logs = await repo.list_logs_for_case(case_id)
    return [ExecutionLogResponse.model_validate(l) for l in logs]


@router.get("/{run_id}/cases/{case_id}/assertions", response_model=list[AssertionResultResponse])
async def list_case_assertions(
    run_id: uuid.UUID,
    case_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List deterministic assertion evaluation results for a test case."""
    repo = ExecutionRepository(db)
    results = await repo.list_assertions_for_case(case_id)
    return [AssertionResultResponse.model_validate(r) for r in results]


@router.get("/{run_id}/cases/{case_id}/traces", response_model=list[TargetTraceResponse])
async def list_case_traces(
    run_id: uuid.UUID,
    case_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List target execution traces for a test case."""
    repo = ExecutionRepository(db)
    traces = await repo.list_traces_for_case(case_id)
    return [TargetTraceResponse.model_validate(t) for t in traces]


@router.get("/{run_id}/findings", response_model=list[TaintFindingResponse])
async def list_findings_for_run(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List security findings identified during a run."""
    repo = ExecutionRepository(db)
    findings, _ = await repo.list_findings(test_run_id=run_id, page_size=100)
    return [TaintFindingResponse.model_validate(f) for f in findings]


@router.get("/{run_id}/canaries", response_model=list[DynamicCanaryResponse])
async def list_canaries_for_run(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List dynamic session canaries generated for a run."""
    repo = ExecutionRepository(db)
    canaries = await repo.list_canaries_for_run(run_id)
    return [DynamicCanaryResponse.model_validate(c) for c in canaries]


@router.get("/{run_id}/events", response_model=list[ExecutionEventResponse])
async def list_run_events(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all execution events for a test run."""
    repo = ExecutionRepository(db)
    events = await repo.list_events_for_run(run_id)
    return [ExecutionEventResponse.model_validate(e) for e in events]
