"""TestSuite repository."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.test_suite import TestSuite
from app.models.test_case import SuiteTestCase


class TestSuiteRepository:
    """Database operations for TestSuites."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, *, owner_id: uuid.UUID, name: str, description: str | None = None) -> TestSuite:
        suite = TestSuite(owner_id=owner_id, name=name, description=description)
        self.db.add(suite)
        await self.db.flush()
        await self.db.refresh(suite)
        return suite

    async def get_by_id(self, suite_id: uuid.UUID) -> TestSuite | None:
        result = await self.db.execute(
            select(TestSuite)
            .options(selectinload(TestSuite.suite_test_cases).selectinload(SuiteTestCase.test_case))
            .where(TestSuite.id == suite_id)
        )
        return result.scalar_one_or_none()

    async def list_by_owner(
        self, owner_id: uuid.UUID, *, page: int = 1, page_size: int = 20
    ) -> tuple[list[TestSuite], int]:
        count_q = select(func.count()).select_from(TestSuite).where(TestSuite.owner_id == owner_id)
        total = (await self.db.execute(count_q)).scalar_one()

        q = (
            select(TestSuite)
            .where(TestSuite.owner_id == owner_id)
            .order_by(TestSuite.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def update(self, suite: TestSuite, **kwargs) -> TestSuite:
        for key, value in kwargs.items():
            if hasattr(suite, key) and value is not None:
                setattr(suite, key, value)
        await self.db.flush()
        await self.db.refresh(suite)
        return suite

    async def delete(self, suite: TestSuite) -> None:
        await self.db.delete(suite)
        await self.db.flush()

    async def count_by_owner(self, owner_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(TestSuite).where(TestSuite.owner_id == owner_id)
        )
        return result.scalar_one()

    # ── Suite-TestCase associations ──

    async def add_test_case(
        self, *, suite_id: uuid.UUID, test_case_id: uuid.UUID, execution_order: int = 0
    ) -> SuiteTestCase:
        stc = SuiteTestCase(
            suite_id=suite_id, test_case_id=test_case_id, execution_order=execution_order
        )
        self.db.add(stc)
        await self.db.flush()
        await self.db.refresh(stc)
        return stc

    async def remove_test_case(self, suite_test_case_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(SuiteTestCase).where(SuiteTestCase.id == suite_test_case_id)
        )
        stc = result.scalar_one_or_none()
        if stc:
            await self.db.delete(stc)
            await self.db.flush()
            return True
        return False

    async def get_suite_test_case(self, suite_test_case_id: uuid.UUID) -> SuiteTestCase | None:
        result = await self.db.execute(
            select(SuiteTestCase).where(SuiteTestCase.id == suite_test_case_id)
        )
        return result.scalar_one_or_none()

    async def update_execution_order(self, suite_test_case_id: uuid.UUID, order: int) -> None:
        result = await self.db.execute(
            select(SuiteTestCase).where(SuiteTestCase.id == suite_test_case_id)
        )
        stc = result.scalar_one_or_none()
        if stc:
            stc.execution_order = order
            await self.db.flush()

    async def get_scenario_count(self, suite_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(SuiteTestCase).where(SuiteTestCase.suite_id == suite_id)
        )
        return result.scalar_one()
