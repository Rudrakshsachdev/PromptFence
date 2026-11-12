"""TestSuite model."""

import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TestSuite(Base):
    __tablename__ = "test_suites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    owner: Mapped["User"] = relationship("User", back_populates="test_suites")  # noqa: F821
    suite_test_cases: Mapped[list["SuiteTestCase"]] = relationship(  # noqa: F821
        "SuiteTestCase", back_populates="suite", cascade="all, delete-orphan",
        order_by="SuiteTestCase.execution_order"
    )


# Re-export SuiteTestCase for convenience
from app.models.test_case import SuiteTestCase  # noqa: E402, F401
