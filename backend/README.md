# PromptFence Backend

FastAPI application for the PromptFence AI Application Security Testing Lab.

## Tech Stack
- **Python 3.12**
- **FastAPI** with Uvicorn
- **SQLAlchemy 2.0** (Async Declarative Models)
- **Alembic** for schema migrations
- **PostgreSQL 16**
- **Pydantic v2** for validation & settings
- **Argon2id** / bcrypt for password hashing
- **PyJWT** for authentication tokens

## Directory Structure
```
backend/
├── app/
│   ├── api/v1/         # HTTP Route handlers (Auth, Users, Targets, Suites, Scenarios, Dashboard)
│   ├── core/           # Config, Database engine, Security utilities, Exceptions
│   ├── models/         # SQLAlchemy 2.0 ORM models
│   ├── schemas/        # Pydantic v2 schemas
│   ├── repositories/   # Data access layer
│   ├── services/       # Domain business logic
│   ├── dependencies/   # FastAPI dependency injection (Auth, DB, RBAC)
│   ├── permissions/    # Role-to-permission matrix
│   ├── integrations/   # Multi-layer SSRF validation
│   └── main.py         # App factory, lifespan, middleware
├── migrations/         # Alembic migration scripts
├── scripts/            # Database seeding and utilities
└── tests/              # Unit, integration, and security tests
```

## Running Locally

```bash
# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -e .

# 3. Run database migrations
alembic upgrade head

# 4. Seed initial database data
python scripts/seed.py

# 5. Start dev server
uvicorn app.main:app --reload --port 8000
```

## Tests
```bash
python -m pytest tests/unit -v
```

