"""Security researcher overview endpoint and the findings target filter."""

from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.execution import (
    FindingSeverity,
    FindingStatus,
    FindingStatusHistory,
    TaintFinding,
    TestRun,
    TestRunStatus,
)
from app.models.role import Role, UserRole
from app.models.target import Target
from app.models.test_suite import TestSuite
from app.models.user import User

PASSWORD = "Password123!"


async def _login(client: AsyncClient, db: AsyncSession, email: str, role: str) -> dict[str, str]:
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None:
        user = User(
            email=email, full_name=email, password_hash=hash_password(PASSWORD), is_active=True
        )
        db.add(user)
        await db.flush()
        role_row = (await db.execute(select(Role).where(Role.name == role))).scalar_one()
        db.add(UserRole(user_id=user.id, role_id=role_row.id))
    else:
        user.password_hash = hash_password(PASSWORD)
    await db.commit()
    res = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert res.status_code == 200
    client.cookies.clear()  # identify by the Bearer header only
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


async def _run(
    db: AsyncSession, target: Target, suite: TestSuite, user: User, status: TestRunStatus
) -> TestRun:
    run = TestRun(
        target_id=target.id,
        test_suite_id=suite.id,
        initiated_by=user.id,
        status=status,
        total_cases=1,
    )
    db.add(run)
    await db.flush()
    return run


def _finding(
    run: TestRun, severity: FindingSeverity, status: FindingStatus, category: str
) -> TaintFinding:
    return TaintFinding(
        test_run_id=run.id,
        title=f"{severity.value} {category}",
        description="d",
        category=category,
        severity=severity,
        status=status.value,
        observed_at=datetime.now(UTC),
    )


@pytest.fixture
async def dataset(db_session: AsyncSession) -> dict:
    user = (
        await db_session.execute(
            select(User).where(User.email == "researcher@promptfence.internal")
        )
    ).scalar_one()
    targets = (await db_session.execute(select(Target).order_by(Target.name))).scalars().all()
    suite = (await db_session.execute(select(TestSuite))).scalars().first()
    t1, t2 = targets[0], targets[1]
    done = await _run(db_session, t1, suite, user, TestRunStatus.COMPLETED)
    await _run(db_session, t1, suite, user, TestRunStatus.FAILED)
    await _run(db_session, t2, suite, user, TestRunStatus.RUNNING)
    done2 = await _run(db_session, t2, suite, user, TestRunStatus.COMPLETED)
    findings = [
        _finding(done, FindingSeverity.CRITICAL, FindingStatus.OPEN, "PROMPT_INJECTION"),
        _finding(done, FindingSeverity.CRITICAL, FindingStatus.RESOLVED, "PROMPT_INJECTION"),
        _finding(done, FindingSeverity.HIGH, FindingStatus.OPEN, "TOOL_EXECUTION"),
        _finding(done2, FindingSeverity.LOW, FindingStatus.OPEN, "DATA_DISCLOSURE"),
    ]
    db_session.add_all(findings)
    await db_session.flush()
    db_session.add(
        FindingStatusHistory(
            finding_id=findings[1].id, old_status="OPEN", new_status="RESOLVED", changed_by=user.id
        )
    )
    await db_session.commit()
    return {"t1": t1, "t2": t2, "resolved_id": findings[1].id}


async def test_overview_aggregates_recorded_data_exactly(
    client: AsyncClient, db_session: AsyncSession, dataset
):  # noqa: ANN001
    headers = await _login(
        client, db_session, "researcher@promptfence.internal", "security_researcher"
    )

    res = await client.get("/api/v1/security/overview", headers=headers)

    assert res.status_code == 200
    body = res.json()
    runs = body["runs"]
    assert runs["total"] == 4 and runs["assessed_targets"] == 2
    assert runs["by_status"]["COMPLETED"] == 2
    assert runs["by_status"]["FAILED"] == 1
    assert runs["by_status"]["RUNNING"] == 1
    assert runs["by_status"]["QUEUED"] == 0  # every lifecycle state is present

    f = body["findings"]
    assert f["total"] == 4
    assert f["by_status"]["OPEN"] == 3 and f["by_status"]["RESOLVED"] == 1
    assert f["by_severity"]["CRITICAL"] == 2 and f["by_severity"]["HIGH"] == 1
    assert f["open_by_severity"]["CRITICAL"] == 1  # the resolved critical is not "open"
    assert f["open_by_severity"]["INFO"] == 0

    top = body["top_targets"]
    assert [t["target_name"] for t in top] == [dataset["t1"].name, dataset["t2"].name]
    assert (top[0]["findings"], top[0]["open_findings"], top[0]["critical"], top[0]["high"]) == (
        3,
        2,
        2,
        1,
    )

    cats = {c["category"]: c for c in body["categories"]}
    assert cats["PROMPT_INJECTION"] == {
        "category": "PROMPT_INJECTION",
        "findings": 2,
        "open_findings": 1,
    }

    change = body["recent_status_changes"][0]
    assert change["finding_id"] == str(dataset["resolved_id"])
    assert (change["old_status"], change["new_status"]) == ("OPEN", "RESOLVED")


async def test_overview_with_no_data_reports_zeros_not_errors(
    client: AsyncClient, db_session: AsyncSession
):
    headers = await _login(
        client, db_session, "researcher@promptfence.internal", "security_researcher"
    )

    body = (await client.get("/api/v1/security/overview", headers=headers)).json()

    assert body["runs"]["total"] == 0 and body["findings"]["total"] == 0
    assert body["top_targets"] == [] and body["recent_status_changes"] == []


async def test_overview_access_follows_dashboard_permission(
    client: AsyncClient, db_session: AsyncSession
):
    viewer = await _login(client, db_session, "viewer.overview@example.com", "viewer")

    assert (await client.get("/api/v1/security/overview", headers=viewer)).status_code == 200
    assert (await client.get("/api/v1/security/overview")).status_code == 401


async def test_findings_can_be_filtered_by_target(
    client: AsyncClient, db_session: AsyncSession, dataset
):  # noqa: ANN001
    headers = await _login(
        client, db_session, "researcher@promptfence.internal", "security_researcher"
    )

    t1 = await client.get(
        "/api/v1/findings", params={"target_id": str(dataset["t1"].id)}, headers=headers
    )
    t2 = await client.get(
        "/api/v1/findings",
        params={"target_id": str(dataset["t2"].id), "status": "OPEN"},
        headers=headers,
    )

    assert t1.status_code == 200 and t1.json()["total"] == 3
    assert t2.json()["total"] == 1 and t2.json()["items"][0]["category"] == "DATA_DISCLOSURE"
