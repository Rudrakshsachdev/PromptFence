"""Integration tests for the test-run read endpoints used by the dashboard.

Regression coverage for TestRunResponse serialization: the nested target and
test-suite briefs are built from ORM relationships, which previously failed
with a pydantic ValidationError (HTTP 500) on every non-empty listing.
"""

import uuid

import pytest
from httpx import AsyncClient
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.orchestrator.service import ExecutionOrchestrator
from app.models.execution import TestRun, TestRunStatus
from app.models.target import Target
from app.models.test_suite import TestSuite
from app.models.user import User
from app.repositories.execution_repository import ExecutionRepository
from app.schemas.execution import TestRunResponse


@pytest.fixture
async def auth_headers(client: AsyncClient, test_user: User) -> dict[str, str]:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "researcher@promptfence.internal", "password": "Password123!"},
    )
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


async def _seeded(session: AsyncSession) -> tuple[User, Target, TestSuite]:
    user = (
        await session.execute(select(User).where(User.email == "researcher@promptfence.internal"))
    ).scalar_one()
    target = (
        (
            await session.execute(
                select(Target).where(Target.name == "Mock Secure Target (Guarded AI)")
            )
        )
        .scalars()
        .first()
    )
    suite = (
        (await session.execute(select(TestSuite).where(TestSuite.name == "OWASP LLM Top 10 Suite")))
        .scalars()
        .first()
    )
    assert target is not None and suite is not None
    return user, target, suite


async def _create_run(session: AsyncSession) -> TestRun:
    user, target, suite = await _seeded(session)
    return await ExecutionOrchestrator(session).create_test_run(
        initiated_by=user.id,
        target_id=target.id,
        test_suite_id=suite.id,
        canary_tainting_enabled=True,
        concurrency=1,
        timeout_seconds=10,
        auto_spawn_worker=False,  # never execute against targets in tests
    )


async def test_list_runs_returns_nested_target_and_suite_newest_first(
    client: AsyncClient, auth_headers: dict[str, str], db_session: AsyncSession
):
    first = await _create_run(db_session)
    second = await _create_run(db_session)

    res = await client.get(
        "/api/v1/test-runs", params={"page": 1, "page_size": 100}, headers=auth_headers
    )

    assert res.status_code == 200
    body = res.json()
    ids = [item["id"] for item in body["items"]]
    assert str(first.id) in ids and str(second.id) in ids
    assert body["total"] >= 2

    item = next(i for i in body["items"] if i["id"] == str(second.id))
    assert item["status"] == TestRunStatus.QUEUED.value
    assert item["target"]["name"] == "Mock Secure Target (Guarded AI)"
    assert item["target"]["target_type"] == "CHAT_API"  # enum value, not "TargetType.CHAT_API"
    assert item["test_suite"]["name"] == "OWASP LLM Top 10 Suite"

    created = [i["created_at"] for i in body["items"]]
    assert created == sorted(created, reverse=True)


async def test_list_runs_with_no_matches_returns_empty_page(
    client: AsyncClient, auth_headers: dict[str, str]
):
    res = await client.get(
        "/api/v1/test-runs", params={"target_id": str(uuid.uuid4())}, headers=auth_headers
    )

    assert res.status_code == 200
    assert res.json() == {"items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 0}


async def test_list_runs_filters_by_status(
    client: AsyncClient, auth_headers: dict[str, str], db_session: AsyncSession
):
    await _create_run(db_session)

    queued = await client.get(
        "/api/v1/test-runs", params={"status": "QUEUED"}, headers=auth_headers
    )
    completed = await client.get(
        "/api/v1/test-runs", params={"status": "COMPLETED"}, headers=auth_headers
    )

    assert queued.status_code == completed.status_code == 200
    assert queued.json()["total"] >= 1
    assert all(i["status"] == "QUEUED" for i in queued.json()["items"])
    assert all(i["status"] == "COMPLETED" for i in completed.json()["items"])


async def test_run_whose_target_and_suite_were_removed_serializes_with_nulls(
    client: AsyncClient, auth_headers: dict[str, str], db_session: AsyncSession
):
    run = await _create_run(db_session)
    run.target_id = None
    run.test_suite_id = None
    await db_session.commit()

    res = await client.get(f"/api/v1/test-runs/{run.id}", headers=auth_headers)

    assert res.status_code == 200
    assert res.json()["target"] is None
    assert res.json()["test_suite"] is None


async def test_get_and_cancel_run_include_nested_briefs(
    client: AsyncClient, auth_headers: dict[str, str], db_session: AsyncSession
):
    run = await _create_run(db_session)

    detail = await client.get(f"/api/v1/test-runs/{run.id}", headers=auth_headers)
    cancelled = await client.post(f"/api/v1/test-runs/{run.id}/cancel", headers=auth_headers)

    assert detail.status_code == 200
    assert detail.json()["target"]["name"] == "Mock Secure Target (Guarded AI)"
    assert cancelled.status_code == 200
    assert cancelled.json()["is_cancelled"] is True
    assert cancelled.json()["test_suite"]["name"] == "OWASP LLM Top 10 Suite"


async def test_freshly_created_run_cannot_be_serialized_without_reloading(db_session: AsyncSession):
    """Documents why POST /test-runs reloads: the new run's relationships are not loaded."""
    run = await _create_run(db_session)

    with pytest.raises(ValidationError):
        TestRunResponse.model_validate(run)


async def test_newly_created_run_serializes_like_the_create_endpoint(db_session: AsyncSession):
    """POST /test-runs reloads the run via get_run_by_id (same session) before serializing."""
    run = await _create_run(db_session)

    reloaded = await ExecutionRepository(db_session).get_run_by_id(run.id)
    response = TestRunResponse.model_validate(reloaded)

    assert response.target is not None and response.target.name == "Mock Secure Target (Guarded AI)"
    assert response.test_suite is not None and response.test_suite.name == "OWASP LLM Top 10 Suite"


async def test_repository_listing_validates_for_every_row(db_session: AsyncSession):
    await _create_run(db_session)
    items, total = await ExecutionRepository(db_session).list_runs(page=1, page_size=100)

    assert total == len(items) >= 1
    assert [TestRunResponse.model_validate(r) for r in items]  # previously raised ValidationError


async def test_listing_requires_authentication(client: AsyncClient):
    res = await client.get("/api/v1/test-runs")

    assert res.status_code == 401
