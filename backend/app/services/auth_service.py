"""Authentication service implementing registration, login, token rotation, and password reset."""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError, ValidationError
from app.core.security import (
    JWTError,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_random_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.permissions.roles import PermissionType, RoleType
from app.repositories.role_repository import RoleRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse
from app.services.email_service import get_email_service


class AuthService:
    """Business logic for authentication and identity management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.session_repo = SessionRepository(db)
        self.role_repo = RoleRepository(db)
        self.email_service = get_email_service()

    async def register(self, *, email: str, password: str, full_name: str) -> tuple[User, str]:
        """
        Register a new user account.
        Returns (user, verification_token).
        """
        normalized_email = email.lower().strip()
        existing = await self.user_repo.get_by_email(normalized_email)
        if existing:
            raise ConflictError("An account with this email address already exists")

        pw_hash = hash_password(password)
        user = await self.user_repo.create(
            email=normalized_email,
            password_hash=pw_hash,
            full_name=full_name.strip(),
        )

        # Assign default role: security_researcher (or create if not present)
        role = await self.role_repo.get_role_by_name("security_researcher")
        if role:
            await self.role_repo.assign_role_to_user(user.id, role.id)

        # Generate email verification token (valid 24h)
        raw_token = generate_random_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        await self.session_repo.create_email_verification_token(
            user_id=user.id,
            raw_token=raw_token,
            expires_at=expires_at,
        )

        # Send email
        await self.email_service.send_verification_email(user.email, raw_token)

        return user, raw_token

    async def verify_email(self, token: str) -> User:
        """Verify user's email with token."""
        token_record = await self.session_repo.get_email_verification_token(token)
        if not token_record:
            raise ValidationError("Invalid or expired verification token")

        if token_record.used_at is not None:
            raise ValidationError("Verification token has already been used")

        if token_record.expires_at < datetime.now(timezone.utc):
            raise ValidationError("Verification token has expired")

        user = await self.user_repo.get_by_id(token_record.user_id)
        if not user:
            raise NotFoundError("User not found")

        user.is_verified = True
        await self.session_repo.mark_email_verified(token_record)
        return user

    async def login(
        self, *, email: str, password: str, device_info: str | None = None
    ) -> tuple[User, str, str, UserResponse]:
        """
        Authenticate user with email and password.
        Returns (user, access_token, refresh_token, user_response).
        """
        normalized_email = email.lower().strip()
        user = await self.user_repo.get_by_email(normalized_email)
        if not user or not verify_password(password, user.password_hash):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("Account is disabled")

        now = datetime.now(timezone.utc)
        # Snapshot in-memory fields before flush expires modified/server-updated attributes
        user_snapshot = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "updated_at": user.updated_at or user.created_at,
            "last_login_at": now,
        }

        # Update last login timestamp in-memory (committed with session token below)
        await self.user_repo.update_last_login(user)

        # Load user roles and permissions in a single consolidated database query
        role_names, permissions = await self.role_repo.get_role_and_permission_names(user.id)
        if RoleType.ADMIN.value in role_names:
            permissions |= {p.value for p in PermissionType}

        roles_list = sorted(role_names)
        permissions_list = sorted(permissions)

        # Generate access and refresh tokens
        access_token = create_access_token(
            user_id=user.id,
            extra_claims={"roles": roles_list, "email": user.email},
        )
        refresh_token, family_id = create_refresh_token(user_id=user.id)

        # Store hashed refresh token in database (single round-trip flushes user update & token)
        refresh_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.session_repo.create_refresh_token(
            user_id=user.id,
            raw_token=refresh_token,
            family_id=family_id,
            expires_at=refresh_expires,
            device_info=device_info,
        )

        user_response = UserResponse(
            **user_snapshot,
            roles=roles_list,
            permissions=permissions_list,
        )

        return user, access_token, refresh_token, user_response

    async def refresh_tokens(self, raw_refresh_token: str) -> tuple[str, str]:
        """
        Rotate refresh token and issue new access & refresh tokens.
        Includes Token Family reuse detection.
        Returns (new_access_token, new_refresh_token).
        """
        try:
            payload = decode_token(raw_refresh_token)
        except JWTError:
            raise AuthenticationError("Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        user_id_str = payload.get("sub")
        family_id_str = payload.get("family")
        if not user_id_str or not family_id_str:
            raise AuthenticationError("Malformed refresh token")

        user_id = uuid.UUID(user_id_str)
        family_id = uuid.UUID(family_id_str)

        token_record = await self.session_repo.get_refresh_token_by_hash(raw_refresh_token)

        # ── REUSE DETECTION ──
        # If the token record does not exist or has already been revoked, someone is reusing an old token!
        if token_record is None or token_record.revoked_at is not None:
            # Revoke all tokens in this family immediately!
            await self.session_repo.revoke_family(family_id)
            raise AuthenticationError("Refresh token reuse detected. All active sessions have been terminated.")

        if token_record.expires_at < datetime.now(timezone.utc):
            await self.session_repo.revoke_refresh_token(token_record)
            raise AuthenticationError("Refresh token has expired")

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise AuthenticationError("User account is inactive or not found")

        # Invalidate the current token
        await self.session_repo.revoke_refresh_token(token_record)

        # Issue new pair with the same family_id
        user_roles = await self.role_repo.get_user_roles(user.id)
        roles_list = [ur.role.name for ur in user_roles if ur.role]

        new_access_token = create_access_token(
            user_id=user.id,
            extra_claims={"roles": roles_list, "email": user.email},
        )
        new_refresh_token, _ = create_refresh_token(user_id=user.id, family_id=family_id)

        new_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.session_repo.create_refresh_token(
            user_id=user.id,
            raw_token=new_refresh_token,
            family_id=family_id,
            expires_at=new_expires,
            device_info=token_record.device_info,
        )

        return new_access_token, new_refresh_token

    async def logout(self, raw_refresh_token: str | None) -> None:
        """Revoke the current refresh token."""
        if not raw_refresh_token:
            return
        token_record = await self.session_repo.get_refresh_token_by_hash(raw_refresh_token)
        if token_record and token_record.revoked_at is None:
            await self.session_repo.revoke_refresh_token(token_record)

    async def logout_all(self, user_id: uuid.UUID) -> None:
        """Revoke all active sessions for a user."""
        await self.session_repo.revoke_all_user_tokens(user_id)

    async def forgot_password(self, email: str) -> None:
        """
        Initiate password reset flow.
        Always completes without revealing if the account exists (anti-enumeration).
        """
        normalized_email = email.lower().strip()
        user = await self.user_repo.get_by_email(normalized_email)
        if not user or not user.is_active:
            # Silent return to prevent user enumeration
            return

        raw_token = generate_random_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await self.session_repo.create_password_reset_token(
            user_id=user.id,
            raw_token=raw_token,
            expires_at=expires_at,
        )
        await self.email_service.send_password_reset_email(user.email, raw_token)

    async def reset_password(self, token: str, new_password: str) -> None:
        """Reset password using valid reset token and revoke all prior sessions."""
        token_record = await self.session_repo.get_password_reset_token(token)
        if not token_record:
            raise ValidationError("Invalid or expired password reset token")

        if token_record.used_at is not None:
            raise ValidationError("Password reset token has already been used")

        if token_record.expires_at < datetime.now(timezone.utc):
            raise ValidationError("Password reset token has expired")

        user = await self.user_repo.get_by_id(token_record.user_id)
        if not user:
            raise NotFoundError("User not found")

        # Update password
        user.password_hash = hash_password(new_password)
        await self.session_repo.mark_password_reset_used(token_record)

        # Invalidate all existing sessions after password change
        await self.session_repo.revoke_all_user_tokens(user.id)
