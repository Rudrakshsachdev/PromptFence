"""Session repository - refresh tokens, password reset tokens, email verification tokens."""

import hashlib
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import EmailVerificationToken, PasswordResetToken, RefreshToken


def _hash_token(token: str) -> str:
    """SHA-256 hash a raw token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


class SessionRepository:
    """Database operations for session / token management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Refresh Tokens ──

    async def create_refresh_token(
        self,
        *,
        user_id: uuid.UUID,
        raw_token: str,
        family_id: uuid.UUID,
        expires_at: datetime,
        device_info: str | None = None,
    ) -> RefreshToken:
        rt = RefreshToken(
            user_id=user_id,
            token_hash=_hash_token(raw_token),
            family_id=family_id,
            expires_at=expires_at,
            device_info=device_info,
        )
        self.db.add(rt)
        await self.db.flush()
        await self.db.refresh(rt)
        return rt

    async def get_refresh_token_by_hash(self, raw_token: str) -> RefreshToken | None:
        token_hash = _hash_token(raw_token)
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke_refresh_token(self, token: RefreshToken) -> None:
        token.revoked_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def revoke_family(self, family_id: uuid.UUID) -> None:
        """Revoke all tokens in a family (rotation reuse detection)."""
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await self.db.flush()

    async def revoke_all_user_tokens(self, user_id: uuid.UUID) -> None:
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await self.db.flush()

    async def get_active_sessions(self, user_id: uuid.UUID) -> list[RefreshToken]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now,
            )
            .order_by(RefreshToken.created_at.desc())
        )
        return list(result.scalars().all())

    async def revoke_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.id == session_id,
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        token = result.scalar_one_or_none()
        if token:
            token.revoked_at = datetime.now(timezone.utc)
            await self.db.flush()
            return True
        return False

    async def update_last_used(self, token: RefreshToken) -> None:
        token.last_used_at = datetime.now(timezone.utc)
        await self.db.flush()

    # ── Password Reset Tokens ──

    async def create_password_reset_token(
        self, *, user_id: uuid.UUID, raw_token: str, expires_at: datetime
    ) -> PasswordResetToken:
        prt = PasswordResetToken(
            user_id=user_id,
            token_hash=_hash_token(raw_token),
            expires_at=expires_at,
        )
        self.db.add(prt)
        await self.db.flush()
        return prt

    async def get_password_reset_token(self, raw_token: str) -> PasswordResetToken | None:
        token_hash = _hash_token(raw_token)
        result = await self.db.execute(
            select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def mark_password_reset_used(self, token: PasswordResetToken) -> None:
        token.used_at = datetime.now(timezone.utc)
        await self.db.flush()

    # ── Email Verification Tokens ──

    async def create_email_verification_token(
        self, *, user_id: uuid.UUID, raw_token: str, expires_at: datetime
    ) -> EmailVerificationToken:
        evt = EmailVerificationToken(
            user_id=user_id,
            token_hash=_hash_token(raw_token),
            expires_at=expires_at,
        )
        self.db.add(evt)
        await self.db.flush()
        return evt

    async def get_email_verification_token(self, raw_token: str) -> EmailVerificationToken | None:
        token_hash = _hash_token(raw_token)
        result = await self.db.execute(
            select(EmailVerificationToken).where(EmailVerificationToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def mark_email_verified(self, token: EmailVerificationToken) -> None:
        token.used_at = datetime.now(timezone.utc)
        await self.db.flush()
