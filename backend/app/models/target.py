"""Target model for AI endpoints to test."""

import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TargetType(str, enum.Enum):
    CHAT_API = "CHAT_API"
    COMPLETION_API = "COMPLETION_API"
    AGENT_API = "AGENT_API"
    CUSTOM = "CUSTOM"


class AuthenticationType(str, enum.Enum):
    NONE = "NONE"
    BEARER = "BEARER"
    API_KEY = "API_KEY"
    BASIC = "BASIC"


class Target(Base):
    __tablename__ = "targets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_type: Mapped[TargetType] = mapped_column(
        Enum(TargetType, name="target_type_enum"), nullable=False
    )
    base_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    endpoint: Mapped[str] = mapped_column(String(2048), nullable=False)
    http_method: Mapped[str] = mapped_column(String(10), default="GET", nullable=False)
    authentication_type: Mapped[AuthenticationType] = mapped_column(
        Enum(AuthenticationType, name="authentication_type_enum"),
        default=AuthenticationType.NONE,
        nullable=False,
    )
    headers_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    request_template: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    expected_response_format: Mapped[str | None] = mapped_column(Text, nullable=True)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="targets")  # noqa: F821
    versions: Mapped[list["TargetVersion"]] = relationship(
        "TargetVersion", back_populates="target", cascade="all, delete-orphan",
        order_by="TargetVersion.version_number.desc()"
    )


class TargetVersion(Base):
    __tablename__ = "target_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("targets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    configuration_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)

    target: Mapped["Target"] = relationship("Target", back_populates="versions")
