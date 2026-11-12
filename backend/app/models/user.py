"""User model."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    roles: Mapped[list["UserRole"]] = relationship(  # noqa: F821
        "UserRole", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(  # noqa: F821
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    targets: Mapped[list["Target"]] = relationship(  # noqa: F821
        "Target", back_populates="owner", cascade="all, delete-orphan"
    )
    test_suites: Mapped[list["TestSuite"]] = relationship(  # noqa: F821
        "TestSuite", back_populates="owner", cascade="all, delete-orphan"
    )
    test_cases: Mapped[list["TestCase"]] = relationship(  # noqa: F821
        "TestCase", back_populates="owner", cascade="all, delete-orphan"
    )
