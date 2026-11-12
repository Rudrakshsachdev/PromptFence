# AGENTS.md — PromptFence Project Guide

## Project Overview

**PromptFence** is an AI Application Security Testing Lab — a platform for systematically testing AI applications against prompt injection, jailbreaking, data extraction, and other LLM-specific attack vectors. It provides security researchers with tools to define targets (AI APIs), create test suites of attack scenarios, execute them against targets, and analyze results.

## Architecture

PromptFence is a monorepo with three main tiers:

```
┌─────────────────────┐
│   Next.js Frontend  │  Port 3000
│   (App Router)      │  TypeScript, Tailwind, shadcn/ui
└────────┬────────────┘
         │ HTTP/REST
┌────────▼────────────┐
│   FastAPI Backend    │  Port 8000
│   (Python 3.12)     │  SQLAlchemy 2.0, Pydantic v2
└────────┬────────────┘
         │ SQL
┌────────▼────────────┐
│   PostgreSQL 16     │  Port 5432
│                     │  Alembic migrations
└─────────────────────┘
```

## Tech Stack

### Backend
- **Runtime**: Python 3.12
- **Framework**: FastAPI with Uvicorn
- **ORM**: SQLAlchemy 2.0 (async-ready, declarative models)
- **Validation**: Pydantic v2 (settings, request/response schemas)
- **Migrations**: Alembic
- **Auth**: JWT (PyJWT) + bcrypt password hashing
- **Linting**: Ruff (linter + formatter)
- **Type Checking**: mypy (strict mode)
- **Testing**: pytest + httpx (TestClient)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui component library
- **State**: React Context + TanStack Query (server state)
- **Forms**: React Hook Form + Zod validation
- **HTTP**: Axios
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (production)
- **Database**: PostgreSQL 16
- **CI/CD**: GitHub Actions

## Repository Structure

```
PromptFence/
├── AGENTS.md                    # This file — project guide
├── README.md                    # Project overview and setup
├── CONTRIBUTING.md              # Contribution guidelines
├── CHANGELOG.md                 # Version history
├── SECURITY.md                  # Security policy
├── DEVELOPMENT.md               # Development guide
├── DEPLOYMENT.md                # Deployment guide
├── LICENSE                      # MIT License
├── Makefile                     # Development commands
├── docker-compose.yml           # Container orchestration
├── .env.example                 # Environment variable template
├── .gitignore                   # Git ignore rules
├── .pre-commit-config.yaml      # Pre-commit hooks
│
├── .claude/skills/              # Agent skill definitions
│   ├── project-architecture/
│   ├── frontend-engineering/
│   ├── backend-engineering/
│   ├── application-security/
│   ├── database-engineering/
│   ├── testing-and-quality/
│   ├── code-review/
│   └── documentation-maintenance/
│
├── .github/workflows/           # CI/CD pipelines
│   ├── backend-ci.yml
│   └── frontend-ci.yml
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py              # Application entry point
│   │   ├── api/v1/              # API routers (versioned)
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── users/           # User management
│   │   │   ├── targets/         # AI target management
│   │   │   ├── test_suites/     # Test suite management
│   │   │   ├── scenarios/       # Attack scenario management
│   │   │   └── dashboard/       # Dashboard & analytics
│   │   ├── core/                # Core infrastructure
│   │   │   ├── config.py        # Pydantic Settings
│   │   │   ├── security.py      # JWT, password hashing
│   │   │   ├── database.py      # SQLAlchemy engine/session
│   │   │   ├── logging.py       # Structured logging
│   │   │   └── exceptions.py    # Custom exception classes
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic layer
│   │   ├── repositories/        # Data access layer
│   │   ├── dependencies/        # FastAPI dependency injection
│   │   ├── middleware/           # Request/response middleware
│   │   ├── permissions/         # RBAC permission definitions
│   │   └── integrations/        # External API integrations
│   ├── migrations/              # Alembic migrations
│   │   └── versions/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── security/
│   └── scripts/                 # Backend utility scripts
│
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                 # App Router pages & layouts
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   ├── layout/          # Layout components
│   │   │   ├── navigation/      # Nav components
│   │   │   ├── forms/           # Form components
│   │   │   ├── tables/          # Data table components
│   │   │   ├── feedback/        # Toast, alerts, modals
│   │   │   ├── shared/          # Cross-feature components
│   │   │   └── dashboard/       # Dashboard widgets
│   │   ├── features/            # Feature modules
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── targets/
│   │   │   ├── test-suites/
│   │   │   ├── scenarios/
│   │   │   └── users/
│   │   ├── services/            # API client layer
│   │   ├── hooks/               # Shared React hooks
│   │   ├── lib/                 # Utilities and helpers
│   │   ├── providers/           # React Context providers
│   │   ├── types/               # Shared TypeScript types
│   │   ├── constants/           # App-wide constants
│   │   └── styles/              # Global styles
│   ├── public/                  # Static assets
│   ├── tests/                   # Test utilities
│   └── e2e/                     # End-to-end tests
│
├── docs/                        # Project documentation
│   ├── architecture/            # System architecture docs
│   ├── api/                     # API documentation
│   ├── database/                # Schema, ERD, migrations
│   ├── security/                # Security documentation
│   ├── decisions/               # Architecture Decision Records
│   ├── development/             # Development guides
│   ├── deployment/              # Deployment guides
│   └── research/                # Research notes
│
├── infrastructure/
│   ├── docker/                  # Dockerfiles
│   ├── nginx/                   # Nginx configuration
│   └── scripts/                 # Infrastructure scripts
│
└── scripts/                     # Root-level utility scripts
```

