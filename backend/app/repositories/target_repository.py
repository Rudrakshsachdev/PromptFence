"""Target repository."""

import uuid
from math import ceil

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.target import Target, TargetVersion


class TargetRepository:
    """Database operations for Targets."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, *, owner_id: uuid.UUID, **kwargs) -> Target:
        target = Target(owner_id=owner_id, **kwargs)
        self.db.add(target)
        await self.db.flush()
        await self.db.refresh(target)
        return target

    async def get_by_id(self, target_id: uuid.UUID) -> Target | None:
        result = await self.db.execute(select(Target).where(Target.id == target_id))
        return result.scalar_one_or_none()

    async def list_by_owner(
        self, owner_id: uuid.UUID, *, page: int = 1, page_size: int = 20
    ) -> tuple[list[Target], int]:
        count_q = select(func.count()).select_from(Target).where(Target.owner_id == owner_id)
        total = (await self.db.execute(count_q)).scalar_one()

        q = (
            select(Target)
            .where(Target.owner_id == owner_id)
            .order_by(Target.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def update(self, target: Target, **kwargs) -> Target:
        for key, value in kwargs.items():
            if hasattr(target, key) and value is not None:
                setattr(target, key, value)
        await self.db.flush()
        await self.db.refresh(target)
        return target

    async def delete(self, target: Target) -> None:
        await self.db.delete(target)
        await self.db.flush()

    # ── Versions ──

    async def create_version(
        self, *, target_id: uuid.UUID, version_number: int, configuration_snapshot: dict
    ) -> TargetVersion:
        version = TargetVersion(
            target_id=target_id,
            version_number=version_number,
            configuration_snapshot=configuration_snapshot,
        )
        self.db.add(version)
        await self.db.flush()
        await self.db.refresh(version)
        return version

    async def get_latest_version_number(self, target_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.max(TargetVersion.version_number), 0)).where(
                TargetVersion.target_id == target_id
            )
        )
        return result.scalar_one()

    async def list_versions(self, target_id: uuid.UUID) -> list[TargetVersion]:
        result = await self.db.execute(
            select(TargetVersion)
            .where(TargetVersion.target_id == target_id)
            .order_by(TargetVersion.version_number.desc())
        )
        return list(result.scalars().all())

    # ── Stats ──

    async def count_by_owner(self, owner_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Target).where(Target.owner_id == owner_id)
        )
        return result.scalar_one()

    async def count_active_by_owner(self, owner_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Target)
            .where(Target.owner_id == owner_id, Target.is_active == True)  # noqa: E712
        )
        return result.scalar_one()
