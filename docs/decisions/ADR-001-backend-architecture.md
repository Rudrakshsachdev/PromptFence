# ADR-001: Layered Backend Architecture (Router -> Service -> Repository -> Model)

## Status
Accepted

## Context
PromptFence is an AI Application Security Testing Lab requiring a maintainable, extensible, and strictly testable backend. AI security testing workflows involve complex business logic (e.g., target validation, SSRF checks, versioning, canary tracking foundations) and multiple data boundaries. A common pitfall in FastAPI projects is mixing ORM queries, permission checks, HTTP serialization, and external API requests inside route handlers.

## Decision
We adopt a strict 4-tier layered backend architecture:
1. **API / Routers (`app/api/v1/`)**: Pure HTTP transport layer. Responsible for routing, OpenAPI schemas, request parsing, cookie/header transport, and dependency injection invocation. No database queries or domain logic.
2. **Services (`app/services/`)**: Domain and business logic orchestration. Enforces business validation, state transitions, security constraints, versioning rules, and transaction boundaries. Services interact with repositories for persistence.
3. **Repositories (`app/repositories/`)**: Abstracted persistence layer. Responsible for SQL/ORM queries, filtering, sorting, pagination, and transactional database operations using SQLAlchemy 2.0. No HTTP or presentation logic.
4. **Models & Schemas (`app/models/`, `app/schemas/`)**:
   - `models`: SQLAlchemy 2.0 declarative database models mapped to PostgreSQL tables.
   - `schemas`: Pydantic v2 schemas providing strict input validation and output serialization contracts.

## Consequences
### Positive
- **Testability**: Unit tests can isolate service logic by mocking repositories without a live database.
- **Maintainability**: Clear separation of concerns; changes to DB schema or ORM do not leak into API routes.
- **Consistency**: Centralized exception raising (`AppError` hierarchy) in services mapped to HTTP responses at the global exception handler level.
- **Security**: Permission checks and business rules are consistently applied regardless of whether invoked from HTTP, CLI scripts, or background workers.

### Negative / Trade-offs
- Slight boilerplate overhead for simple CRUD operations.
- Requires strict developer discipline to prevent repository queries from leaking into route handlers.

