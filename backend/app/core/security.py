"""Security utilities: password hashing, JWT, CSRF."""

import secrets
import uuid
from datetime import datetime, timedelta, timezone

# Support python-jose or PyJWT
try:
    from jose import JWTError, jwt
except ImportError:
    import jwt
    from jwt.exceptions import PyJWTError as JWTError

from app.core.config import settings

# ── Password Hashing (Argon2id primary, bcrypt fallback if argon2-cffi not installed locally) ──
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerificationError, VerifyMismatchError

    _ph = PasswordHasher(
        time_cost=3,
        memory_cost=65536,
        parallelism=4,
        hash_len=32,
        salt_len=16,
    )

    def hash_password(password: str) -> str:
        """Hash a password with Argon2id."""
        return _ph.hash(password)

    def verify_password(password: str, password_hash: str) -> bool:
        """Verify a password against an Argon2id hash."""
        try:
            return _ph.verify(password_hash, password)
        except (VerifyMismatchError, VerificationError):
            return False

    def password_needs_rehash(password_hash: str) -> bool:
        return _ph.check_needs_rehash(password_hash)

except ImportError:
    import bcrypt

    def hash_password(password: str) -> str:
        """Fallback hash using bcrypt if argon2-cffi is not yet installed."""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def verify_password(password: str, password_hash: str) -> bool:
        """Verify a password against bcrypt hash."""
        try:
            return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
        except Exception:
            return False

    def password_needs_rehash(password_hash: str) -> bool:
        return False


# ── JWT ────────────────────────────────────────────────────────────────────


def create_access_token(
    user_id: uuid.UUID,
    extra_claims: dict | None = None,
) -> str:
    """Create a short-lived access JWT."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    token = jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token if isinstance(token, str) else token.decode("utf-8")


def create_refresh_token(
    user_id: uuid.UUID,
    family_id: uuid.UUID | None = None,
) -> tuple[str, uuid.UUID]:
    """Create a refresh token. Returns (raw_token, family_id)."""
    if family_id is None:
        family_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)).timestamp()),
        "type": "refresh",
        "family": str(family_id),
        "jti": str(uuid.uuid4()),
    }
    token = jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    token_str = token if isinstance(token, str) else token.decode("utf-8")
    return token_str, family_id


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises JWTError on failure."""
    return jwt.decode(token, settings.APP_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_urlsafe(32)


def generate_random_token() -> str:
    """Generate a cryptographically secure random token for email verification / password reset."""
    return secrets.token_urlsafe(48)
