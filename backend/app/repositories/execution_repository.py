"""Repository for test execution runs, cases, canaries, events, findings, and assertions."""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.execution import (
    AssertionResult,
    CanaryStatus,
    DynamicCanary,
    ExecutionEvent,
    ExecutionLog,
    TaintFinding,
    TargetTrace,
    TestCaseExecutionStatus,
    TestRun,
    TestRunCase,
    TestRunStatus,
)


class ExecutionRepository:
    """Database operations for Phase 2 execution engine entities."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Test Runs ──

    async def create_run(
        self,
        *,
        target_id: uuid.UUID,
        test_suite_id: uuid.UUID,
        initiated_by: uuid.UUID,
        total_cases: int,
        execution_snapshot: dict[str, Any] | None = None,
    ) -> TestRun:
        run = TestRun(
            target_id=target_id,
            test_suite_id=test_suite_id,
            initiated_by=initiated_by,
            status=TestRunStatus.PENDING,
            total_cases=total_cases,
            execution_snapshot=execution_snapshot,
        )
        self.db.add(run)
        await self.db.flush()
        await self.db.refresh(run)
        return run

    async def get_run_by_id(self, run_id: uuid.UUID) -> TestRun | None:
        q = (
            select(TestRun)
            .where(TestRun.id == run_id)
            .options(
                selectinload(TestRun.target),
                selectinload(TestRun.test_suite),
            )
        )
        result = await self.db.execute(q)
        return result.scalar_one_or_none()

    async def list_runs(
        self,
        *,
        user_id: uuid.UUID | None = None,
        target_id: uuid.UUID | None = None,
        test_suite_id: uuid.UUID | None = None,
        status: TestRunStatus | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[TestRun], int]:
        filters = []
        if user_id:
            filters.append(TestRun.initiated_by == user_id)
        if target_id:
            filters.append(TestRun.target_id == target_id)
        if test_suite_id:
            filters.append(TestRun.test_suite_id == test_suite_id)
        if status:
            filters.append(TestRun.status == status)

        count_q = select(func.count()).select_from(TestRun)
        if filters:
            count_q = count_q.where(*filters)
        total = (await self.db.execute(count_q)).scalar_one()

        q = (
            select(TestRun)
            .options(
                selectinload(TestRun.target),
                selectinload(TestRun.test_suite),
            )
            .order_by(TestRun.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        if filters:
            q = q.where(*filters)

        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def update_run(self, run: TestRun, **kwargs: Any) -> TestRun:
        for key, value in kwargs.items():
            if hasattr(run, key):
                setattr(run, key, value)
        await self.db.flush()
        await self.db.refresh(run)
        return run

    # ── Test Run Cases ──

    async def create_run_case(
        self,
        *,
        test_run_id: uuid.UUID,
        scenario_id: uuid.UUID | None,
        scenario_version: int,
        scenario_snapshot: dict[str, Any] | None,
        execution_order: int,
    ) -> TestRunCase:
        case = TestRunCase(
            test_run_id=test_run_id,
            scenario_id=scenario_id,
            scenario_version=scenario_version,
            scenario_snapshot=scenario_snapshot,
            status=TestCaseExecutionStatus.PENDING,
            execution_order=execution_order,
        )
        self.db.add(case)
        await self.db.flush()
        await self.db.refresh(case)
        return case

    async def get_case_by_id(self, case_id: uuid.UUID) -> TestRunCase | None:
        q = (
            select(TestRunCase)
            .where(TestRunCase.id == case_id)
            .options(selectinload(TestRunCase.scenario))
        )
        result = await self.db.execute(q)
        return result.scalar_one_or_none()

    async def list_cases_for_run(self, run_id: uuid.UUID) -> list[TestRunCase]:
        q = (
            select(TestRunCase)
            .where(TestRunCase.test_run_id == run_id)
            .options(selectinload(TestRunCase.scenario))
            .order_by(TestRunCase.execution_order)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def update_case(self, case: TestRunCase, **kwargs: Any) -> TestRunCase:
        for key, value in kwargs.items():
            if hasattr(case, key):
                setattr(case, key, value)
        await self.db.flush()
        await self.db.refresh(case)
        return case

    # ── Dynamic Canaries ──

    async def create_canary(
        self,
        *,
        test_run_id: uuid.UUID,
        test_run_case_id: uuid.UUID | None,
        source_id: str,
        source_type: str,
        digest: str,
        key_version: str,
        token_preview: str,
        expires_at: datetime,
        metadata_json: dict[str, Any] | None = None,
    ) -> DynamicCanary:
        canary = DynamicCanary(
            test_run_id=test_run_id,
            test_run_case_id=test_run_case_id,
            source_id=source_id,
            source_type=source_type,
            digest=digest,
            key_version=key_version,
            status=CanaryStatus.ACTIVE,
            token_preview=token_preview,
            expires_at=expires_at,
            metadata_json=metadata_json,
        )
        self.db.add(canary)
        await self.db.flush()
        await self.db.refresh(canary)
        return canary

    async def get_canary_by_digest(self, test_run_id: uuid.UUID, digest: str) -> DynamicCanary | None:
        q = (
            select(DynamicCanary)
            .where(
                DynamicCanary.test_run_id == test_run_id,
                DynamicCanary.digest == digest,
            )
        )
        result = await self.db.execute(q)
        return result.scalar_one_or_none()

    async def list_canaries_for_run(self, run_id: uuid.UUID) -> list[DynamicCanary]:
        q = (
            select(DynamicCanary)
            .where(DynamicCanary.test_run_id == run_id)
            .order_by(DynamicCanary.created_at)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def update_canary_status(self, canary: DynamicCanary, status: CanaryStatus) -> DynamicCanary:
        canary.status = status
        await self.db.flush()
        await self.db.refresh(canary)
        return canary

    # ── Execution Events & Logs ──

    async def record_event(
        self,
        *,
        test_run_id: uuid.UUID,
        event_type: Any,
        message: str,
        test_run_case_id: uuid.UUID | None = None,
        level: str = "INFO",
        metadata: dict[str, Any] | None = None,
    ) -> ExecutionEvent:
        event = ExecutionEvent(
            test_run_id=test_run_id,
            test_run_case_id=test_run_case_id,
            event_type=event_type,
            level=level,
            message=message,
            event_metadata=metadata,
        )
        self.db.add(event)
        await self.db.flush()
        await self.db.refresh(event)
        return event

    async def list_events_for_run(self, run_id: uuid.UUID) -> list[ExecutionEvent]:
        q = (
            select(ExecutionEvent)
            .where(ExecutionEvent.test_run_id == run_id)
            .order_by(ExecutionEvent.created_at)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def list_events_for_case(self, case_id: uuid.UUID) -> list[ExecutionEvent]:
        q = (
            select(ExecutionEvent)
            .where(ExecutionEvent.test_run_case_id == case_id)
            .order_by(ExecutionEvent.created_at)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def record_log(
        self,
        *,
        test_run_id: uuid.UUID,
        message: str,
        test_run_case_id: uuid.UUID | None = None,
        level: str = "INFO",
        metadata: dict[str, Any] | None = None,
    ) -> ExecutionLog:
        log_entry = ExecutionLog(
            test_run_id=test_run_id,
            test_run_case_id=test_run_case_id,
            level=level,
            message=message,
            log_metadata=metadata,
        )
        self.db.add(log_entry)
        await self.db.flush()
        await self.db.refresh(log_entry)
        return log_entry

    async def list_logs_for_case(self, case_id: uuid.UUID) -> list[ExecutionLog]:
        q = (
            select(ExecutionLog)
            .where(ExecutionLog.test_run_case_id == case_id)
            .order_by(ExecutionLog.created_at)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())

    # ── Taint Findings ──

    async def create_finding(
        self,
        *,
        test_run_id: uuid.UUID,
        test_run_case_id: uuid.UUID | None,
        category: str,
        title: str,
        description: str,
        severity: Any,
        confidence: str,
        observation_location: str,
        detection_method: str,
        attribution_level: Any,
        canary_id: uuid.UUID | None = None,
        source_id: str | None = None,
        evidence_reference: dict[str, Any] | None = None,
        deduplication_key: str | None = None,
        observed_at: datetime | None = None,
    ) -> TaintFinding:
        # Check deduplication
        if deduplication_key:
            existing = await self.db.execute(
                select(TaintFinding).where(
                    TaintFinding.test_run_id == test_run_id,
                    TaintFinding.deduplication_key == deduplication_key,
                )
            )
            found = existing.scalar_one_or_none()
            if found:
                return found

        finding = TaintFinding(
            test_run_id=test_run_id,
            test_run_case_id=test_run_case_id,
            canary_id=canary_id,
            source_id=source_id,
            category=category,
            title=title,
            description=description,
            severity=severity,
            confidence=confidence,
            observation_location=observation_location,
            detection_method=detection_method,
            attribution_level=attribution_level,
            evidence_reference=evidence_reference,
            deduplication_key=deduplication_key,
            observed_at=observed_at or datetime.now(timezone.utc),
        )
        self.db.add(finding)
        await self.db.flush()
        await self.db.refresh(finding)
        return finding

    async def get_finding_by_id(self, finding_id: uuid.UUID) -> TaintFinding | None:
        q = (
            select(TaintFinding)
            .where(TaintFinding.id == finding_id)
            .options(selectinload(TaintFinding.canary))
        )
        result = await self.db.execute(q)
        return result.scalar_one_or_none()

    async def list_findings(
        self,
        *,
        test_run_id: uuid.UUID | None = None,
        category: str | None = None,
        severity: Any = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[TaintFinding], int]:
        filters = []
        if test_run_id:
            filters.append(TaintFinding.test_run_id == test_run_id)
        if category:
            filters.append(TaintFinding.category == category)
        if severity:
            filters.append(TaintFinding.severity == severity)

        count_q = select(func.count()).select_from(TaintFinding)
        if filters:
            count_q = count_q.where(*filters)
        total = (await self.db.execute(count_q)).scalar_one()

        q = (
            select(TaintFinding)
            .options(selectinload(TaintFinding.canary))
            .order_by(TaintFinding.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        if filters:
            q = q.where(*filters)

        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    # ── Assertion Results & Traces ──

    async def record_assertion_result(
        self,
        *,
        test_run_case_id: uuid.UUID,
        assertion_id: str,
        assertion_type: Any,
        status: Any,
        expected_value: str | None = None,
        actual_value: str | None = None,
        evidence: dict[str, Any] | None = None,
    ) -> AssertionResult:
        res = AssertionResult(
            test_run_case_id=test_run_case_id,
            assertion_id=assertion_id,
            assertion_type=assertion_type,
            status=status,
            expected_value=expected_value,
            actual_value=actual_value,
            evidence=evidence,
            evaluated_at=datetime.now(timezone.utc),
        )
        self.db.add(res)
        await self.db.flush()
        await self.db.refresh(res)
        return res

    async def list_assertions_for_case(self, case_id: uuid.UUID) -> list[AssertionResult]:
        q = (
            select(AssertionResult)
            .where(AssertionResult.test_run_case_id == case_id)
            .order_by(AssertionResult.created_at)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def record_trace(
        self,
        *,
        test_run_id: uuid.UUID,
        test_run_case_id: uuid.UUID | None,
        trace_type: str,
        source_id: str | None = None,
        trace_metadata: dict[str, Any] | None = None,
        evidence_reference: dict[str, Any] | None = None,
    ) -> TargetTrace:
        trace = TargetTrace(
            test_run_id=test_run_id,
            test_run_case_id=test_run_case_id,
            source_id=source_id,
            trace_type=trace_type,
            trace_metadata=trace_metadata,
            evidence_reference=evidence_reference,
        )
        self.db.add(trace)
        await self.db.flush()
        await self.db.refresh(trace)
        return trace

    async def list_traces_for_case(self, case_id: uuid.UUID) -> list[TargetTrace]:
        q = (
            select(TargetTrace)
            .where(TargetTrace.test_run_case_id == case_id)
            .order_by(TargetTrace.created_at)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all())
