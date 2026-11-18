"""Read-only aggregate queries for the dashboard."""

import uuid
from typing import TypeVar

from sqlalchemy import ColumnElement, ScalarSelect, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.target import Target
from app.models.test_case import TestCase
from app.models.test_suite import TestSuite

OwnedModel = TypeVar("OwnedModel", Target, TestSuite, TestCase)


class DashboardRepository:
    """Aggregate queries kept to as few database round trips as possible."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def owner_counts(self, owner_id: uuid.UUID) -> dict[str, int]:
        """All overview counters for one owner in a single statement."""

        def count(
            model: type[Target] | type[TestSuite] | type[TestCase],
            *conditions: ColumnElement[bool],
        ) -> ScalarSelect[int]:
            return (
                select(func.count())
                .select_from(model)
                .where(model.owner_id == owner_id, *conditions)
                .scalar_subquery()
            )

        row = (
            await self.db.execute(
                select(
                    count(Target).label("total_targets"),
                    count(Target, Target.is_active.is_(True)).label("active_targets"),
                    count(TestSuite).label("total_test_suites"),
                    count(TestCase).label("total_test_cases"),
                    count(TestCase, TestCase.is_enabled.is_(True)).label("enabled_test_cases"),
                )
            )
        ).one()
        return {key: int(value) for key, value in row._mapping.items()}

    async def recent_by_owner(
        self, model: type[OwnedModel], owner_id: uuid.UUID, limit: int = 5
    ) -> list[OwnedModel]:
        """Newest rows for an owner (same ordering as the paginated list endpoints, no count)."""
        result = await self.db.execute(
            select(model)
            .where(model.owner_id == owner_id)
            .order_by(model.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
