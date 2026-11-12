# Backend Engineering Guide — PromptFence

## Overview
This document guides AI coding agents and human engineers working on the PromptFence FastAPI backend application.

## Engineering Standards
- **Layered Request Architecture**:
  `API Router → Dependencies (Auth/RBAC) → Service → Repository → Model / Database`
- **FastAPI Conventions**:
  - Keep route handlers thin. Routers only validate request models and call services.
  - Return typed Pydantic v2 response schemas.
  - Use appropriate HTTP status codes (201 Created, 204 No Content, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Validation Error).
- **SQLAlchemy 2.0 & PostgreSQL**:
  - Use async session management (`AsyncSession`, `select`, `update`, `delete`).
  - Declare models with `Mapped[...]` and `mapped_column(...)`.
  - Use timezone-aware UTC datetimes (`DateTime(timezone=True)`).
  - All primary keys must be UUID v4.
- **Authentication & Security**:
  - Passwords hashed with Argon2id (`time_cost=3`, `memory_cost=65536`).
  - JWT access tokens (15-min expiry) + refresh tokens (7-day expiry) stored as SHA-256 hashes in database.
  - Strict Token Family rotation with automatic reuse detection to invalidate compromised session chains.
  - Outbound HTTP requests must pass SSRF validation in `app/integrations/ssrf.py` (reject loopback, private networks, cloud metadata, link-local).
  - Prevent Insecure Direct Object References (IDOR) by checking resource ownership in services.
- **Error Handling**:
  - Raise custom exception subclasses of `AppError` (`NotFoundError`, `ConflictError`, `AuthenticationError`, `AuthorizationError`, `SSRFError`).
  - Never return bare exception messages or internal stack traces in production.

## Folder Organization
```
backend/app/
├── api/v1/               # Versioned API route handlers
├── core/                 # Config (Pydantic Settings), database engine, security, logging
├── dependencies/         # FastAPI dependency injection (get_db, get_current_user, require_role)
├── integrations/         # SSRF protection and external client wrappers
├── middleware/           # CORS, rate limiting, security headers, request logging
├── models/               # SQLAlchemy 2.0 declarative database entities
├── permissions/          # RBAC roles and permission matrix definitions
├── repositories/         # Database access layer (CRUD operations)
├── schemas/              # Pydantic v2 request and response schemas
└── services/             # Core business logic
```

