"""TestSuite service for managing test suites and scenario associations."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.dependencies.permissions import check_resource_ownership
from app.models.test_case import SuiteTestCase
from app.models.test_suite import TestSuite
from app.models.user import User
from app.repositories.test_case_repository import TestCaseRepository
from app.repositories.test_suite_repository import TestSuiteRepository


class TestSuiteService:
    """Business logic for test suite management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.suite_repo = TestSuiteRepository(db)
        self.test_case_repo = TestCaseRepository(db)

    async def create_suite(self, user: User, name: str, description: str | None = None) -> TestSuite:
        """Create a new test suite."""
        return await self.suite_repo.create(
            owner_id=user.id,
            name=name.strip(),
            description=description.strip() if description else None,
        )

    async def get_suite(self, suite_id: uuid.UUID, user: User, user_roles: list[str]) -> tuple[TestSuite, int]:
        """Get test suite by ID with ownership check and scenario count."""
        suite = await self.suite_repo.get_by_id(suite_id)
        if not suite:
            raise NotFoundError("Test suite not found")
        check_resource_ownership(suite.owner_id, user, user_roles)
        scenario_count = await self.suite_repo.get_scenario_count(suite.id)
        return suite, scenario_count

    async def list_suites(
        self, user: User, user_roles: list[str], *, page: int = 1, page_size: int = 20
    ) -> tuple[list[tuple[TestSuite, int]], int]:
        """List user's test suites with scenario counts."""
        suites, total = await self.suite_repo.list_by_owner(user.id, page=page, page_size=page_size)
        items_with_count = []
        for s in suites:
            count = await self.suite_repo.get_scenario_count(s.id)
            items_with_count.append((s, count))
        return items_with_count, total

    async def update_suite(
        self, suite_id: uuid.UUID, user: User, user_roles: list[str], update_data: dict
    ) -> TestSuite:
        """Update test suite."""
        suite, _ = await self.get_suite(suite_id, user, user_roles)
        clean_data = {k: v for k, v in update_data.items() if v is not None}
        return await self.suite_repo.update(suite, **clean_data)

    async def delete_suite(self, suite_id: uuid.UUID, user: User, user_roles: list[str]) -> None:
        """Delete test suite."""
        suite, _ = await self.get_suite(suite_id, user, user_roles)
        await self.suite_repo.delete(suite)

    async def add_scenario(
        self, suite_id: uuid.UUID, test_case_id: uuid.UUID, execution_order: int, user: User, user_roles: list[str]
    ) -> SuiteTestCase:
        """Add scenario (test case) to suite."""
        suite, _ = await self.get_suite(suite_id, user, user_roles)

        test_case = await self.test_case_repo.get_by_id(test_case_id)
        if not test_case:
            raise NotFoundError("Scenario (test case) not found")
        check_resource_ownership(test_case.owner_id, user, user_roles)

        try:
            return await self.suite_repo.add_test_case(
                suite_id=suite.id,
                test_case_id=test_case.id,
                execution_order=execution_order,
            )
        except Exception as e:
            raise ConflictError("Scenario is already in this test suite") from e

    async def remove_scenario(
        self, suite_id: uuid.UUID, scenario_id: uuid.UUID, user: User, user_roles: list[str]
    ) -> None:
        """Remove scenario from suite."""
        suite, _ = await self.get_suite(suite_id, user, user_roles)
        # Check if scenario association exists
        stc = await self.suite_repo.get_suite_test_case(scenario_id)
        if not stc or stc.suite_id != suite.id:
            raise NotFoundError("Scenario association not found in this suite")
        await self.suite_repo.remove_test_case(scenario_id)

    async def reorder_scenarios(
        self, suite_id: uuid.UUID, scenario_orders: list[dict], user: User, user_roles: list[str]
    ) -> None:
        """Update ordering of scenarios in suite."""
        await self.get_suite(suite_id, user, user_roles)
        for item in scenario_orders:
            stc_id = item["suite_test_case_id"]
            if isinstance(stc_id, str):
                stc_id = uuid.UUID(stc_id)
            await self.suite_repo.update_execution_order(stc_id, item["execution_order"])

