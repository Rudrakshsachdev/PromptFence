"""Database session dependency."""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session per request."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

