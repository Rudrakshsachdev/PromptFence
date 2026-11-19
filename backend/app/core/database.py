"""Async SQLAlchemy database engine and session configuration."""

import logging
import time
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, MetaData, event, exc, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.engine.interfaces import DBAPIConnection
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import ConnectionPoolEntry, PoolProxiedConnection

from app.core.config import settings

# Naming convention for constraints (Alembic auto-generation)
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

def _install_idle_ping(async_engine: AsyncEngine, idle_seconds: float) -> None:
    """Ping pooled connections only after they have sat idle for `idle_seconds`.

    SQLAlchemy's ``pool_pre_ping`` validates *every* checkout; on asyncpg that
    ping is wrapped in BEGIN/ROLLBACK (pgbouncer-safe), i.e. several network
    round trips added to every request. Connections in active use are not the
    stale ones, so this keeps the safety for idle connections without taxing
    hot ones. A failed ping raises DisconnectionError, which makes the pool
    discard that connection and transparently retry with a fresh one.
    """

    @event.listens_for(async_engine.sync_engine, "checkin")
    def _mark_returned(
        dbapi_connection: DBAPIConnection | None, connection_record: ConnectionPoolEntry
    ) -> None:
        connection_record.info["returned_at"] = time.monotonic()

    @event.listens_for(async_engine.sync_engine, "checkout")
    def _ping_if_idle(
        dbapi_connection: DBAPIConnection,
        connection_record: ConnectionPoolEntry,
        connection_proxy: PoolProxiedConnection,
    ) -> None:
        returned_at = connection_record.info.get("returned_at")
        if returned_at is None or time.monotonic() - returned_at < idle_seconds:
            return  # brand-new or recently used connection
        try:
            dbapi_connection.ping()  # asyncpg adapter: pgbouncer-safe ping
        except Exception as error:
            raise exc.DisconnectionError("Stale pooled connection") from error


logger = logging.getLogger(__name__)

engine: AsyncEngine | None = None
async_session_factory: async_sessionmaker[AsyncSession] | None = None
engine_initialization_error: Exception | None = None

try:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_pre_ping=False,  # replaced by the idle-aware ping below
        connect_args=(
            {"timeout": settings.DB_CONNECT_TIMEOUT_SECONDS}
            if settings.DATABASE_URL.startswith("postgresql+asyncpg")
            else {}
        ),
    )
    _install_idle_ping(engine, settings.DB_PING_IF_IDLE_SECONDS)
    async_session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
except Exception as exc:
    logger.error("Failed to initialize database engine: %s", exc, exc_info=True)
    engine = None
    async_session_factory = None
    engine_initialization_error = exc


class Base(DeclarativeBase):
    """Base model with common columns."""

    metadata = MetaData(naming_convention=convention)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
