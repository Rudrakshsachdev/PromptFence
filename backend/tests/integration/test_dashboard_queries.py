"""Dashboard/analytics aggregates: same results with fewer database round trips."""

from datetime import UTC, datetime

import pytest
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import FindingSeverity, TaintFinding, TestRun
from app.models.target import Target
from app.models.test_case import TestCase
from app.models.test_suite import TestSuite
from app.models.user import User
from app.repositories.dashboard_repository import DashboardRepository
from app.repositories.target_repository import TargetRepository
from app.repositories.test_case_repository import TestCaseRepository
from app.repositories.test_suite_repository import TestSuiteRepository
from app.services import analytics_service
from app.services.dashboard_service import DashboardService


@pytest.fixture
def statement_count(db_session: AsyncSession):
    """Count SQL statements on the engine the test session is actually bound to."""
    counter = {"n": 0}
    sync_engine = db_session.bind.sync_engine

    def _count(*_args: object) -> None:
        counter["n"] += 1

    event.listen(sync_engine, "before_cursor_execute", _count)
    yield counter
    event.remove(sync_engine, "before_cursor_execute", _count)


async def _researcher(db: AsyncSession) -> User:
    return (
        await db.execute(select(User).where(User.email == "researcher@promptfence.internal"))
    ).scalar_one()


async def test_owner_counts_match_the_individual_counts(db_session: AsyncSession):
    user = await _researcher(db_session)

    counts = await DashboardRepository(db_session).owner_counts(user.id)

    assert counts == {
        "total_targets": await TargetRepository(db_session).count_by_owner(user.id),
        "active_targets": await TargetRepository(db_session).count_active_by_owner(user.id),
        "total_test_suites": await TestSuiteRepository(db_session).count_by_owner(user.id),
        "total_test_cases": await TestCaseRepository(db_session).count_by_owner(user.id),
        "enabled_test_cases": await TestCaseRepository(db_session).count_enabled_by_owner(user.id),
    }
    assert counts["total_targets"] > 0


@pytest.mark.parametrize("model", [Target, TestSuite, TestCase])
async def test_recent_by_owner_matches_first_page_of_listing(db_session: AsyncSession, model):  # noqa: ANN001
    user = await _researcher(db_session)
    repo = {
        Target: TargetRepository,
        TestSuite: TestSuiteRepository,
        TestCase: TestCaseRepository,
    }[model](db_session)

    recent = await DashboardRepository(db_session).recent_by_owner(model, user.id, limit=5)
    page, _ = await repo.list_by_owner(user.id, page=1, page_size=5)

    assert [r.id for r in recent] == [p.id for p in page]


async def test_overview_uses_four_statements(db_session: AsyncSession, statement_count: dict):
    user = await _researcher(db_session)
    statement_count["n"] = 0

    overview = await DashboardService(db_session).get_overview(user)

    # counts (1) + recent targets (1) + recent scenarios (1); previously 9
    assert statement_count["n"] == 3
    assert (
        overview["total_targets"] == len(overview["recent_targets"])
        or overview["total_targets"] > 5
    )
    assert set(overview) == {
        "total_targets",
        "active_targets",
        "total_test_suites",
        "total_test_cases",
        "enabled_test_cases",
        "recent_targets",
        "recent_test_cases",
    }


async def test_activity_has_no_wasted_count_queries(
    db_session: AsyncSession, statement_count: dict
):
    user = await _researcher(db_session)
    statement_count["n"] = 0

    activity = await DashboardService(db_session).get_activity(user)

    assert statement_count["n"] == 3  # one per entity type; previously 6 + suite eager loads
    timestamps = [a["timestamp"] for a in activity["activities"]]
    assert timestamps == sorted(timestamps, key=lambda t: t or "", reverse=True)


async def _add_run_with_findings(
    db: AsyncSession,
    target: Target,
    suite: TestSuite,
    user: User,
    completed: int,
    severities: list[FindingSeverity],
) -> None:
    run = TestRun(
        target_id=target.id,
        test_suite_id=suite.id,
        initiated_by=user.id,
        total_cases=completed,
        completed_cases=completed,
    )
    db.add(run)
    await db.flush()
    for i, sev in enumerate(severities):
        db.add(
            TaintFinding(
                test_run_id=run.id,
                title=f"finding {i}",
                description="d",
                category="TOOL_EXECUTION" if i == 0 else "PROMPT_INJECTION",
                severity=sev,
                observed_at=datetime.now(UTC),
            )
        )
    await db.commit()


async def test_target_comparisons_are_correct_with_constant_queries(
    db_session: AsyncSession, statement_count: dict
):
    user = await _researcher(db_session)
    targets = (await db_session.execute(select(Target).order_by(Target.name))).scalars().all()
    suite = (await db_session.execute(select(TestSuite))).scalars().first()
    assert len(targets) >= 2 and suite is not None
    first, second = targets[0], targets[1]
    await _add_run_with_findings(
        db_session, first, suite, user, 5, [FindingSeverity.CRITICAL, FindingSeverity.HIGH]
    )
    await _add_run_with_findings(db_session, first, suite, user, 5, [FindingSeverity.HIGH])
    statement_count["n"] = 0

    items = {i.target_name: i for i in await analytics_service.get_target_comparisons(db_session)}

    assert statement_count["n"] == 3  # targets, runs, findings — independent of target count
    a = items[first.name]
    assert (a.runs_count, a.cases_evaluated, a.critical_findings, a.high_findings) == (2, 10, 1, 2)
    # the first finding of each run is a TOOL_* finding: 2 over 10 evaluated cases
    assert a.tool_violation_rate == round(2 / 10 * 100, 1)
    b = items[second.name]
    assert (b.runs_count, b.cases_evaluated, b.critical_findings) == (0, 0, 0)
    assert b.coverage_sufficient is False
