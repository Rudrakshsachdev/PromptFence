"""TestCase (Scenario) service."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.dependencies.permissions import check_resource_ownership
from app.models.test_case import TestCase, TestCaseCategory, TestCaseSeverity
from app.models.user import User
from app.repositories.test_case_repository import TestCaseRepository


class TestCaseService:
    """Business logic for test scenarios / test cases."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.test_case_repo = TestCaseRepository(db)

    async def create_test_case(self, user: User, data: dict) -> TestCase:
        """Create a new scenario."""
        clean_data = {k: v for k, v in data.items() if v is not None}
        return await self.test_case_repo.create(owner_id=user.id, **clean_data)

    async def get_test_case(
        self, test_case_id: uuid.UUID, user: User, user_roles: list[str]
    ) -> TestCase:
        """Get scenario by ID with ownership enforcement."""
        tc = await self.test_case_repo.get_by_id(test_case_id)
        if not tc:
            raise NotFoundError("Scenario not found")
        check_resource_ownership(tc.owner_id, user, user_roles)
        return tc

    async def list_test_cases(
        self,
        user: User,
        user_roles: list[str],
        *,
        page: int = 1,
        page_size: int = 20,
        category: TestCaseCategory | None = None,
        severity: TestCaseSeverity | None = None,
    ) -> tuple[list[TestCase], int]:
        """List scenarios owned by user with filters and pagination."""
        return await self.test_case_repo.list_by_owner(
            user.id, page=page, page_size=page_size, category=category, severity=severity
        )

    async def update_test_case(
        self, test_case_id: uuid.UUID, user: User, user_roles: list[str], data: dict
    ) -> TestCase:
        """Update scenario."""
        tc = await self.get_test_case(test_case_id, user, user_roles)
        clean_data = {k: v for k, v in data.items() if v is not None}
        return await self.test_case_repo.update(tc, **clean_data)

    async def delete_test_case(
        self, test_case_id: uuid.UUID, user: User, user_roles: list[str]
    ) -> None:
        """Delete scenario."""
        tc = await self.get_test_case(test_case_id, user, user_roles)
        await self.test_case_repo.delete(tc)

    async def update_status(
        self, test_case_id: uuid.UUID, user: User, user_roles: list[str], is_enabled: bool
    ) -> TestCase:
        """Toggle scenario enabled/disabled status."""
        tc = await self.get_test_case(test_case_id, user, user_roles)
        return await self.test_case_repo.update(tc, is_enabled=is_enabled)

