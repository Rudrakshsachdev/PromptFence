"""TestCase and SuiteTestCase models."""

import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TestCaseCategory(str, enum.Enum):
    PROMPT_INJECTION = "PROMPT_INJECTION"
    DATA_DISCLOSURE = "DATA_DISCLOSURE"
    TOOL_EXECUTION = "TOOL_EXECUTION"
    INSTRUCTION_CONFLICT = "INSTRUCTION_CONFLICT"
    REGRESSION = "REGRESSION"


class TestCaseSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[TestCaseCategory] = mapped_column(
        Enum(TestCaseCategory, name="test_case_category_enum"), nullable=False
    )
    severity: Mapped[TestCaseSeverity] = mapped_column(
        Enum(TestCaseSeverity, name="test_case_severity_enum"), nullable=False
    )
    attack_input_template: Mapped[str] = mapped_column(Text, nullable=False)
    expected_behavior: Mapped[str | None] = mapped_column(Text, nullable=True)
    assertion_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    applicable_target_types: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    owner: Mapped["User"] = relationship("User", back_populates="test_cases")  # noqa: F821
    suite_associations: Mapped[list["SuiteTestCase"]] = relationship(
        "SuiteTestCase", back_populates="test_case", cascade="all, delete-orphan"
    )


class SuiteTestCase(Base):
    __tablename__ = "suite_test_cases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    suite_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_suites.id", ondelete="CASCADE"), nullable=False
    )
    test_case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("test_cases.id", ondelete="CASCADE"), nullable=False
    )
    execution_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("suite_id", "test_case_id", name="uq_suite_test_cases_suite_test_case"),
    )

    suite: Mapped["TestSuite"] = relationship("TestSuite", back_populates="suite_test_cases")  # noqa: F821
    test_case: Mapped["TestCase"] = relationship("TestCase", back_populates="suite_associations")
