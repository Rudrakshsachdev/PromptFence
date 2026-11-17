"""Application configuration using Pydantic Settings."""

import re
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Local Next.js dev servers (`next dev` moves to 3001 when 3000 is taken).
# Allowed automatically only when APP_ENV is development or testing.
LOCAL_DEV_CORS_ORIGINS: tuple[str, ...] = (
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_ENV: str = "development"
    APP_NAME: str = "PromptFence"
    APP_VERSION: str = "0.1.0"
    APP_SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    DEBUG: bool = False

    @field_validator("DEBUG", mode="before")
    @classmethod
    def normalize_debug(cls, v: object) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "t", "yes", "y", "debug")
        if isinstance(v, (int, float)):
            return bool(v)
        return False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://promptfence:promptfence@localhost:5432/promptfence"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            return v
        # Convert postgres:// or postgresql:// to postgresql+asyncpg://
        if v.startswith("postgres://"):
            v = "postgresql+asyncpg://" + v[len("postgres://"):]
        elif v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://"):]
        # Convert sslmode to ssl for asyncpg compatibility
        if "sslmode=" in v:
            v = v.replace("sslmode=", "ssl=")
        # Remove unsupported channel_binding parameter for asyncpg
        if "channel_binding=" in v:
            v = re.sub(r"[?&]channel_binding=[^&]*", "", v)
            if "?" not in v and "&" in v:
                v = v.replace("&", "?", 1)
        return v

    # Auth / JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"

    # Cookies
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str | None = None

    # CORS: browser origins allowed to call the API. Requests carry auth cookies
    # (credentials), so only explicit origins are accepted, never "*".
    # Production must set CORS_ORIGINS (JSON list); nothing is allowed by default.
    # In development/testing the local frontend origins below are added automatically.
    CORS_ORIGINS: list[str] = []

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def validate_cors_origins(cls, v: list[str]) -> list[str]:
        origins: list[str] = []
        for raw in v:
            origin = raw.strip().rstrip("/")
            if not origin:
                continue
            if "*" in origin:
                raise ValueError(
                    "CORS_ORIGINS must list explicit origins: wildcards cannot be "
                    "combined with credentialed (cookie) requests"
                )
            if not re.fullmatch(r"https?://[^/\s?#]+", origin):
                raise ValueError(
                    f"Invalid CORS origin {raw!r}: expected scheme://host[:port] without a path"
                )
            if origin not in origins:
                origins.append(origin)
        return origins

    # SMTP / Email
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = False
    SMTP_FROM_EMAIL: str = "noreply@promptfence.local"
    SMTP_FROM_NAME: str = "PromptFence"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Phase 2 — Dynamic Canary & Security Engine
    CANARY_HMAC_KEY: str = ""
    CANARY_KEY_VERSION: str = "v1"
    CANARY_DEFAULT_TTL_MINUTES: int = 120

    # SSRF Protection Configuration
    SSRF_ALLOW_PRIVATE_IPS: bool = False
    SSRF_DNS_TIMEOUT_SECONDS: float = 3.0

    # Execution Engine Configuration
    EXECUTION_DEFAULT_TIMEOUT_SECONDS: int = 30
    EXECUTION_MAX_CONCURRENCY: int = 5
    EXECUTION_MAX_CASES_PER_RUN: int = 100
    EXECUTION_MAX_RESPONSE_BYTES: int = 1024 * 1024  # 1MB limit for target response

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_testing(self) -> bool:
        return self.APP_ENV == "testing"

    @property
    def cors_allowed_origins(self) -> list[str]:
        """Effective CORS allow-list: configured origins, plus local dev frontends.

        The local origins are added only in development and testing, never in production.
        """
        origins = list(self.CORS_ORIGINS)
        if self.is_development or self.is_testing:
            origins.extend(o for o in LOCAL_DEV_CORS_ORIGINS if o not in origins)
        return origins


settings = Settings()
