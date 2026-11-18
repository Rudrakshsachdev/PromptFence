"""Pytest configuration and test fixtures."""

import os

# The rate limiter is process-wide and keys on the client IP, which is the same
# for every test, so a full run would trip it and make results depend on test
# order. Must be set before app settings are imported below.
os.environ.setdefault("RATE_LIMIT_REQUESTS", "1000000")

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import select

from app.core.database import Base
import app.core.database as core_db
from app.core.security import hash_password
from app.dependencies.database import get_db
import app.engine.orchestrator.service as orch_service
from app.main import app
from app.models.role import Permission, Role, RolePermission, UserRole
from app.models.user import User
from app.permissions.matrix import ROLE_PERMISSIONS_MATRIX
from app.permissions.roles import PermissionType, RoleType
import scripts.seed as seed_mod

# In-memory SQLite async engine using StaticPool for shared in-memory connection
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
test_async_session_factory = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Wire test session factory into application database references
core_db.engine = test_engine
core_db.async_session_factory = test_async_session_factory
orch_service.async_session_factory = test_async_session_factory
seed_mod.engine = test_engine
seed_mod.async_session_factory = test_async_session_factory


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
async def setup_test_db():
    """Ensure clean schema and deterministic seed data for all test executions."""
    core_db.engine = test_engine
    core_db.async_session_factory = test_async_session_factory
    orch_service.async_session_factory = test_async_session_factory
    seed_mod.engine = test_engine
    seed_mod.async_session_factory = test_async_session_factory

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await seed_mod.seed()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    """Provide an isolated database session for integration tests."""
    async with test_async_session_factory() as session:
        yield session


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Provide a verified security researcher user with Password123! credentials."""
    res = await db_session.execute(
        select(User).where(User.email == "researcher@promptfence.internal")
    )
    user = res.scalar_one_or_none()
    if user:
        user.password_hash = hash_password("Password123!")
        user.is_verified = True
        user.is_active = True
        await db_session.commit()
        await db_session.refresh(user)
    else:
        user = User(
            email="researcher@promptfence.internal",
            password_hash=hash_password("Password123!"),
            full_name="Alice Researcher",
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
    return user


@pytest.fixture
async def client():
    """Provide an asynchronous HTTP test client for FastAPI routes."""
    async def override_get_db():
        # Mirror app.dependencies.database.get_db: commit on success, roll back
        # on error. Without the commit, anything created through the API
        # vanished at the end of its request.
        async with test_async_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
