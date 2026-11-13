"""Execution Orchestrator service: manages run lifecycle, asynchronous scheduling, progress, and cancellation."""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import async_session_factory
from app.core.exceptions import ConflictException, NotFoundException, ValidationException
from app.engine.scenarios.executor import ScenarioExecutor
from app.models.execution import (
    EventType,
    TestCaseExecutionStatus,
    TestRun,
    TestRunCase,
    TestRunStatus,
)
from app.models.target import Target
from app.models.test_case import SuiteTestCase, TestCase
from app.models.test_suite import TestSuite
from app.repositories.execution_repository import ExecutionRepository

logger = logging.getLogger(__name__)


class ExecutionOrchestrator:
    """Manages the creation, asynchronous background execution, progress, and cancellation of security test runs."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ExecutionRepository(db)

    async def create_test_run(
        self,
        *,
        initiated_by: uuid.UUID,
        target_id: uuid.UUID,
        test_suite_id: uuid.UUID,
        canary_tainting_enabled: bool = True,
        concurrency: int = 1,
        timeout_seconds: int = 30,
        auto_spawn_worker: bool = True,
    ) -> TestRun:
        """Validate target and suite, create immutable execution snapshots, enqueue the run, and trigger background worker."""
        # 1. Validate Target
        target_res = await self.db.execute(select(Target).where(Target.id == target_id))
        target = target_res.scalar_one_or_none()
        if not target:
            raise NotFoundException(f"Target with ID {target_id} not found")
        if not target.is_active:
            raise ValidationException("Cannot execute test run against inactive target")

        # 2. Validate Test Suite and Scenarios
        suite_res = await self.db.execute(
            select(TestSuite)
            .where(TestSuite.id == test_suite_id)
            .options(
                selectinload(TestSuite.suite_test_cases).selectinload(SuiteTestCase.test_case)
            )
        )
        suite = suite_res.scalar_one_or_none()
        if not suite:
            raise NotFoundException(f"Test Suite with ID {test_suite_id} not found")

        assigned_cases = [
            stc for stc in suite.suite_test_cases if stc.test_case and stc.test_case.is_enabled
        ]
        if not assigned_cases:
            raise ValidationException("Selected test suite contains no enabled test scenarios to execute")

        # 3. Create Immutable Snapshots
        target_snapshot = {
            "id": str(target.id),
            "name": target.name,
            "target_type": target.target_type.value,
            "base_url": target.base_url,
            "endpoint": target.endpoint,
            "http_method": target.http_method,
            "authentication_type": target.authentication_type.value,
            "headers_config": target.headers_config or {},
            "request_template": target.request_template or {},
            "timeout_seconds": target.timeout_seconds,
        }

        execution_snapshot = {
            "target": target_snapshot,
            "test_suite": {
                "id": str(suite.id),
                "name": suite.name,
                "description": suite.description,
            },
            "parameters": {
                "canary_tainting_enabled": canary_tainting_enabled,
                "concurrency": concurrency,
                "timeout_seconds": timeout_seconds,
            },
            "scenarios_count": len(assigned_cases),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # 4. Create TestRun record
        test_run = await self.repo.create_run(
            target_id=target.id,
            test_suite_id=suite.id,
            initiated_by=initiated_by,
            total_cases=len(assigned_cases),
            execution_snapshot=execution_snapshot,
        )

        # 5. Create TestRunCase records
        for idx, stc in enumerate(assigned_cases):
            tc = stc.test_case
            tc_snapshot = {
                "id": str(tc.id),
                "name": tc.name,
                "description": tc.description,
                "category": tc.category.value,
                "severity": tc.severity.value,
                "attack_input_template": tc.attack_input_template,
                "expected_behavior": tc.expected_behavior,
                "assertion_config": tc.assertion_config or {},
                "applicable_target_types": tc.applicable_target_types or [],
            }
            await self.repo.create_run_case(
                test_run_id=test_run.id,
                scenario_id=tc.id,
                scenario_version=1,
                scenario_snapshot=tc_snapshot,
                execution_order=stc.execution_order or (idx + 1),
            )

        # 6. Record Events
        await self.repo.record_event(
            test_run_id=test_run.id,
            event_type=EventType.RUN_CREATED,
            message=f"Created test run with {len(assigned_cases)} scenarios for target '{target.name}'",
        )
        await self.repo.record_event(
            test_run_id=test_run.id,
            event_type=EventType.RUN_QUEUED,
            message="Test run enqueued for background execution",
        )

        await self.repo.update_run(test_run, status=TestRunStatus.QUEUED)
        await self.db.commit()

        # 7. Asynchronously launch background execution worker
        if auto_spawn_worker:
            asyncio.create_task(self._background_execution_worker(test_run.id))

        return test_run

    async def cancel_test_run(self, run_id: uuid.UUID) -> TestRun:
        """Cancel an ongoing or queued test run."""
        run = await self.repo.get_run_by_id(run_id)
        if not run:
            raise NotFoundException(f"Test run {run_id} not found")

        terminal_states = (TestRunStatus.COMPLETED, TestRunStatus.FAILED, TestRunStatus.CANCELLED)
        if run.status in terminal_states:
            raise ConflictException(f"Cannot cancel test run in terminal state '{run.status.value}'")

        await self.repo.update_run(run, is_cancelled=True)
        await self.repo.record_event(
            test_run_id=run.id,
            event_type=EventType.RUN_CANCELLED,
            message="Cancellation signal received. Terminating remaining scenarios.",
            level="WARNING",
        )

        # If it was queued or pending, mark as cancelled immediately
        if run.status in (TestRunStatus.PENDING, TestRunStatus.QUEUED):
            await self.repo.update_run(
                run,
                status=TestRunStatus.CANCELLED,
                completed_at=datetime.now(timezone.utc),
            )

        await self.db.commit()
        return run

    async def _background_execution_worker(self, run_id: uuid.UUID) -> None:
        """Independent background worker running the test suite cases with its own DB session."""
        if not async_session_factory:
            logger.error("No async session factory available for background worker")
            return

        async with async_session_factory() as session:
            repo = ExecutionRepository(session)
            run = await repo.get_run_by_id(run_id)
            if not run:
                logger.error("Background worker could not locate run %s", run_id)
                return

            # Check if cancelled before starting
            if run.is_cancelled:
                await repo.update_run(
                    run,
                    status=TestRunStatus.CANCELLED,
                    completed_at=datetime.now(timezone.utc),
                )
                await session.commit()
                return

            # Start Run
            now = datetime.now(timezone.utc)
            await repo.update_run(run, status=TestRunStatus.RUNNING, started_at=now)
            await repo.record_event(
                test_run_id=run.id,
                event_type=EventType.RUN_STARTED,
                message="Execution worker started processing test cases",
            )
            await session.commit()

            cases = await repo.list_cases_for_run(run.id)
            snapshot = run.execution_snapshot or {}
            target_config = snapshot.get("target") or {}
            parameters = snapshot.get("parameters") or {}
            canary_enabled = parameters.get("canary_tainting_enabled", True)
            timeout_seconds = parameters.get("timeout_seconds", 30)

            passed_count = 0
            failed_count = 0
            error_count = 0
            completed_count = 0

            executor = ScenarioExecutor(session)

            for case in cases:
                # Check cancellation between cases
                current_run = await repo.get_run_by_id(run_id)
                if current_run and current_run.is_cancelled:
                    await repo.update_case(case, status=TestCaseExecutionStatus.CANCELLED)
                    await session.commit()
                    continue

                try:
                    case_status = await executor.execute_case(
                        test_run_id=run.id,
                        case=case,
                        target_config=target_config,
                        canary_tainting_enabled=canary_enabled,
                        timeout_seconds=timeout_seconds,
                    )
                    completed_count += 1
                    if case_status == TestCaseExecutionStatus.PASSED:
                        passed_count += 1
                    elif case_status == TestCaseExecutionStatus.FAILED:
                        failed_count += 1
                    elif case_status == TestCaseExecutionStatus.ERROR:
                        error_count += 1
                except Exception as e:
                    logger.exception("Error executing test case %s: %s", case.id, e)
                    completed_count += 1
                    error_count += 1
                    await repo.update_case(
                        case,
                        status=TestCaseExecutionStatus.ERROR,
                        error_message=str(e),
                    )

                # Persist progress
                await repo.update_run(
                    run,
                    completed_cases=completed_count,
                    passed_cases=passed_count,
                    failed_cases=failed_count,
                    error_cases=error_count,
                )
                await session.commit()

            # Finalize run
            final_run = await repo.get_run_by_id(run_id)
            if final_run and final_run.is_cancelled:
                final_status = TestRunStatus.CANCELLED
            else:
                final_status = TestRunStatus.COMPLETED

            await repo.update_run(
                run,
                status=final_status,
                completed_at=datetime.now(timezone.utc),
            )
            await repo.record_event(
                test_run_id=run.id,
                event_type=EventType.RUN_COMPLETED if final_status == TestRunStatus.COMPLETED else EventType.RUN_CANCELLED,
                message=f"Execution run finished with status: {final_status.value} (Passed: {passed_count}, Failed: {failed_count}, Errors: {error_count})",
            )
            await session.commit()