## Engineering Principles

### 1. Production-Grade Quality
- Every feature must be complete: validation, error handling, logging, tests, docs.
- No `# TODO` comments in committed code — either implement it or create an issue.
- All code must pass CI checks before merging.

### 2. Security-First Design
- Never trust user input — validate at every boundary.
- Never store secrets in code — use environment variables.
- Apply principle of least privilege — every endpoint checks permissions.
- Log security-relevant events — auth attempts, permission denials, data access.
- Protect against OWASP Top 10 and LLM-specific threats.

### 3. Modular Architecture
- Backend uses layered architecture: Router → Service → Repository → Model.
- Frontend uses feature-based organization with shared components.
- Each layer has a single responsibility — no business logic in routers, no SQL in services.
- Dependencies flow inward: routers depend on services, services depend on repositories.

### 4. Type Safety
- Backend: mypy strict mode, Pydantic v2 for all data boundaries.
- Frontend: TypeScript strict mode, Zod for runtime validation.
- No `Any` types without explicit justification.
- No `# type: ignore` without a comment explaining why.

## Code Quality Standards

### Python (Backend)
- **Formatter**: `ruff format` (line length 88)
- **Linter**: `ruff check` with rules: E, F, W, I, N, UP, S, B, A, COM, C4, DTZ, ISC, PIE, PT, RSE, RET, SIM, TID, TCH, ARG, PTH, ERA
- **Type Checker**: `mypy --strict`
- **Docstrings**: Google style for all public functions, classes, and modules
- **Imports**: sorted by `isort` (via ruff), absolute imports only within the app

### TypeScript (Frontend)
- **Formatter**: Prettier (printWidth 80, singleQuote true, trailingComma all)
- **Linter**: ESLint with `next/core-web-vitals` and strict TypeScript rules
- **Type Checker**: `tsc --noEmit`
- **Naming**: PascalCase for components/types, camelCase for functions/variables, UPPER_SNAKE for constants

## Security Requirements

### Authentication
- Passwords hashed with bcrypt (12 rounds minimum)
- JWT access tokens (30 min expiry, HS256)
- Refresh tokens stored in database (7 day expiry, single-use with rotation)
- Cookies: `httpOnly`, `Secure`, `SameSite=Lax`
- Rate limiting: 5 login attempts/minute, 3 password resets/hour
- Account lockout: 10 failed attempts → 30 minute cooldown

### Authorization
- Role-Based Access Control (RBAC): Admin, Security Researcher, Viewer
- Permission checks at the service layer via dependency injection
- Resource ownership enforced — users can only modify their own resources (except Admin)

### Data Protection
- All secrets via environment variables (never committed)
- SQL injection prevented via SQLAlchemy ORM (never raw SQL without parameterization)
- XSS prevented via React's default escaping + Content Security Policy
- CSRF protected via SameSite cookies
- SSRF protection for target URL connections (IP blocklist, DNS validation)

## Naming Conventions

### Backend
| Item | Convention | Example |
|------|-----------|---------|
| Files | `snake_case.py` | `user_service.py` |
| Classes | `PascalCase` | `UserService` |
| Functions | `snake_case` | `get_user_by_id` |
| Variables | `snake_case` | `current_user` |
| Constants | `UPPER_SNAKE` | `MAX_LOGIN_ATTEMPTS` |
| Models | `PascalCase` singular | `User`, `Target` |
| Tables | `snake_case` plural | `users`, `targets` |
| Schemas | `PascalCase` + suffix | `UserCreate`, `UserResponse` |
| Routers | `snake_case` directory | `api/v1/users/` |

