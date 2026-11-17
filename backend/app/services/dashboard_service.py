"""Dashboard service providing platform statistics, activity feeds, and distribution analytics."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.target import Target
from app.models.test_case import TestCase
from app.models.test_suite import TestSuite
from app.models.user import User
from app.repositories.dashboard_repository import DashboardRepository
from app.repositories.target_repository import TargetRepository
from app.repositories.test_case_repository import TestCaseRepository
from app.repositories.test_suite_repository import TestSuiteRepository


class DashboardService:
    """Business logic for aggregating dashboard data and analytics."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.target_repo = TargetRepository(db)
        self.suite_repo = TestSuiteRepository(db)
        self.test_case_repo = TestCaseRepository(db)
        self.dashboard_repo = DashboardRepository(db)

    async def get_overview(self, user: User) -> dict:
        """Aggregate high-level overview metrics."""
        # One round trip for all five counters (previously five sequential queries).
        counts = await self.dashboard_repo.owner_counts(user.id)

        # Recent targets
        targets = await self.dashboard_repo.recent_by_owner(Target, user.id, limit=5)
        recent_targets_list = [
            {
                "id": str(t.id),
                "name": t.name,
                "target_type": t.target_type.value,
                "base_url": t.base_url,
                "is_active": t.is_active,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in targets
        ]

        # Recent scenarios
        test_cases = await self.dashboard_repo.recent_by_owner(TestCase, user.id, limit=5)
        recent_cases_list = [
            {
                "id": str(tc.id),
                "name": tc.name,
                "category": tc.category.value,
                "severity": tc.severity.value,
                "is_enabled": tc.is_enabled,
                "created_at": tc.created_at.isoformat() if tc.created_at else None,
            }
            for tc in test_cases
        ]

        return {
            "total_targets": counts["total_targets"],
            "active_targets": counts["active_targets"],
            "total_test_suites": counts["total_test_suites"],
            "total_test_cases": counts["total_test_cases"],
            "enabled_test_cases": counts["enabled_test_cases"],
            "recent_targets": recent_targets_list,
            "recent_test_cases": recent_cases_list,
        }

    async def get_activity(self, user: User) -> dict:
        """Recent activity across targets, suites, and test cases."""
        activities = []

        targets = await self.dashboard_repo.recent_by_owner(Target, user.id, limit=5)
        for t in targets:
            activities.append({
                "type": "target_created",
                "title": f"Target '{t.name}' registered",
                "timestamp": t.created_at.isoformat() if t.created_at else None,
                "entity_id": str(t.id),
            })

        suites = await self.dashboard_repo.recent_by_owner(TestSuite, user.id, limit=5)
        for s in suites:
            activities.append({
                "type": "test_suite_created",
                "title": f"Test suite '{s.name}' created",
                "timestamp": s.created_at.isoformat() if s.created_at else None,
                "entity_id": str(s.id),
            })

        test_cases = await self.dashboard_repo.recent_by_owner(TestCase, user.id, limit=5)
        for tc in test_cases:
            activities.append({
                "type": "scenario_created",
                "title": f"Scenario '{tc.name}' created ({tc.severity.value})",
                "timestamp": tc.created_at.isoformat() if tc.created_at else None,
                "entity_id": str(tc.id),
            })

        # Sort combined activity by timestamp descending
        activities.sort(key=lambda x: x["timestamp"] or "", reverse=True)

        return {"activities": activities[:15]}

    async def get_distributions(self, user: User) -> dict:
        """Category, severity, and target type distributions for charts."""
        # Targets by type
        target_type_counts = await self.db.execute(
            select(Target.target_type, func.count())
            .where(Target.owner_id == user.id)
            .group_by(Target.target_type)
        )
        targets_by_type = {row[0].value: row[1] for row in target_type_counts.all()}

        # Test cases by category
        cases_by_category = await self.test_case_repo.count_by_category(user.id)

        # Test cases by severity
        cases_by_severity = await self.test_case_repo.count_by_severity(user.id)

        return {
            "targets_by_type": targets_by_type,
            "test_cases_by_category": cases_by_category,
            "test_cases_by_severity": cases_by_severity,
        }

