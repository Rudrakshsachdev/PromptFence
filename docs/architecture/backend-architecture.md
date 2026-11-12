# Backend Architecture — PromptFence

## Technology Stack
- **Framework**: FastAPI with ASGI server Uvicorn
- **Language**: Python 3.12+ with strict type hints
- **ORM**: SQLAlchemy 2.0 (Async Engine & Session)
- **Validation**: Pydantic v2 (BaseModel & BaseSettings)
- **Database**: PostgreSQL 16 (asyncpg driver)
- **Migrations**: Alembic
- **Password Hashing**: Argon2id (RFC 9106)
- **JWT Transport**: python-jose / PyJWT via HttpOnly Secure cookies

## Layered Architecture

```
HTTP Request
     │
     ▼
[API Router] (backend/app/api/v1/)
     │  - Parses path & query parameters
     │  - Validates request body via Pydantic v2
     │
     ▼
[Dependencies] (backend/app/dependencies/)
     │  - Authenticates JWT from cookie
     │  - Enforces RBAC permissions and user status
     │  - Injects scoped AsyncSession
     │
     ▼
[Service Layer] (backend/app/services/)
     │  - Implements business logic and transaction boundaries
     │  - Validates resource ownership (prevents IDOR)
     │  - Captures version snapshots upon target changes
     │  - Enforces SSRF restrictions before outbound calls
     │
     ▼
[Repository Layer] (backend/app/repositories/)
     │  - Encapsulates isolated SQLAlchemy queries
     │  - Handles filtering, pagination, and sorting
     │
     ▼
[Database Models] (backend/app/models/)
        - SQLAlchemy 2.0 Mapped declarative models
```

