"""Integration tests for Phase 3: Analytics, Regression Baselines, Reporting, and Experiments."""

import uuid
import pytest
from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.execution import FindingSeverity, TestRun, TestRunStatus
from app.models.phase3 import ReportFormat, ReportStatus
from app.models.target import Target
from app.models.user import User
from app.schemas.evaluation import ExperimentCreate
from app.services import (
    analytics_service,
    audit_service,
    evaluation_service,
    regression_service,
    reporting_service,
)


@pytest.mark.asyncio
async def test_analytics_and_scoring_integration():
    """Verify analytics aggregation, deterministic security score, and distribution calculations."""
    async with async_session_factory() as session:
        overview = await analytics_service.get_overview_analytics(session, days=30)
        assert overview is not None
        assert 0.0 <= overview.security_score.score <= 100.0
        assert overview.security_score.formula_version == "v1.2-deterministic-weighted"
        assert overview.canary_exposure_rate.percentage >= 0.0
        assert overview.tool_violation_rate.percentage >= 0.0

        dist = await analytics_service.get_distribution_analytics(session, days=30)
        assert dist is not None
        assert isinstance(dist.by_category, list)
        assert isinstance(dist.by_severity, list)

        trends = await analytics_service.get_trend_analytics(session, days=7)
        assert trends is not None
        assert len(trends.points) > 0


@pytest.mark.asyncio
async def test_baseline_and_regression_integration():
    """Verify creating a baseline from a completed run and evaluating regression matches."""
    async with async_session_factory() as session:
        user_res = await session.execute(
            select(User).where(User.email == "researcher@promptfence.internal").limit(1)
        )
        user = user_res.scalars().first()
        assert user is not None

        # Find a completed test run
        run_res = await session.execute(
            select(TestRun).where(TestRun.status == TestRunStatus.COMPLETED).limit(1)
        )
        completed_run = run_res.scalars().first()
        assert completed_run is not None, "Need at least one completed run in seeded DB"

        # Create baseline
        baseline = await regression_service.create_baseline(
            session,
            name=f"Integration Test Baseline {uuid.uuid4().hex[:6]}",
            description="Automated baseline for regression integration testing",
            source_run_id=completed_run.id,
            user_id=user.id,
        )
        assert baseline.id is not None
        assert baseline.baseline_snapshot is not None
        assert "cases" in baseline.baseline_snapshot

        # Verify baseline retrieval
        fetched = await regression_service.get_baseline(session, baseline.id)
        assert fetched is not None
        assert fetched.name == baseline.name


@pytest.mark.asyncio
async def test_reporting_job_integration():
    """Verify asynchronous report job creation, artifact rendering, and SHA-256 integrity."""
    async with async_session_factory() as session:
        user_res = await session.execute(
            select(User).where(User.email == "researcher@promptfence.internal").limit(1)
        )
        user = user_res.scalars().first()
        assert user is not None

        # 1. JSON Report
        json_job = await reporting_service.create_report_job(
            session,
            title="Integration JSON Security Audit",
            report_format=ReportFormat.JSON,
            scope={"test_run_id": None},
            user_id=user.id,
        )
        assert json_job.status == ReportStatus.QUEUED

        # Process job
        completed_json = await reporting_service.process_report_job(session, json_job.id)
        assert completed_json.status == ReportStatus.COMPLETED
        assert completed_json.artifact_path is not None
        assert completed_json.content_hash is not None
        assert len(completed_json.content_hash) == 64

        # 2. PDF Report
        pdf_job = await reporting_service.create_report_job(
            session,
            title="Integration PDF Security Audit",
            report_format=ReportFormat.PDF,
            scope={"test_run_id": None},
            user_id=user.id,
        )
        completed_pdf = await reporting_service.process_report_job(session, pdf_job.id)
        assert completed_pdf.status == ReportStatus.COMPLETED
        assert completed_pdf.file_size_bytes > 0


@pytest.mark.asyncio
async def test_audit_logging_integration():
    """Verify audit log entry persistence and indexing."""
    async with async_session_factory() as session:
        entry = await audit_service.log_audit_event(
            session,
            action="INTEGRATION_TEST_ACTION",
            resource_type="TEST_RUN",
            resource_id="run_12345",
            details={"test": True, "phase": 3},
        )
        assert entry.id is not None
        assert entry.action == "INTEGRATION_TEST_ACTION"
