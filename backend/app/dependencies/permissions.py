"""Permission and RBAC dependencies."""

from typing import Annotated, Callable

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError
from app.dependencies.auth import require_active_user
from app.dependencies.database import get_db
from app.models.user import User
from app.repositories.role_repository import RoleRepository


def require_role(required_role: str) -> Callable:
    """Dependency factory checking that the current user has a specific role."""
    async def role_checker(
        current_user: Annotated[User, Depends(require_active_user)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        role_names, _ = await RoleRepository(db).get_role_and_permission_names(current_user.id)

        if "admin" in role_names:
            return current_user  # Admin bypass

        if required_role not in role_names:
            raise AuthorizationError(f"Role '{required_role}' is required for this action")

        return current_user

    return role_checker


def require_permission(required_permission: str) -> Callable:
    """Dependency factory checking that the current user has a specific permission."""
    async def permission_checker(
        current_user: Annotated[User, Depends(require_active_user)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        role_names, permissions = await RoleRepository(db).get_role_and_permission_names(
            current_user.id
        )

        if "admin" in role_names:
            return current_user  # Admin bypass

        if required_permission not in permissions:
            raise AuthorizationError(f"Permission '{required_permission}' is required for this action")

        return current_user

    return permission_checker


def check_resource_ownership(resource_owner_id, user: User, user_roles: list[str]) -> None:
    """Ensure resource is owned by the user, or user is an admin."""
    if "admin" in user_roles:
        return
    if resource_owner_id != user.id:
        raise AuthorizationError("Access denied: You do not own this resource")

