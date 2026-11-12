"""User service for profile management and session control."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, NotFoundError
from app.core.security import hash_password, verify_password
from app.models.session import RefreshToken
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository


class UserService:
    """Business logic for user operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.session_repo = SessionRepository(db)
        self.role_repo = RoleRepository(db)

    async def get_profile(self, user: User) -> tuple[User, list[str]]:
        """Get user profile and their assigned roles."""
        user_roles = await self.role_repo.get_user_roles(user.id)
        role_names = [ur.role.name for ur in user_roles if ur.role]
        return user, role_names

    async def update_profile(
        self, user: User, *, full_name: str | None = None, avatar_url: str | None = None
    ) -> User:
        """Update user profile information."""
        update_data = {}
        if full_name is not None:
            update_data["full_name"] = full_name.strip()
        if avatar_url is not None:
            update_data["avatar_url"] = avatar_url.strip()

        return await self.user_repo.update(user, **update_data)

    async def change_password(
        self, user: User, *, current_password: str, new_password: str
    ) -> None:
        """Verify current password, update to new password, and revoke other sessions."""
        if not verify_password(current_password, user.password_hash):
            raise AuthenticationError("Current password is incorrect")

        user.password_hash = hash_password(new_password)
        await self.user_repo.update(user)

        # Invalidate all prior sessions except current
        await self.session_repo.revoke_all_user_tokens(user.id)

    async def get_sessions(self, user_id: uuid.UUID) -> list[RefreshToken]:
        """List active sessions for a user."""
        return await self.session_repo.get_active_sessions(user_id)

    async def revoke_session(self, user_id: uuid.UUID, session_id: uuid.UUID) -> None:
        """Revoke a specific active session."""
        success = await self.session_repo.revoke_session(session_id, user_id)
        if not success:
            raise NotFoundError("Session not found or already terminated")

