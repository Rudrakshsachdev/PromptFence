"""Evidence-Based Reporting Service.
Asynchronously generates PDF reports (via ReportLab), structured JSON exports,
and CSV exports with integrity hashing and secret redaction.
"""

import csv
import hashlib
import io
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.execution import (
    AssertionResult,
    DynamicCanary,
    TaintFinding,
    TestRun,
    TestRunCase,
)
from app.models.phase3 import (
    ReportFormat,
    ReportJob,
    ReportStatus,
    SecurityBaseline,
)
from app.services.audit_service import log_audit_event

REPORT_STORAGE_DIR = Path("backend/artifacts/reports")


def redact_secrets(val: Any) -> Any:
    """Recursively redact API keys, tokens, and authorization headers."""
    if isinstance(val, dict):
        redacted = {}
        for k, v in val.items():
            k_lower = k.lower()
            if any(s in k_lower for s in ("key", "secret", "auth", "password", "bearer")) and not isinstance(v, (dict, list)):
                redacted[k] = "[REDACTED]"
            elif "token" in k_lower and not isinstance(v, (dict, list)):
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_secrets(v)
        return redacted
    if isinstance(val, list):
        return [redact_secrets(item) for item in val]
    return val


def generate_pdf_report(
    output_path: Path,
    title: str,
    run: TestRun | None,
    findings: list[TaintFinding],
    cases: list[TestRunCase],
) -> None:
    """Generate a multi-page PDF security report using ReportLab."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.platypus import (
        HRFlowable,
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Heading1"],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=10,
    )
    h2_style = ParagraphStyle(
        "Heading2Custom",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0D9488"),
        spaceBefore=14,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )
    mono_style = ParagraphStyle(
        "MonoCustom",
        parent=styles["Code"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0F766E"),
    )

    story = []

    # 1. Header & Title
    story.append(Spacer(1, 20))
    story.append(Paragraph("PROMPTFENCE — SECURITY LAB", ParagraphStyle("Brand", fontSize=10, textColor=colors.HexColor("#0D9488"), fontName="Helvetica-Bold")))
    story.append(Spacer(1, 6))
    story.append(Paragraph(title, title_style))
    story.append(Paragraph("AI Application Security & Dynamic Canary Tainting Audit Report", ParagraphStyle("Subtitle", fontSize=12, textColor=colors.HexColor("#64748B"), spaceAfter=15)))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0D9488"), spaceAfter=15))

    # 2. Executive Metadata Table
    target_name = run.target.name if (run and run.target) else "Configured AI Target"
    target_type = str(run.target.target_type.value) if (run and run.target) else "API Endpoint"
    gen_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    meta_data = [
        [Paragraph("<b>Target Application:</b>", body_style), Paragraph(target_name, body_style)],
        [Paragraph("<b>Target Architecture:</b>", body_style), Paragraph(target_type, body_style)],
        [Paragraph("<b>Execution Run ID:</b>", body_style), Paragraph(str(run.id) if run else "Aggregated", mono_style)],
        [Paragraph("<b>Report Generated:</b>", body_style), Paragraph(gen_time, body_style)],
        [Paragraph("<b>Total Scenarios Evaluated:</b>", body_style), Paragraph(str(len(cases)), body_style)],
        [Paragraph("<b>Security Findings Detected:</b>", body_style), Paragraph(str(len(findings)), body_style)],
    ]
    t = Table(meta_data, colWidths=[150, 380])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # 3. Executive Summary
    story.append(Paragraph("1. Executive Summary", h2_style))
    crit_count = sum(1 for f in findings if f.severity.value == "CRITICAL")
    high_count = sum(1 for f in findings if f.severity.value == "HIGH")
    canary_leaks = sum(1 for f in findings if f.canary_id or f.attribution_level.value == "CONFIRMED_SOURCE_MATCH")

    summary_text = (
        f"This automated security evaluation assessed the target system across {len(cases)} adversarial "
        f"and benign scenarios. Testing identified <b>{len(findings)} vulnerability finding(s)</b>, including "
        f"<b>{crit_count} Critical</b> and <b>{high_count} High</b> severity item(s). "
        f"Dynamic canary tainting detected <b>{canary_leaks} instance(s)</b> of unambiguous token exposure, "
        "confirming indirect injection or sensitive data exfiltration pathways."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 15))

    # 4. Findings Summary Table
    story.append(Paragraph("2. Vulnerability Findings", h2_style))
    if findings:
        f_rows = [[
            Paragraph("<b>Severity</b>", body_style),
            Paragraph("<b>Category</b>", body_style),
            Paragraph("<b>Finding Title</b>", body_style),
            Paragraph("<b>Attribution</b>", body_style),
            Paragraph("<b>Status</b>", body_style),
        ]]
        for f in findings:
            sev_color = "#DC2626" if f.severity.value == "CRITICAL" else ("#D97706" if f.severity.value == "HIGH" else "#475569")
            sev_p = Paragraph(f"<font color='{sev_color}'><b>{f.severity.value}</b></font>", body_style)
            f_rows.append([
                sev_p,
                Paragraph(f.category, body_style),
                Paragraph(f.title, body_style),
                Paragraph(f.attribution_level.value, mono_style),
                Paragraph(f.status, body_style),
            ])
        ft = Table(f_rows, colWidths=[65, 110, 195, 110, 50])
        ft.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(ft)
    else:
        story.append(Paragraph("No vulnerability findings were discovered during this test run.", body_style))

    story.append(Spacer(1, 15))

    # 5. Scientific Provenance & Recommendations
    story.append(Paragraph("3. Defensive Recommendations", h2_style))
    recs = [
        "1. <b>Strict Input Enveloping:</b> Isolate untrusted retrieved documents inside structured delimiters to prevent indirect prompt injection.",
        "2. <b>Tool Permission Boundaries:</b> Enforce explicit user consent or role authorization prior to executing state-altering actions.",
        "3. <b>Canary Token Regression Guard:</b> Maintain continuous session-bound canary testing in CI/CD pipelines to catch taint leakage regressions.",
    ]
    for r in recs:
        story.append(Paragraph(r, body_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 15))
    story.append(Paragraph("4. Scientific Provenance Limitations", h2_style))
    disclaimer = (
        "<b>Notice:</b> Canary detection serves as a high-fidelity measurable indicator of synthetic token leakage. "
        "It proves that planted tokens traversed monitored execution boundaries. Absence of exact canary leakage "
        "indicates resistance on instrumented paths, but does not guarantee exhaustiveness against un-instrumented vectors."
    )
    story.append(Paragraph(disclaimer, ParagraphStyle("Disc", parent=body_style, textColor=colors.HexColor("#64748B"))))

    doc.build(story)


async def create_report_job(
    db: AsyncSession,
    *,
    title: str,
    report_format: ReportFormat,
    scope: dict[str, Any],
    user_id: uuid.UUID,
) -> ReportJob:
    """Queue a report generation task."""
    job = ReportJob(
        id=uuid.uuid4(),
        title=title.strip(),
        format=report_format,
        scope=scope,
        status=ReportStatus.QUEUED,
        created_by=user_id,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await log_audit_event(
        db,
        action="REPORT_REQUESTED",
        resource_type="REPORT_JOB",
        resource_id=str(job.id),
        user_id=user_id,
        details={"title": title, "format": report_format.value},
    )
    return job


async def process_report_job(db: AsyncSession, job_id: uuid.UUID) -> ReportJob:
    """Asynchronously execute report generation and persist artifact file."""
    stmt = select(ReportJob).where(ReportJob.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Report job not found")

    job.status = ReportStatus.RUNNING
    await db.commit()

    REPORT_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    try:
        scope = job.scope or {}
        test_run_id_str = scope.get("test_run_id")
        test_run = None
        findings = []
        cases = []

        if test_run_id_str:
            t_id = uuid.UUID(test_run_id_str)
            run_stmt = (
                select(TestRun)
                .options(
                    selectinload(TestRun.target),
                    selectinload(TestRun.cases),
                    selectinload(TestRun.findings),
                )
                .where(TestRun.id == t_id)
            )
            run_res = await db.execute(run_stmt)
            test_run = run_res.scalar_one_or_none()
            if test_run:
                findings = list(test_run.findings)
                cases = list(test_run.cases)
        else:
            # Query recent findings
            f_res = await db.execute(select(TaintFinding).limit(50))
            findings = list(f_res.scalars().all())

        filename = f"report_{job.id}.{job.format.value.lower().split('_')[0]}"
        if job.format == ReportFormat.PDF:
            filename = f"report_{job.id}.pdf"
            file_path = REPORT_STORAGE_DIR / filename
            generate_pdf_report(file_path, job.title, test_run, findings, cases)

        elif job.format == ReportFormat.JSON:
            filename = f"report_{job.id}.json"
            file_path = REPORT_STORAGE_DIR / filename
            report_data = {
                "schema_version": "promptfence-report-v3.0.json",
                "report_id": str(job.id),
                "title": job.title,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "scope": scope,
                "target": {
                    "id": str(test_run.target_id) if test_run else None,
                    "name": test_run.target.name if (test_run and test_run.target) else "Target",
                },
                "summary": {
                    "total_cases": len(cases),
                    "total_findings": len(findings),
                    "critical_findings": sum(1 for f in findings if f.severity.value == "CRITICAL"),
                },
                "findings": [
                    {
                        "id": str(f.id),
                        "category": f.category,
                        "title": f.title,
                        "severity": f.severity.value,
                        "attribution_level": f.attribution_level.value,
                        "evidence": redact_secrets(f.evidence_reference),
                    }
                    for f in findings
                ],
            }
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(report_data, f, indent=2)

        else:
            # CSV export
            filename = f"report_{job.id}.csv"
            file_path = REPORT_STORAGE_DIR / filename
            with open(file_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["id", "category", "title", "severity", "attribution_level", "status", "observed_at"])
                for f in findings:
                    writer.writerow([str(f.id), f.category, f.title, f.severity.value, f.attribution_level.value, f.status, f.observed_at.isoformat()])

        # Compute file stats and SHA-256 hash
        file_bytes = file_path.read_bytes()
        content_hash = hashlib.sha256(file_bytes).hexdigest()

        job.status = ReportStatus.COMPLETED
        job.artifact_path = str(file_path)
        job.file_size_bytes = len(file_bytes)
        job.content_hash = content_hash
        job.completed_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(job)

        await log_audit_event(
            db,
            action="REPORT_GENERATED",
            resource_type="REPORT_JOB",
            resource_id=str(job.id),
            user_id=job.created_by,
            details={"file_size": len(file_bytes), "hash": content_hash},
        )

    except Exception as e:
        job.status = ReportStatus.FAILED
        job.error_message = str(e)
        await db.commit()
        await db.refresh(job)

    return job


async def get_report_job(db: AsyncSession, job_id: uuid.UUID) -> ReportJob | None:
    stmt = select(ReportJob).where(ReportJob.id == job_id)
    res = await db.execute(stmt)
    return res.scalar_one_or_none()


async def list_report_jobs(db: AsyncSession) -> list[ReportJob]:
    stmt = select(ReportJob).order_by(ReportJob.created_at.desc())
    res = await db.execute(stmt)
    return list(res.scalars().all())
