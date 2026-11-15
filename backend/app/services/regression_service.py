"""Security Regression Testing Service.
Manages immutable security baselines, launches regression runs,
and computes fingerprint-based vulnerability diffs.
"""

import hashlib
import json
from typing import Any
import uuid
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.engine.orchestrator.service import ExecutionOrchestrator
from app.models.execution import (
    AssertionStatus,
    FindingSeverity,
    TaintFinding,
    TestCaseExecutionStatus,
    TestRun,
    TestRunCase,
    TestRunStatus,
)
from app.models.phase3 import (
    RegressionClassification,
    RegressionComparison,
    RegressionFindingMatch,
    SecurityBaseline,
)
from app.models.target import Target
from app.services.audit_service import log_audit_event


def compute_finding_fingerprint(
    category: str,
    scenario_id: str | None,
    assertion_type: str | None = None,
    target_scope: str = "DEFAULT",
) -> str:
    """Generate deterministic SHA-256 fingerprint for finding matching."""
    components = [
        str(category).strip().upper(),
        str(scenario_id or "GENERIC_SCENARIO").strip(),
        str(assertion_type or "DEFAULT_ASSERTION").strip().upper(),
        str(target_scope).strip().upper(),
    ]
    raw = "|".join(components)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


async def create_baseline(
    db: AsyncSession,
    *,
    name: str,
    description: str | None,
    source_run_id: uuid.UUID,
    user_id: uuid.UUID,
) -> SecurityBaseline:
    """Create an immutable security baseline from a completed test run."""
    run_stmt = (
        select(TestRun)
        .options(
            selectinload(TestRun.cases),
            selectinload(TestRun.findings),
            selectinload(TestRun.target),
        )
        .where(TestRun.id == source_run_id)
    )
    run_res = await db.execute(run_stmt)
    source_run = run_res.scalar_one_or_none()

    if not source_run:
        raise HTTPException(status_code=404, detail="Source test run not found")
    if source_run.status != TestRunStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot create baseline from run with status {source_run.status.value}. Run must be COMPLETED.",
        )

    # 1. Build immutable snapshot of all test cases
    case_snapshots = []
    for c in source_run.cases:
        case_snapshots.append({
            "scenario_id": str(c.scenario_id) if c.scenario_id else None,
            "scenario_version": c.scenario_version,
            "scenario_snapshot": c.scenario_snapshot,
            "execution_order": c.execution_order,
            "status": c.status.value,
        })

    # 2. Fingerprint and summarize baseline findings
    baseline_findings_summary = []
    for f in source_run.findings:
        fp = f.fingerprint or compute_finding_fingerprint(
            f.category,
            str(f.test_run_case_id) if f.test_run_case_id else None,
            f.evidence_reference.get("assertion_type") if f.evidence_reference else None,
        )
        if not f.fingerprint:
            f.fingerprint = fp

        baseline_findings_summary.append({
            "id": str(f.id),
            "fingerprint": fp,
            "category": f.category,
            "severity": f.severity.value,
            "title": f.title,
        })

    metrics_summary = {
        "total_cases": source_run.total_cases,
        "passed_cases": source_run.passed_cases,
        "failed_cases": source_run.failed_cases,
        "error_cases": source_run.error_cases,
        "critical_findings": sum(1 for f in source_run.findings if f.severity == FindingSeverity.CRITICAL),
        "high_findings": sum(1 for f in source_run.findings if f.severity == FindingSeverity.HIGH),
        "total_findings": len(source_run.findings),
    }

    baseline_snapshot = {
        "source_run_id": str(source_run.id),
        "target": {
            "id": str(source_run.target_id) if source_run.target_id else None,
            "name": source_run.target.name if source_run.target else "Target",
            "version": "1.0.0",
        },
        "cases": case_snapshots,
        "findings": baseline_findings_summary,
        "scoring_version": "v1.2-deterministic-weighted",
    }

    baseline = SecurityBaseline(
        id=uuid.uuid4(),
        name=name.strip(),
        description=description.strip() if description else None,
        target_id=source_run.target_id,
        target_version="1.0.0",
        test_suite_id=source_run.test_suite_id,
        source_run_id=source_run.id,
        baseline_snapshot=baseline_snapshot,
        metrics_summary=metrics_summary,
        is_active=True,
        created_by=user_id,
    )
    db.add(baseline)
    await db.commit()
    await db.refresh(baseline)

    await log_audit_event(
        db,
        action="BASELINE_CREATED",
        resource_type="SECURITY_BASELINE",
        resource_id=str(baseline.id),
        user_id=user_id,
        details={"name": name, "source_run_id": str(source_run.id)},
    )

    return baseline


