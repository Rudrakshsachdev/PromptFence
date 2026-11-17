"""User repository - database access layer for users."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import raiseload

from app.models.user import User


class UserRepository:
    """Database operations for Users."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, *, email: str, password_hash: str, full_name: str) -> User:
        user = User(email=email, password_hash=password_hash, full_name=full_name)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: uuid.UUID, *, load_roles: bool = True) -> User | None:
        """Fetch a user. ``load_roles=False`` skips the eager ``User.roles`` load.

        Request authentication only needs the user row; roles are fetched
        explicitly via RoleRepository where required, so loading them on every
        request is a wasted round trip. Accessing ``user.roles`` on a user loaded
        this way raises instead of returning misleading data.
        """
        query = select(User).where(User.id == user_id)
        if not load_roles:
            query = query.options(raiseload(User.roles))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update_last_login(self, user: User) -> User:
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()
        return user

    async def count(self) -> int:
        from sqlalchemy import func
        result = await self.db.execute(select(func.count()).select_from(User))
        return result.scalar_one()
