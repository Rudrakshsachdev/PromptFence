"""Pytest configuration and test fixtures."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import Base
from app.core.security import hash_password
from app.dependencies.database import get_db
from app.main import app
from app.models.role import Permission, Role, RolePermission, UserRole
from app.models.user import User
from app.permissions.matrix import ROLE_PERMISSIONS_MATRIX
from app.permissions.roles import PermissionType, RoleType

try:
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    test_async_session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
except Exception:
    test_engine = None
    test_async_session_factory = None


@pytest.fixture
def anyio_backend():
    return "asyncio"
