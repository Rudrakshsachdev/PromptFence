"""Dynamic session-bound canary token generator and HMAC verification manager."""

import hashlib
import hmac
import re
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.core.config import settings

CANARY_PREFIX = "pf_canary_"
CANARY_REGEX = re.compile(r"pf_canary_[a-f0-9]{32}", re.IGNORECASE)


@dataclass
class GeneratedCanary:
    token: str
    digest: str
    key_version: str
    token_preview: str
    source_id: str
    source_type: str
    test_run_id: uuid.UUID
    test_run_case_id: uuid.UUID | None
    created_at: datetime
    expires_at: datetime


class CanaryManager:
    """Manages the generation, HMAC verification, and run-bound scoping of canary tokens."""

    def __init__(self, secret_key: str | None = None, key_version: str | None = None):
        self.secret_key = (
            secret_key
            or settings.CANARY_HMAC_KEY
            or settings.APP_SECRET_KEY
        )
        self.key_version = key_version or settings.CANARY_KEY_VERSION

    def generate_token(self) -> str:
        """Generate a cryptographically secure random token string."""
        entropy_hex = secrets.token_hex(16)  # 32 hex chars = 128 bits entropy
        return f"{CANARY_PREFIX}{entropy_hex}"

    def compute_digest(self, token: str) -> str:
        """Compute HMAC-SHA256 digest of the token using server secret key."""
        return hmac.new(
            self.secret_key.encode("utf-8"),
            token.strip().encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def generate_canary(
        self,
        *,
        test_run_id: uuid.UUID,
        source_id: str,
        source_type: str = "RAG_DOCUMENT",
        test_run_case_id: uuid.UUID | None = None,
        ttl_minutes: int | None = None,
    ) -> GeneratedCanary:
        """Generate a new session-bound canary token for a synthetic source."""
        token = self.generate_token()
        digest = self.compute_digest(token)
        now = datetime.now(timezone.utc)
        ttl = ttl_minutes or settings.CANARY_DEFAULT_TTL_MINUTES
        expires_at = now + timedelta(minutes=ttl)
        preview = f"{token[:13]}...{token[-6:]}"

        return GeneratedCanary(
            token=token,
            digest=digest,
            key_version=self.key_version,
            token_preview=preview,
            source_id=source_id,
            source_type=source_type,
            test_run_id=test_run_id,
            test_run_case_id=test_run_case_id,
            created_at=now,
            expires_at=expires_at,
        )

    def verify_token(self, token: str, expected_digest: str) -> bool:
        """Verify that a candidate token matches the expected HMAC-SHA256 digest."""
        if not token or not expected_digest:
            return False
        candidate_digest = self.compute_digest(token)
        return hmac.compare_digest(candidate_digest, expected_digest)

    def extract_candidate_tokens(self, text: str | None) -> list[str]:
        """Extract all candidate canary tokens from arbitrary text."""
        if not text:
            return []
        matches = CANARY_REGEX.findall(text)
        # Deduplicate preserving order
        seen = set()
        unique = []
        for m in matches:
            norm = m.lower()
            if norm not in seen:
                seen.add(norm)
                unique.append(norm)
        return unique

    def is_expired(self, expires_at: datetime) -> bool:
        """Check if an expiration datetime has passed."""
        now = datetime.now(timezone.utc)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return now > expires_at
