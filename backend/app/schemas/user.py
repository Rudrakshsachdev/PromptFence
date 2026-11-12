"""User-related schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

try:
    import email_validator
    from pydantic import EmailStr
except ImportError:
    from typing import Annotated
    from pydantic import StringConstraints
    EmailStr = Annotated[str, StringConstraints(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]


class UserResponse(BaseModel):
    """User public profile."""
    id: uuid.UUID
    email: EmailStr
    full_name: str
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None
    roles: list[str] = []

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    """Update user profile."""
    full_name: str | None = Field(None, min_length=1, max_length=255)
    avatar_url: str | None = Field(None, max_length=512)


class ChangePasswordRequest(BaseModel):
    """Change password."""
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class SessionResponse(BaseModel):
    """Active session info."""
    id: uuid.UUID
    device_info: str | None = None
    created_at: datetime
    last_used_at: datetime | None = None

    model_config = {"from_attributes": True}
