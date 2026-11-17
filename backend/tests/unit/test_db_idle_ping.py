"""The connection pool pings a pooled connection only after it has been idle."""

import asyncio
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.dialects.sqlite.aiosqlite import AsyncAdapt_aiosqlite_connection
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import AsyncAdaptedQueuePool

from app.core.database import _install_idle_ping

IDLE = 0.05


@pytest.fixture
def ping_calls(monkeypatch: pytest.MonkeyPatch) -> list[int]:
    """Give the SQLite adapter a recording ping() (asyncpg's adapter has a real one)."""
    calls: list[int] = []

    def ping(self: AsyncAdapt_aiosqlite_connection) -> None:
        calls.append(1)

    monkeypatch.setattr(AsyncAdapt_aiosqlite_connection, "ping", ping, raising=False)
    return calls


def make_engine(tmp_path: Path):  # noqa: ANN201
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'pool.db'}",
        poolclass=AsyncAdaptedQueuePool,
        pool_size=1,
        max_overflow=0,
    )
    _install_idle_ping(engine, IDLE)
    return engine


async def run_query(engine) -> None:  # noqa: ANN001
    async with engine.connect() as conn:
        assert (await conn.execute(text("SELECT 1"))).scalar() == 1


async def test_recently_used_connections_are_not_pinged(tmp_path: Path, ping_calls: list[int]):
    engine = make_engine(tmp_path)
    for _ in range(3):
        await run_query(engine)  # back-to-back reuse, well inside the idle window
    await engine.dispose()

    assert ping_calls == []


async def test_idle_connection_is_pinged_before_reuse(tmp_path: Path, ping_calls: list[int]):
    engine = make_engine(tmp_path)
    await run_query(engine)
    await asyncio.sleep(IDLE * 3)
    await run_query(engine)
    await engine.dispose()

    assert ping_calls == [1]


async def test_stale_connection_is_replaced_transparently(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
):
    connects: list[int] = []
    engine = make_engine(tmp_path)

    from sqlalchemy import event

    event.listen(engine.sync_engine, "connect", lambda *_: connects.append(1))

    def failing_once(self: AsyncAdapt_aiosqlite_connection) -> None:
        monkeypatch.setattr(
            AsyncAdapt_aiosqlite_connection, "ping", lambda self: None, raising=False
        )
        raise ConnectionError("server closed the connection")

    await run_query(engine)
    monkeypatch.setattr(AsyncAdapt_aiosqlite_connection, "ping", failing_once, raising=False)
    await asyncio.sleep(IDLE * 3)
    await run_query(engine)  # must succeed on a fresh connection, not raise
    await engine.dispose()

    assert len(connects) == 2
