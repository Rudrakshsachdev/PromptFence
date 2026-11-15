"""SQLAlchemy models for test execution, dynamic canaries, assertions, events, and findings."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TestRunStatus(str, enum.Enum):
    __test__ = False
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class TestCaseExecutionStatus(str, enum.Enum):
    __test__ = False
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    ERROR = "ERROR"
    SKIPPED = "SKIPPED"
    CANCELLED = "CANCELLED"


class CanaryStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    OBSERVED = "OBSERVED"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"


class EventType(str, enum.Enum):
    RUN_CREATED = "RUN_CREATED"
    RUN_QUEUED = "RUN_QUEUED"
    RUN_STARTED = "RUN_STARTED"
    CASE_STARTED = "CASE_STARTED"
    CANARY_GENERATED = "CANARY_GENERATED"
    SOURCE_INSTRUMENTED = "SOURCE_INSTRUMENTED"
    ADAPTER_REQUEST_SENT = "ADAPTER_REQUEST_SENT"
    ADAPTER_RESPONSE_RECEIVED = "ADAPTER_RESPONSE_RECEIVED"
    TOOL_CALL_ATTEMPTED = "TOOL_CALL_ATTEMPTED"
    CANARY_OBSERVED = "CANARY_OBSERVED"
    ASSERTION_COMPLETED = "ASSERTION_COMPLETED"
    FINDING_CREATED = "FINDING_CREATED"
    CASE_COMPLETED = "CASE_COMPLETED"
    RUN_COMPLETED = "RUN_COMPLETED"
    RUN_FAILED = "RUN_FAILED"
    RUN_CANCELLED = "RUN_CANCELLED"


class AttributionLevel(str, enum.Enum):
    CONFIRMED_SOURCE_MATCH = "CONFIRMED_SOURCE_MATCH"
    OBSERVED_CANARY = "OBSERVED_CANARY"
    TRACE_CORRELATED = "TRACE_CORRELATED"
    INFERRED = "INFERRED"
    UNATTRIBUTED = "UNATTRIBUTED"


class FindingSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class AssertionType(str, enum.Enum):
    CANARY_EXPOSURE = "CANARY_EXPOSURE"
    UNAUTHORIZED_TOOL_CALL = "UNAUTHORIZED_TOOL_CALL"
    POLICY_VIOLATION = "POLICY_VIOLATION"
    INSTRUCTION_OVERRIDE = "INSTRUCTION_OVERRIDE"
    SENSITIVE_PATTERN_MATCH = "SENSITIVE_PATTERN_MATCH"
    EXPECTED_BEHAVIOR = "EXPECTED_BEHAVIOR"
    RESPONSE_VALIDATION = "RESPONSE_VALIDATION"
    TRACE_VALIDATION = "TRACE_VALIDATION"


class AssertionStatus(str, enum.Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    ERROR = "ERROR"
    SKIPPED = "SKIPPED"

class FindingStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    ACCEPTED_RISK = "ACCEPTED_RISK"

class TestRun(Base):
    __test__ = False
    __tablename__ = "test_runs"

    target_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("targets.id", ondelete="SET NULL"), nullable=True, index=True
    )
    test_suite_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_suites.id", ondelete="SET NULL"), nullable=True, index=True
    )
    initiated_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[TestRunStatus] = mapped_column(
        Enum(TestRunStatus, name="test_run_status_enum"), default=TestRunStatus.PENDING, nullable=False, index=True
    )
    execution_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    total_cases: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_cases: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    passed_cases: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_cases: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_cases: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    target: Mapped["Target"] = relationship("Target")  # noqa: F821
    test_suite: Mapped["TestSuite"] = relationship("TestSuite")  # noqa: F821
    initiator: Mapped["User"] = relationship("User")  # noqa: F821
    cases: Mapped[list["TestRunCase"]] = relationship(
        "TestRunCase", back_populates="test_run", cascade="all, delete-orphan",
        order_by="TestRunCase.execution_order"
    )
    canaries: Mapped[list["DynamicCanary"]] = relationship(
        "DynamicCanary", back_populates="test_run", cascade="all, delete-orphan"
    )
    events: Mapped[list["ExecutionEvent"]] = relationship(
        "ExecutionEvent", back_populates="test_run", cascade="all, delete-orphan",
        order_by="ExecutionEvent.created_at"
    )
    findings: Mapped[list["TaintFinding"]] = relationship(
        "TaintFinding", back_populates="test_run", cascade="all, delete-orphan",
        order_by="TaintFinding.created_at.desc()"
    )
    logs: Mapped[list["ExecutionLog"]] = relationship(
        "ExecutionLog", back_populates="test_run", cascade="all, delete-orphan",
        order_by="ExecutionLog.created_at"
    )


class TestRunCase(Base):
    __test__ = False
    __tablename__ = "test_run_cases"

    test_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scenario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_cases.id", ondelete="SET NULL"), nullable=True, index=True
    )
    scenario_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    scenario_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[TestCaseExecutionStatus] = mapped_column(
        Enum(TestCaseExecutionStatus, name="test_case_execution_status_enum"),
        default=TestCaseExecutionStatus.PENDING,
        nullable=False,
        index=True
    )
    execution_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    normalized_request_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    normalized_response_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    test_run: Mapped["TestRun"] = relationship("TestRun", back_populates="cases")
    scenario: Mapped["TestCase"] = relationship("TestCase")  # noqa: F821
    canaries: Mapped[list["DynamicCanary"]] = relationship(
        "DynamicCanary", back_populates="test_run_case", cascade="all, delete-orphan"
    )
    events: Mapped[list["ExecutionEvent"]] = relationship(
        "ExecutionEvent", back_populates="test_run_case", cascade="all, delete-orphan"
    )
    findings: Mapped[list["TaintFinding"]] = relationship(
        "TaintFinding", back_populates="test_run_case", cascade="all, delete-orphan"
    )
    assertion_results: Mapped[list["AssertionResult"]] = relationship(
        "AssertionResult", back_populates="test_run_case", cascade="all, delete-orphan"
    )
    traces: Mapped[list["TargetTrace"]] = relationship(
        "TargetTrace", back_populates="test_run_case", cascade="all, delete-orphan"
    )


class DynamicCanary(Base):
    __tablename__ = "dynamic_canaries"

    test_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    test_run_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_run_cases.id", ondelete="CASCADE"), nullable=True, index=True
    )
    source_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(100), default="RAG_DOCUMENT", nullable=False)
    digest: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    key_version: Mapped[str] = mapped_column(String(20), default="v1", nullable=False)
    status: Mapped[CanaryStatus] = mapped_column(
        Enum(CanaryStatus, name="canary_status_enum"), default=CanaryStatus.ACTIVE, nullable=False, index=True
    )
    token_preview: Mapped[str] = mapped_column(String(32), nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    test_run: Mapped["TestRun"] = relationship("TestRun", back_populates="canaries")
    test_run_case: Mapped["TestRunCase | None"] = relationship("TestRunCase", back_populates="canaries")


class ExecutionEvent(Base):
    __tablename__ = "execution_events"

    test_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    test_run_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_run_cases.id", ondelete="CASCADE"), nullable=True, index=True
    )
    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType, name="execution_event_type_enum"), nullable=False, index=True
    )
    level: Mapped[str] = mapped_column(String(20), default="INFO", nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    test_run: Mapped["TestRun"] = relationship("TestRun", back_populates="events")
    test_run_case: Mapped["TestRunCase | None"] = relationship("TestRunCase", back_populates="events")


class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    test_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    test_run_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_run_cases.id", ondelete="CASCADE"), nullable=True, index=True
    )
    level: Mapped[str] = mapped_column(String(20), default="INFO", nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    log_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    test_run: Mapped["TestRun"] = relationship("TestRun", back_populates="logs")


class TaintFinding(Base):
    __tablename__ = "taint_findings"

    test_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    test_run_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_run_cases.id", ondelete="CASCADE"), nullable=True, index=True
    )
    canary_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dynamic_canaries.id", ondelete="SET NULL"), nullable=True
    )
    source_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[FindingSeverity] = mapped_column(
        Enum(FindingSeverity, name="finding_severity_enum"), default=FindingSeverity.MEDIUM, nullable=False, index=True
    )
    confidence: Mapped[str] = mapped_column(String(50), default="HIGH", nullable=False)
    observation_location: Mapped[str] = mapped_column(String(100), default="FINAL_OUTPUT", nullable=False)
    detection_method: Mapped[str] = mapped_column(String(100), default="EXACT_TOKEN_MATCH", nullable=False)
    attribution_level: Mapped[AttributionLevel] = mapped_column(
        Enum(AttributionLevel, name="attribution_level_enum"), default=AttributionLevel.OBSERVED_CANARY, nullable=False
    )
    evidence_reference: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    deduplication_key: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="OPEN", server_default="OPEN", nullable=False, index=True
    )
    fingerprint: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    status_history: Mapped[list["FindingStatusHistory"]] = relationship(
        "FindingStatusHistory", back_populates="finding", cascade="all, delete-orphan"
    )

    test_run: Mapped["TestRun"] = relationship("TestRun", back_populates="findings")
    test_run_case: Mapped["TestRunCase | None"] = relationship("TestRunCase", back_populates="findings")
    canary: Mapped["DynamicCanary | None"] = relationship("DynamicCanary")


class AssertionResult(Base):
    __tablename__ = "assertion_results"

    test_run_case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_run_cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assertion_id: Mapped[str] = mapped_column(String(100), nullable=False)
    assertion_type: Mapped[AssertionType] = mapped_column(
        Enum(AssertionType, name="assertion_type_enum"), nullable=False
    )
    status: Mapped[AssertionStatus] = mapped_column(
        Enum(AssertionStatus, name="assertion_status_enum"), nullable=False
    )
    expected_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    actual_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    test_run_case: Mapped["TestRunCase"] = relationship("TestRunCase", back_populates="assertion_results")


class TargetTrace(Base):
    __tablename__ = "target_traces"

    test_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    test_run_case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_run_cases.id", ondelete="CASCADE"), nullable=True, index=True
    )
    source_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trace_type: Mapped[str] = mapped_column(String(100), nullable=False)
    trace_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    evidence_reference: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    test_run_case: Mapped["TestRunCase | None"] = relationship("TestRunCase", back_populates="traces")


class FindingStatusHistory(Base):
    __tablename__ = "finding_status_history"

    finding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("taint_findings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_status: Mapped[str] = mapped_column(String(30), nullable=False)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    finding: Mapped["TaintFinding"] = relationship("TaintFinding", back_populates="status_history")

