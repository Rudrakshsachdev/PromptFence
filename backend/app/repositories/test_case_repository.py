"""TestCase repository."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.test_case import TestCase, TestCaseCategory, TestCaseSeverity


class TestCaseRepository:
    """Database operations for TestCases (scenarios)."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, *, owner_id: uuid.UUID, **kwargs) -> TestCase:
        tc = TestCase(owner_id=owner_id, **kwargs)
        self.db.add(tc)
        await self.db.flush()
        await self.db.refresh(tc)
        return tc

    async def get_by_id(self, test_case_id: uuid.UUID) -> TestCase | None:
        result = await self.db.execute(select(TestCase).where(TestCase.id == test_case_id))
        return result.scalar_one_or_none()

    async def list_by_owner(
        self,
        owner_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        category: TestCaseCategory | None = None,
        severity: TestCaseSeverity | None = None,
    ) -> tuple[list[TestCase], int]:
        base = select(TestCase).where(TestCase.owner_id == owner_id)
        count_base = select(func.count()).select_from(TestCase).where(TestCase.owner_id == owner_id)

        if category:
            base = base.where(TestCase.category == category)
            count_base = count_base.where(TestCase.category == category)
        if severity:
            base = base.where(TestCase.severity == severity)
            count_base = count_base.where(TestCase.severity == severity)

        total = (await self.db.execute(count_base)).scalar_one()

        q = base.order_by(TestCase.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def update(self, tc: TestCase, **kwargs) -> TestCase:
        for key, value in kwargs.items():
            if hasattr(tc, key) and value is not None:
                setattr(tc, key, value)
        await self.db.flush()
        await self.db.refresh(tc)
        return tc

    async def delete(self, tc: TestCase) -> None:
        await self.db.delete(tc)
        await self.db.flush()

    async def count_by_owner(self, owner_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(TestCase).where(TestCase.owner_id == owner_id)
        )
        return result.scalar_one()

    async def count_enabled_by_owner(self, owner_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(TestCase)
            .where(TestCase.owner_id == owner_id, TestCase.is_enabled == True)  # noqa: E712
        )
        return result.scalar_one()

    async def count_by_category(self, owner_id: uuid.UUID) -> dict[str, int]:
        result = await self.db.execute(
            select(TestCase.category, func.count())
            .where(TestCase.owner_id == owner_id)
            .group_by(TestCase.category)
        )
        return {row[0].value: row[1] for row in result.all()}

    async def count_by_severity(self, owner_id: uuid.UUID) -> dict[str, int]:
        result = await self.db.execute(
            select(TestCase.severity, func.count())
            .where(TestCase.owner_id == owner_id)
            .group_by(TestCase.severity)
        )
        return {row[0].value: row[1] for row in result.all()}
