"""Findings triage: search/filter/sort and validated status transitions."""
import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import FindingSeverity, FindingStatusHistory, TaintFinding

VALID_STATUSES = {"OPEN", "ACKNOWLEDGED", "RESOLVED", "FALSE_POSITIVE", "ACCEPTED_RISK"}
ALLOWED_TRANSITIONS = {
    "OPEN": {"ACKNOWLEDGED", "RESOLVED", "FALSE_POSITIVE", "ACCEPTED_RISK"},
    "ACKNOWLEDGED": {"OPEN", "RESOLVED", "FALSE_POSITIVE", "ACCEPTED_RISK"},
    "RESOLVED": {"OPEN"},
    "FALSE_POSITIVE": {"OPEN"},
    "ACCEPTED_RISK": {"OPEN", "RESOLVED"},
}
RATIONALE_REQUIRED = {"RESOLVED", "FALSE_POSITIVE", "ACCEPTED_RISK"}

_SEVERITY_RANK = case(
    (TaintFinding.severity == FindingSeverity.CRITICAL, 0),
    (TaintFinding.severity == FindingSeverity.HIGH, 1),
    (TaintFinding.severity == FindingSeverity.MEDIUM, 2),
    (TaintFinding.severity == FindingSeverity.LOW, 3),
    else_=4,
)


async def list_findings(
    db: AsyncSession, *, page: int, page_size: int, status=None, severity=None,
    category=None, test_run_id=None, detection_method=None, search=None,
    date_from: datetime | None = None, date_to: datetime | None = None, sort: str = "newest",
):
    stmt = select(TaintFinding)
    if status:
        stmt = stmt.where(TaintFinding.status == status)
    if severity:
        stmt = stmt.where(TaintFinding.severity == severity)
    if category:
        stmt = stmt.where(TaintFinding.category == category)
    if test_run_id:
        stmt = stmt.where(TaintFinding.test_run_id == test_run_id)
    if detection_method:
        stmt = stmt.where(TaintFinding.detection_method == detection_method)
    if date_from:
        stmt = stmt.where(TaintFinding.observed_at >= date_from)
    if date_to:
        stmt = stmt.where(TaintFinding.observed_at <= date_to)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(
            TaintFinding.title.ilike(like),
            TaintFinding.description.ilike(like),
            TaintFinding.category.ilike(like),
        ))

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()

    order = {
        "oldest": [TaintFinding.observed_at.asc()],
        "severity": [_SEVERITY_RANK.asc(), TaintFinding.observed_at.desc()],
        "status": [TaintFinding.status.asc(), TaintFinding.observed_at.desc()],
    }.get(sort, [TaintFinding.observed_at.desc()])
    stmt = stmt.order_by(*order).offset((page - 1) * page_size).limit(page_size)
    items = (await db.execute(stmt)).scalars().all()
    return items, total


async def get_finding(db: AsyncSession, finding_id: uuid.UUID):
    return (await db.execute(select(TaintFinding).where(TaintFinding.id == finding_id))).scalar_one_or_none()


async def change_status(
    db: AsyncSession, finding: TaintFinding, *, new_status: str, user_id: uuid.UUID,
    rationale: str | None, review_date: datetime | None,
):
    if new_status not in VALID_STATUSES:
        raise HTTPException(422, f"Invalid status '{new_status}'")
    old = finding.status
    if new_status == old:
        raise HTTPException(409, f"Finding is already {old}")
    if new_status not in ALLOWED_TRANSITIONS[old]:
        raise HTTPException(409, f"Transition {old} -> {new_status} is not allowed")
    if new_status in RATIONALE_REQUIRED and not (rationale and rationale.strip()):
        raise HTTPException(422, f"A rationale is required for {new_status}")

    finding.status = new_status
    db.add(FindingStatusHistory(
        finding_id=finding.id, old_status=old, new_status=new_status, changed_by=user_id,
        rationale=rationale.strip() if rationale else None,
        review_date=review_date if new_status == "ACCEPTED_RISK" else None,
    ))
    await db.commit()
    await db.refresh(finding)
    return finding


async def get_history(db: AsyncSession, finding_id: uuid.UUID):
    stmt = (select(FindingStatusHistory).where(FindingStatusHistory.finding_id == finding_id)
            .order_by(FindingStatusHistory.created_at.desc()))
    return (await db.execute(stmt)).scalars().all()
