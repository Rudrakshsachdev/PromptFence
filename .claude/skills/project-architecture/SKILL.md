---
name: project-architecture
description: Understand and enforce PromptFence platform architecture, module boundaries, and separation of concerns.
---

# Project Architecture Skill

## Purpose
Preserve PromptFence's architectural integrity as a production-grade, extensible cybersecurity testing lab. Prevent monolithic shortcuts, layer violations, and accidental breaking changes.

## Trigger Conditions
- Planning or creating a new feature across frontend or backend.
- Determining where business logic, state, or queries belong.
- Preparing extension points for Phase 2 (dynamic canary tainting, provenance tracing).

## Architectural Boundaries

### 1. Backend Layering
```
Client Request
  ↓
API Router (backend/app/api/v1/)
  ↓ Validates Pydantic schema, delegates immediately
Dependencies (backend/app/dependencies/)
  ↓ Authenticates JWT, enforces RBAC, verifies active status
Service Layer (backend/app/services/)
  ↓ Implements business logic, ownership checks, version snapshots, SSRF safety
Repository Layer (backend/app/repositories/)
  ↓ Executes isolated SQLAlchemy queries
Database (PostgreSQL / SQLite)
```

**Strict Rule**: API routers must never execute SQL queries directly. Services must never import routers. Repositories must never handle HTTP responses.

### 2. Frontend Layering
```
Page (Server Component by default)
  ↓
Client Component (Interactive island when needed: form, chart, modal)
  ↓
Feature / Custom Hook (TanStack Query, useAuth)
  ↓
Service Client (frontend/src/services/)
  ↓
Centralized API Client (frontend/src/lib/api-client.ts)
  ↓ Credentials: 'include' (HttpOnly cookies)
Backend Endpoint
```

**Strict Rule**: No direct `fetch()` calls inside UI components. All server state must be managed via TanStack Query hooks.

## Engineering Checklist
- [ ] New endpoint created under `backend/app/api/v1/`?
- [ ] Business logic isolated in `backend/app/services/`?
- [ ] Database queries encapsulated in `backend/app/repositories/`?
- [ ] Pydantic v2 schemas defined for request and response boundaries?
- [ ] Outbound HTTP target requests guarded by SSRF validation?
- [ ] Phase 2 extension points left intact without premature execution logic?

