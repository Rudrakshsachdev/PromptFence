"""Integration tests for Phase 2 end-to-end execution workflow."""

import pytest
from sqlalchemy import select

from app.core.database import async_session_factory
from app.engine.orchestrator.service import ExecutionOrchestrator
from app.models.execution import (
    TestRunStatus,
    TestCaseExecutionStatus,
)
from app.models.target import Target
from app.models.test_suite import TestSuite
from app.models.user import User
from app.repositories.execution_repository import ExecutionRepository


@pytest.mark.asyncio
async def test_end_to_end_secure_target_execution():
    """Workflow A: Execute test suite against Secure Mock Target -> All scenarios pass, no findings."""
    async with async_session_factory() as session:
        # Resolve seeded user, secure target, and test suite
        user_res = await session.execute(
            select(User).where(User.email == "researcher@promptfence.internal").limit(1)
        )
        user = user_res.scalars().first()
        assert user is not None, "Researcher user must exist in seeded DB"

        target_res = await session.execute(
            select(Target).where(Target.name == "Mock Secure Target (Guarded AI)").limit(1)
        )
        target = target_res.scalars().first()
        assert target is not None, "Mock Secure Target must exist in seeded DB"

        suite_res = await session.execute(
            select(TestSuite).where(TestSuite.name == "OWASP LLM Top 10 Suite").limit(1)
        )
        suite = suite_res.scalars().first()
        assert suite is not None, "OWASP test suite must exist in seeded DB"

        orchestrator = ExecutionOrchestrator(session)
        run = await orchestrator.create_test_run(
            initiated_by=user.id,
            target_id=target.id,
            test_suite_id=suite.id,
            canary_tainting_enabled=True,
            concurrency=1,
            timeout_seconds=10,
            auto_spawn_worker=False,
        )
        assert run.id is not None
        run_id = run.id

        # Await the execution loop directly to guarantee clean completion
        await orchestrator._background_execution_worker(run_id)

    async with async_session_factory() as session:
        repo = ExecutionRepository(session)
        final_run = await repo.get_run_by_id(run_id)
        assert final_run is not None
        assert final_run.status == TestRunStatus.COMPLETED
        assert final_run.completed_cases == final_run.total_cases
        assert final_run.passed_cases > 0
        
        # Secure target has zero security findings
        findings, count = await repo.list_findings(test_run_id=run_id)
        assert count == 0, f"Expected 0 findings on secure target, got {count}"


@pytest.mark.asyncio
async def test_end_to_end_vulnerable_target_execution():
    """Workflow B: Execute test suite against Vulnerable Mock Target -> Detects canary exposure & creates findings."""
    async with async_session_factory() as session:
        user_res = await session.execute(
            select(User).where(User.email == "researcher@promptfence.internal").limit(1)
        )
        user = user_res.scalars().first()
        assert user is not None

        target_res = await session.execute(
            select(Target).where(Target.name == "Mock Vulnerable Target (Adversarial Lab)").limit(1)
        )
        target = target_res.scalars().first()
        assert target is not None, "Mock Vulnerable Target must exist in seeded DB"

        suite_res = await session.execute(
            select(TestSuite).where(TestSuite.name == "OWASP LLM Top 10 Suite").limit(1)
        )
        suite = suite_res.scalars().first()
        assert suite is not None

        orchestrator = ExecutionOrchestrator(session)
        run = await orchestrator.create_test_run(
            initiated_by=user.id,
            target_id=target.id,
            test_suite_id=suite.id,
            canary_tainting_enabled=True,
            concurrency=1,
            timeout_seconds=10,
            auto_spawn_worker=False,
        )
        run_id = run.id

        # Await execution directly
        await orchestrator._background_execution_worker(run_id)

    async with async_session_factory() as session:
        repo = ExecutionRepository(session)
        final_run = await repo.get_run_by_id(run_id)
        assert final_run is not None
        assert final_run.status == TestRunStatus.COMPLETED
        assert final_run.failed_cases > 0

        # Verify that security findings were generated
        findings, count = await repo.list_findings(test_run_id=run_id)
        assert count > 0, "Expected security findings on vulnerable target"

        # Verify canaries were tracked
        canaries = await repo.list_canaries_for_run(run_id)
        assert len(canaries) > 0, "Expected dynamic canaries to be recorded"

