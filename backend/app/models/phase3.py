"""SQLAlchemy ORM models for Phase 3:
- Security Baselines & Regression Testing
- Security-Utility Evaluation & Paired Testing
- Research Experiments & 6 Research Evaluation Metrics
- Evidence-Based Reporting & Artifacts
- Audit Logs
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ==========================================
# 1. Regression & Baselines
# ==========================================

class RegressionClassification(str, enum.Enum):
    NEW = "NEW"
    RESOLVED = "RESOLVED"
    RECURRING = "RECURRING"
    UNCHANGED = "UNCHANGED"
    INCONCLUSIVE = "INCONCLUSIVE"


class SecurityBaseline(Base):
    __tablename__ = "security_baselines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("targets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_version: Mapped[str] = mapped_column(String(100), default="1.0.0", nullable=False)
    test_suite_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_suites.id", ondelete="SET NULL"), nullable=True, index=True
    )
    source_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Immutable frozen snapshot of test cases, configurations, and scoring version
    baseline_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    metrics_summary: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    target: Mapped["Target"] = relationship("Target")  # noqa: F821
    test_suite: Mapped["TestSuite | None"] = relationship("TestSuite")  # noqa: F821
    source_run: Mapped["TestRun"] = relationship("TestRun")  # noqa: F821
    comparisons: Mapped[list["RegressionComparison"]] = relationship(
        "RegressionComparison", back_populates="baseline", cascade="all, delete-orphan"
    )


class RegressionComparison(Base):
    __tablename__ = "regression_comparisons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    baseline_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("security_baselines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    comparison_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("targets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_version: Mapped[str] = mapped_column(String(100), default="current", nullable=False)
    comparison_metrics: Mapped[dict] = mapped_column(JSON, nullable=False)
    summary_verdict: Mapped[str] = mapped_column(String(50), default="STABLE", nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    baseline: Mapped["SecurityBaseline"] = relationship("SecurityBaseline", back_populates="comparisons")
    comparison_run: Mapped["TestRun"] = relationship("TestRun")  # noqa: F821
    finding_matches: Mapped[list["RegressionFindingMatch"]] = relationship(
        "RegressionFindingMatch", back_populates="comparison", cascade="all, delete-orphan"
    )


class RegressionFindingMatch(Base):
    __tablename__ = "regression_finding_matches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comparison_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("regression_comparisons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    baseline_finding_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("taint_findings.id", ondelete="SET NULL"), nullable=True
    )
    comparison_finding_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("taint_findings.id", ondelete="SET NULL"), nullable=True
    )
    classification: Mapped[RegressionClassification] = mapped_column(
        Enum(RegressionClassification, name="regression_classification_enum"), nullable=False, index=True
    )
    fingerprint: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    confidence: Mapped[str] = mapped_column(String(20), default="HIGH", nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    comparison: Mapped["RegressionComparison"] = relationship("RegressionComparison", back_populates="finding_matches")


# ==========================================
# 2. Security-Utility Evaluation (Paired Testing)
# ==========================================

class SecurityUtilityEvaluation(Base):
    __tablename__ = "security_utility_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pair_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    adversarial_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_run_cases.id", ondelete="CASCADE"), nullable=True
    )
    benign_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_run_cases.id", ondelete="CASCADE"), nullable=True
    )
    security_verdict: Mapped[str] = mapped_column(String(30), default="PASSED", nullable=False)
    utility_verdict: Mapped[str] = mapped_column(String(30), default="SATISFIED", nullable=False)
    is_over_refusal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_utility_regression: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


# ==========================================
# 3. Research Evaluation (Controlled Experiments)
# ==========================================

class EvaluationExperiment(Base):
    __tablename__ = "evaluation_experiments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    dataset_name: Mapped[str] = mapped_column(String(100), nullable=False)
    dataset_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("targets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    canary_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    trace_linkage_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ground_truth_manifest: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False, index=True)
    repetitions: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    # The 6 research metrics:
    # 1. provenance_attribution_accuracy
    # 2. precision
    # 3. recall
    # 4. false_positive_rate
    # 5. event_completeness
    # 6. execution_latency_overhead_ms
    results_summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    target: Mapped["Target"] = relationship("Target")  # noqa: F821


# ==========================================
# 4. Evidence-Based Reporting & Artifacts
# ==========================================

class ReportStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ReportFormat(str, enum.Enum):
    PDF = "PDF"
    JSON = "JSON"
    CSV_FINDINGS = "CSV_FINDINGS"
    CSV_CASES = "CSV_CASES"
    CSV_ASSERTIONS = "CSV_ASSERTIONS"
    CSV_METRICS = "CSV_METRICS"


class ReportJob(Base):
    __tablename__ = "report_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    format: Mapped[ReportFormat] = mapped_column(
        Enum(ReportFormat, name="report_format_enum"), default=ReportFormat.PDF, nullable=False
    )
    scope: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status_enum"), default=ReportStatus.QUEUED, nullable=False, index=True
    )
    artifact_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ==========================================
# 5. Audit Logging
# ==========================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
