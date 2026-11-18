"""Security researcher workspace: posture summary built from recorded data only."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import FindingSeverity, FindingStatus, TestRunStatus
from app.repositories.security_repository import SecurityRepository
from app.schemas.security import (
    CategoryCount,
    FindingCounts,
    FindingStatusChange,
    RunStatusCounts,
    SecurityOverviewResponse,
    TargetRiskItem,
)


async def get_security_overview(db: AsyncSession) -> SecurityOverviewResponse:
    """Aggregate counts for the researcher overview.

    Every state and severity is present in the maps (zero when absent) so the
    UI never has to guess whether a missing key means "none" or "unknown".
    """
    repo = SecurityRepository(db)
    run_counts, assessed_targets = await repo.run_status_counts()
    by_status_severity = await repo.finding_status_severity_counts()

    by_status = {s.value: 0 for s in FindingStatus}
    by_severity = {s.value: 0 for s in FindingSeverity}
    open_by_severity = {s.value: 0 for s in FindingSeverity}
    for status, severity, n in by_status_severity:
        by_status[status] = by_status.get(status, 0) + n
        by_severity[severity] = by_severity.get(severity, 0) + n
        if status == FindingStatus.OPEN.value:
            open_by_severity[severity] = open_by_severity.get(severity, 0) + n

    runs_by_status = {s.value: run_counts.get(s.value, 0) for s in TestRunStatus}

    return SecurityOverviewResponse(
        runs=RunStatusCounts(
            total=sum(runs_by_status.values()),
            by_status=runs_by_status,
            assessed_targets=assessed_targets,
        ),
        findings=FindingCounts(
            total=sum(by_status.values()),
            by_status=by_status,
            by_severity=by_severity,
            open_by_severity=open_by_severity,
        ),
        top_targets=[TargetRiskItem(**row) for row in await repo.targets_by_findings()],
        categories=[
            CategoryCount(category=c, findings=t, open_findings=o)
            for c, t, o in await repo.category_counts()
        ],
        recent_status_changes=[
            FindingStatusChange(**row) for row in await repo.recent_status_changes()
        ],
    )
