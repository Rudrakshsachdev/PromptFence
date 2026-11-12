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
        role_repo = RoleRepository(db)
        user_roles = await role_repo.get_user_roles(current_user.id)
        role_names = [ur.role.name for ur in user_roles if ur.role]

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
        role_repo = RoleRepository(db)
        user_roles = await role_repo.get_user_roles(current_user.id)
        role_names = [ur.role.name for ur in user_roles if ur.role]

        if "admin" in role_names:
            return current_user  # Admin bypass

        permissions = await role_repo.get_user_permissions(current_user.id)
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