async def list_baselines(
    db: AsyncSession,
    *,
    target_id: uuid.UUID | None = None,
) -> list[SecurityBaseline]:
    """Retrieve all active security baselines."""
    stmt = select(SecurityBaseline).order_by(SecurityBaseline.created_at.desc())
    if target_id:
        stmt = stmt.where(SecurityBaseline.target_id == target_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def get_baseline(db: AsyncSession, baseline_id: uuid.UUID) -> SecurityBaseline | None:
    """Retrieve a single baseline with its comparisons."""
    stmt = (
        select(SecurityBaseline)
        .options(selectinload(SecurityBaseline.comparisons))
        .where(SecurityBaseline.id == baseline_id)
    )
    res = await db.execute(stmt)
    return res.scalar_one_or_none()


async def execute_regression_run(
    db: AsyncSession,
    *,
    baseline_id: uuid.UUID,
    target_version: str,
    concurrency: int,
    timeout_seconds: int,
    user_id: uuid.UUID,
) -> RegressionComparison:
    """Launch regression test run and compute comparative delta against baseline."""
    baseline = await get_baseline(db, baseline_id)
    if not baseline:
        raise HTTPException(status_code=404, detail="Baseline not found")

    # 1. Spawn new test run via ExecutionOrchestrator
    orchestrator = ExecutionOrchestrator(db)
    new_run = await orchestrator.create_test_run(
        initiated_by=user_id,
        target_id=baseline.target_id,
        test_suite_id=baseline.test_suite_id,
        canary_tainting_enabled=True,
        concurrency=concurrency,
        timeout_seconds=timeout_seconds,
        auto_spawn_worker=False,
    )

    # 2. Execute worker synchronously to evaluate results immediately
    await orchestrator._background_execution_worker(new_run.id)

    # 3. Refresh and load new run data
    new_run_stmt = (
        select(TestRun)
        .options(
            selectinload(TestRun.cases),
            selectinload(TestRun.findings),
        )
        .where(TestRun.id == new_run.id)
    )
    new_run_res = await db.execute(new_run_stmt)
    completed_run = new_run_res.scalar_one()

    # 4. Compare findings against baseline findings using fingerprints
    baseline_findings_raw = baseline.baseline_snapshot.get("findings", [])
    baseline_fps: dict[str, dict] = {item["fingerprint"]: item for item in baseline_findings_raw}

    new_findings = list(completed_run.findings)
    new_fps: dict[str, TaintFinding] = {}
    for f in new_findings:
        fp = f.fingerprint or compute_finding_fingerprint(
            f.category,
            str(f.test_run_case_id) if f.test_run_case_id else None,
            f.evidence_reference.get("assertion_type") if f.evidence_reference else None,
        )
        if not f.fingerprint:
            f.fingerprint = fp
        new_fps[fp] = f

    comparison_id = uuid.uuid4()
    matches: list[RegressionFindingMatch] = []
    new_count = 0
    resolved_count = 0
    recurring_count = 0
    inconclusive_count = 0

    # A. Check baseline findings against new findings
    for fp, b_finding in baseline_fps.items():
        if fp in new_fps:
            # Finding recurred in new run
            recurring_count += 1
            matches.append(
                RegressionFindingMatch(
                    id=uuid.uuid4(),
                    comparison_id=comparison_id,
                    baseline_finding_id=uuid.UUID(b_finding["id"]) if b_finding.get("id") else None,
                    comparison_finding_id=new_fps[fp].id,
                    classification=RegressionClassification.RECURRING,
                    fingerprint=fp,
                    confidence="HIGH",
                    rationale=f"Vulnerability '{b_finding.get('title')}' recurred in new target version.",
                )
            )
        else:
            # Finding was not observed in new run -> RESOLVED
            resolved_count += 1
            matches.append(
                RegressionFindingMatch(
                    id=uuid.uuid4(),
                    comparison_id=comparison_id,
                    baseline_finding_id=uuid.UUID(b_finding["id"]) if b_finding.get("id") else None,
                    comparison_finding_id=None,
                    classification=RegressionClassification.RESOLVED,
                    fingerprint=fp,
                    confidence="HIGH",
                    rationale=f"Vulnerability '{b_finding.get('title')}' was resolved; no taint or assertion failures detected.",
                )
            )

    # B. Check new findings for newly introduced vulnerabilities
    for fp, n_finding in new_fps.items():
        if fp not in baseline_fps:
            new_count += 1
            matches.append(
                RegressionFindingMatch(
                    id=uuid.uuid4(),
                    comparison_id=comparison_id,
                    baseline_finding_id=None,
                    comparison_finding_id=n_finding.id,
                    classification=RegressionClassification.NEW,
                    fingerprint=fp,
                    confidence="HIGH",
                    rationale=f"New vulnerability '{n_finding.title}' detected that was not present in baseline.",
                )
            )

    # C. Determine overall summary verdict
    if new_count > 0:
        verdict = "REGRESSION_DETECTED"
    elif resolved_count > 0 and recurring_count == 0:
        verdict = "IMPROVED"
    elif recurring_count > 0:
        verdict = "STABLE_VULNERABLE"
    else:
        verdict = "STABLE_SECURE"

    b_summary = baseline.metrics_summary
    comparison_metrics = {
        "cases_diff": completed_run.completed_cases - b_summary.get("total_cases", 0),
        "passed_diff": completed_run.passed_cases - b_summary.get("passed_cases", 0),
        "failed_diff": completed_run.failed_cases - b_summary.get("failed_cases", 0),
        "new_findings_count": new_count,
        "resolved_findings_count": resolved_count,
        "recurring_findings_count": recurring_count,
        "inconclusive_count": inconclusive_count,
        "baseline_findings_count": len(baseline_fps),
        "current_findings_count": len(new_fps),
    }

    comparison = RegressionComparison(
        id=comparison_id,
        baseline_id=baseline.id,
        comparison_run_id=completed_run.id,
        target_id=baseline.target_id,
        target_version=target_version,
        comparison_metrics=comparison_metrics,
        summary_verdict=verdict,
        created_by=user_id,
    )
    db.add(comparison)
    for m in matches:
        db.add(m)

    await db.commit()
    await db.refresh(comparison)

    await log_audit_event(
        db,
        action="REGRESSION_RUN_EXECUTED",
        resource_type="REGRESSION_COMPARISON",
        resource_id=str(comparison.id),
        user_id=user_id,
        details={"baseline_id": str(baseline.id), "verdict": verdict, "new_count": new_count},
    )

    return comparison


async def get_comparison(db: AsyncSession, comparison_id: uuid.UUID) -> RegressionComparison | None:
    """Retrieve full comparison results with matched findings and baseline."""
    stmt = (
        select(RegressionComparison)
        .options(
            selectinload(RegressionComparison.baseline),
            selectinload(RegressionComparison.finding_matches),
            selectinload(RegressionComparison.comparison_run),
        )
        .where(RegressionComparison.id == comparison_id)
    )
    res = await db.execute(stmt)
    return res.scalar_one_or_none()


async def list_comparisons(
    db: AsyncSession,
    *,
    baseline_id: uuid.UUID | None = None,
) -> list[RegressionComparison]:
    """List regression comparisons."""
    stmt = (
        select(RegressionComparison)
        .options(selectinload(RegressionComparison.baseline))
        .order_by(RegressionComparison.created_at.desc())
    )
    if baseline_id:
        stmt = stmt.where(RegressionComparison.baseline_id == baseline_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())
