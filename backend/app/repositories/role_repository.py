"""Role & permission repository."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Permission, Role, RolePermission, UserRole


class RoleRepository:
    """Database operations for roles and permissions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Roles ──

    async def create_role(self, *, name: str, description: str | None = None) -> Role:
        role = Role(name=name, description=description)
        self.db.add(role)
        await self.db.flush()
        await self.db.refresh(role)
        return role

    async def get_role_by_name(self, name: str) -> Role | None:
        result = await self.db.execute(
            select(Role).options(selectinload(Role.role_permissions).selectinload(RolePermission.permission)).where(Role.name == name)
        )
        return result.scalar_one_or_none()

    async def get_role_by_id(self, role_id: uuid.UUID) -> Role | None:
        result = await self.db.execute(select(Role).where(Role.id == role_id))
        return result.scalar_one_or_none()

    async def list_roles(self) -> list[Role]:
        result = await self.db.execute(select(Role))
        return list(result.scalars().all())

    # ── Permissions ──

    async def create_permission(self, *, name: str, description: str | None = None) -> Permission:
        perm = Permission(name=name, description=description)
        self.db.add(perm)
        await self.db.flush()
        await self.db.refresh(perm)
        return perm

    async def get_permission_by_name(self, name: str) -> Permission | None:
        result = await self.db.execute(select(Permission).where(Permission.name == name))
        return result.scalar_one_or_none()

    async def assign_permission_to_role(self, role_id: uuid.UUID, permission_id: uuid.UUID) -> RolePermission:
        rp = RolePermission(role_id=role_id, permission_id=permission_id)
        self.db.add(rp)
        await self.db.flush()
        return rp

    # ── User-Role ──

    async def assign_role_to_user(self, user_id: uuid.UUID, role_id: uuid.UUID) -> UserRole:
        ur = UserRole(user_id=user_id, role_id=role_id)
        self.db.add(ur)
        await self.db.flush()
        return ur

    async def get_user_roles(self, user_id: uuid.UUID) -> list[UserRole]:
        result = await self.db.execute(
            select(UserRole).options(selectinload(UserRole.role)).where(UserRole.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_role_and_permission_names(
        self, user_id: uuid.UUID
    ) -> tuple[set[str], set[str]]:
        """A user's role names and permission names in a single query."""
        result = await self.db.execute(
            select(Role.name, Permission.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .outerjoin(RolePermission, RolePermission.role_id == Role.id)
            .outerjoin(Permission, Permission.id == RolePermission.permission_id)
            .where(UserRole.user_id == user_id)
        )
        roles: set[str] = set()
        permissions: set[str] = set()
        for role_name, permission_name in result.all():
            roles.add(role_name)
            if permission_name:
                permissions.add(permission_name)
        return roles, permissions

    async def get_user_permissions(self, user_id: uuid.UUID) -> list[str]:
        """Get all permission names for a user through their roles."""
        result = await self.db.execute(
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        )
        return list(result.scalars().all())