### Frontend
| Item | Convention | Example |
|------|-----------|---------|
| Components | `PascalCase.tsx` | `UserTable.tsx` |
| Hooks | `camelCase` with `use` | `useAuth.ts` |
| Services | `camelCase` | `userService.ts` |
| Types | `PascalCase` | `User`, `Target` |
| Constants | `UPPER_SNAKE` | `API_BASE_URL` |
| CSS classes | Tailwind utilities | `className="flex items-center"` |
| Routes | `kebab-case` | `/test-suites/[id]` |

## Error Handling

### Backend
- Use custom exception classes in `backend/app/core/exceptions.py`:
  - `NotFoundException` → 404
  - `UnauthorizedException` → 401
  - `ForbiddenException` → 403
  - `ValidationException` → 422
  - `ConflictException` → 409
  - `RateLimitException` → 429
- Raise exceptions in services; never return error codes.
- Global exception handler converts exceptions to consistent JSON responses.
- Response format: `{"detail": "Human-readable message", "code": "MACHINE_READABLE_CODE"}`
- Never expose stack traces in production.

### Frontend
- API errors caught in service layer and transformed to typed error objects.
- Error boundaries at route level for unexpected errors.
- Toast notifications for user-facing errors (form validation, API failures).
- Retry logic for transient network failures (via TanStack Query).

## Testing

### Backend
- **Unit tests**: Test services and utilities in isolation with mocked repositories.
- **Integration tests**: Test API endpoints with real database (test database, transaction rollback).
- **Security tests**: Test auth bypass, injection, permission enforcement.
- **Coverage target**: 80% minimum.
- **Location**: `backend/tests/{unit,integration,security}/`

### Frontend
- **Unit tests**: Test components with React Testing Library.
- **Integration tests**: Test feature workflows with mocked API.
- **E2E tests**: Test critical user journeys (login, create target, run test).
- **Coverage target**: 80% minimum.
- **Location**: `frontend/tests/`, `frontend/e2e/`

## Database Migration Rules

1. **Always use Alembic** — never modify the database schema manually.
2. **Review autogenerated migrations** — Alembic's autogenerate can miss constraints and indexes.
3. **Never edit applied migrations** — create a new migration to fix issues.
4. **Test both upgrade and downgrade** — every migration must be reversible.
5. **Use descriptive migration messages** — `alembic revision --autogenerate -m "add_targets_table"`
6. **One logical change per migration** — don't combine unrelated schema changes.

## Git Conventions

### Branch Naming
- `feature/<description>` — new features
- `fix/<description>` — bug fixes
- `docs/<description>` — documentation only
- `refactor/<description>` — code restructuring
- `test/<description>` — test additions or fixes

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `security`

Scopes: `auth`, `users`, `targets`, `test-suites`, `scenarios`, `dashboard`, `db`, `api`, `ui`, `infra`

### Pull Requests
- Descriptive title following commit convention
- Link to related issue
- Include testing instructions
- All CI checks must pass
- At least one approval required

## Phase Roadmap

### Phase 1 (Current): Foundation
- User authentication and authorization (RBAC)
- Target management (CRUD for AI API endpoints)
- Test suite and test case management
- Basic dashboard

### Phase 2: Execution Engine
- Test execution against targets
- Result collection and storage
- Real-time execution monitoring (WebSocket)
- Vulnerability scoring

### Phase 3: Advanced Features
- Automated test generation
- Scheduled test runs
- Comparative analysis across target versions
- Report generation and export
- Team collaboration features

## Anti-Patterns — Do NOT

1. **Do not duplicate utilities** — check `core/`, `lib/`, `hooks/` before writing helpers.
2. **Do not put business logic in routers** — routers only parse requests and call services.
3. **Do not hardcode secrets** — use environment variables via `core/config.py` or `.env`.
4. **Do not suppress errors** — never use bare `except:` or `catch {}` without handling.
5. **Do not skip validation** — every input must be validated with Pydantic (backend) or Zod (frontend).
6. **Do not use raw SQL** — use SQLAlchemy ORM; if raw SQL is necessary, always parameterize.
7. **Do not import across layers incorrectly** — repositories never import services, routers never import repositories directly.
8. **Do not store state in global variables** — use dependency injection (backend) or React Context (frontend).
9. **Do not commit generated files** — no `node_modules/`, `__pycache__/`, `.next/`, `dist/`.
10. **Do not write tests that depend on execution order** — each test must be independent.
11. **Do not log sensitive data** — never log passwords, tokens, API keys, or PII.
12. **Do not use `Any` type without justification** — always prefer specific types.
13. **Do not mix concerns in components** — separate data fetching, business logic, and presentation.
14. **Do not skip error boundaries** — every route should have error handling.
15. **Do not create circular dependencies** — if A imports B and B imports A, refactor.
