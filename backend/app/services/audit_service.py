"""Audit logging service for tracking critical security actions."""

import uuid
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.phase3 import AuditLog


async def log_audit_event(
    db: AsyncSession,
    *,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    user_id: uuid.UUID | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    """Record an immutable audit log entry."""
    entry = AuditLog(
        id=uuid.uuid4(),
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry
