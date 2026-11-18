"""Aggregate queries for the security researcher overview (one round trip each)."""

from typing import Any

from sqlalchemy import case, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import (
    FindingSeverity,
    FindingStatus,
    FindingStatusHistory,
    TaintFinding,
    TestRun,
)
from app.models.target import Target

_OPEN = TaintFinding.status == FindingStatus.OPEN.value


def _count_where(condition: Any) -> Any:
    return func.coalesce(func.sum(case((condition, 1), else_=0)), 0)


class SecurityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def run_status_counts(self) -> tuple[dict[str, int], int]:
        """Executions per lifecycle state, and the number of distinct targets ever assessed."""
        rows = (
            await self.db.execute(select(TestRun.status, func.count()).group_by(TestRun.status))
        ).all()
        by_status = {(s.value if hasattr(s, "value") else str(s)): int(n) for s, n in rows}
        assessed = (
            await self.db.execute(
                select(func.count(distinct(TestRun.target_id))).where(
                    TestRun.target_id.is_not(None)
                )
            )
        ).scalar_one()
        return by_status, int(assessed)

    async def finding_status_severity_counts(self) -> list[tuple[str, str, int]]:
        rows = (
            await self.db.execute(
                select(TaintFinding.status, TaintFinding.severity, func.count()).group_by(
                    TaintFinding.status, TaintFinding.severity
                )
            )
        ).all()
        return [
            (str(status), sev.value if hasattr(sev, "value") else str(sev), int(n))
            for status, sev, n in rows
        ]

    async def category_counts(self) -> list[tuple[str, int, int]]:
        rows = (
            await self.db.execute(
                select(TaintFinding.category, func.count(), _count_where(_OPEN))
                .group_by(TaintFinding.category)
                .order_by(func.count().desc())
            )
        ).all()
        return [(str(cat), int(total), int(open_)) for cat, total, open_ in rows]

    async def targets_by_findings(self, limit: int = 5) -> list[dict[str, Any]]:
        """Targets with the most open (then total) findings across their executions."""
        open_count = _count_where(_OPEN)
        total = func.count(TaintFinding.id)
        rows = (
            await self.db.execute(
                select(
                    Target.id,
                    Target.name,
                    total,
                    open_count,
                    _count_where(TaintFinding.severity == FindingSeverity.CRITICAL),
                    _count_where(TaintFinding.severity == FindingSeverity.HIGH),
                )
                .join(TestRun, TestRun.target_id == Target.id)
                .join(TaintFinding, TaintFinding.test_run_id == TestRun.id)
                .group_by(Target.id, Target.name)
                .order_by(open_count.desc(), total.desc(), Target.name)
                .limit(limit)
            )
        ).all()
        return [
            {
                "target_id": tid,
                "target_name": name,
                "findings": int(t),
                "open_findings": int(o),
                "critical": int(c),
                "high": int(h),
            }
            for tid, name, t, o, c, h in rows
        ]

    async def recent_status_changes(self, limit: int = 8) -> list[dict[str, Any]]:
        rows = (
            await self.db.execute(
                select(
                    FindingStatusHistory.finding_id,
                    TaintFinding.title,
                    TaintFinding.severity,
                    FindingStatusHistory.old_status,
                    FindingStatusHistory.new_status,
                    FindingStatusHistory.created_at,
                )
                .join(TaintFinding, TaintFinding.id == FindingStatusHistory.finding_id)
                .order_by(FindingStatusHistory.created_at.desc())
                .limit(limit)
            )
        ).all()
        return [
            {
                "finding_id": fid,
                "finding_title": title,
                "severity": sev.value if hasattr(sev, "value") else str(sev),
                "old_status": old,
                "new_status": new,
                "changed_at": changed_at,
            }
            for fid, title, sev, old, new, changed_at in rows
        ]


__all__ = ["SecurityRepository"]
