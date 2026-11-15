"""Reports and Exports API router."""

import os
from pathlib import Path
from typing import Annotated
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.phase3 import ReportStatus
from app.models.user import User
from app.schemas.reports import ReportCreate, ReportJobResponse
from app.services import audit_service, reporting_service

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])


async def _run_report_worker(job_id: uuid.UUID):
    async with async_session_factory() as session:
        await reporting_service.process_report_job(session, job_id)


@router.post("", response_model=ReportJobResponse)
async def request_report(
    body: ReportCreate,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Queue generation of a security report in PDF, JSON, or CSV format."""
    job = await reporting_service.create_report_job(
        db,
        title=body.title,
        report_format=body.format,
        scope=body.scope,
        user_id=current_user.id,
    )
    background_tasks.add_task(_run_report_worker, job.id)
    return job


@router.get("", response_model=list[ReportJobResponse])
async def list_reports(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List historical report generation jobs."""
    return await reporting_service.list_report_jobs(db)


@router.get("/{job_id}", response_model=ReportJobResponse)
async def get_report_status(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve status, metadata, and hash for a report generation job."""
    job = await reporting_service.get_report_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Report job not found")
    return job


@router.get("/{job_id}/download")
async def download_report_artifact(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Download generated report artifact file (authorized access only)."""
    job = await reporting_service.get_report_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Report job not found")
    if job.status != ReportStatus.COMPLETED or not job.artifact_path:
        raise HTTPException(status_code=400, detail="Report artifact is not ready for download")

    path = Path(job.artifact_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report artifact file not found on disk")

    await audit_service.log_audit_event(
        db,
        action="REPORT_DOWNLOADED",
        resource_type="REPORT_JOB",
        resource_id=str(job.id),
        user_id=current_user.id,
        details={"file_name": path.name, "file_size": job.file_size_bytes},
    )

    media_type = "application/pdf" if job.format.value == "PDF" else ("application/json" if job.format.value == "JSON" else "text/csv")
    return FileResponse(
        path=str(path),
        media_type=media_type,
        filename=path.name,
    )
