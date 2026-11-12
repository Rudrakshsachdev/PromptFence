"""Script to create or reset portal login credentials directly in the database."""

import asyncio
import logging
import sys

from sqlalchemy import select
from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.role import Role, UserRole
from app.models.user import User
from app.permissions.roles import RoleType

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("create_credentials")

USERS_TO_ENSURE = [
    {
        "email": "admin@promptfence.internal",
        "password": "AdminSecurePass123!",
        "full_name": "System Administrator",
        "role": RoleType.ADMIN.value,
    },
    {
        "email": "researcher@promptfence.internal",
        "password": "ResearcherPass123!",
        "full_name": "Security Researcher",
        "role": RoleType.SECURITY_RESEARCHER.value,
    },
    {
        "email": "viewer@promptfence.internal",
        "password": "ViewerPass123!",
        "full_name": "Security Auditor / Viewer",
        "role": RoleType.VIEWER.value,
    },
]


async def create_or_update_credentials() -> None:
    logger.info("Connecting to database...")
    async with async_session_factory() as db:
        for user_data in USERS_TO_ENSURE:
            email = user_data["email"]
            password = user_data["password"]
            role_name = user_data["role"]
            full_name = user_data["full_name"]

            # Fetch role
            role_res = await db.execute(select(Role).where(Role.name == role_name))
            role_obj = role_res.scalar_one_or_none()
            if not role_obj:
                logger.warning("Role '%s' not found. Creating it...", role_name)
                role_obj = Role(name=role_name, description=f"{role_name.replace('_', ' ').title()} role")
                db.add(role_obj)
                await db.flush()

            # Check if user exists
            user_res = await db.execute(select(User).where(User.email == email))
            user = user_res.scalar_one_or_none()

            pwd_hash = hash_password(password)

            if not user:
                user = User(
                    email=email,
                    password_hash=pwd_hash,
                    full_name=full_name,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                await db.flush()
                logger.info("Created user: %s", email)
            else:
                user.password_hash = pwd_hash
                user.is_active = True
                user.is_verified = True
                logger.info("Updated password/status for existing user: %s", email)

            # Ensure role assignment
            ur_res = await db.execute(
                select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == role_obj.id)
            )
            if not ur_res.scalar_one_or_none():
                db.add(UserRole(user_id=user.id, role_id=role_obj.id))
                await db.flush()
                logger.info("Assigned role '%s' to %s", role_name, email)

        await db.commit()
        logger.info("All test credentials configured successfully!")


if __name__ == "__main__":
    asyncio.run(create_or_update_credentials())

