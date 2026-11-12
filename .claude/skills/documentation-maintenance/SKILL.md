---
name: documentation-maintenance
description: Keep technical documentation, architecture decision records (ADRs), API references, and schemas synchronized with code changes.
---

# Documentation Maintenance Skill

## Purpose
Ensure PromptFence engineering documentation accurately reflects the current state of implementation, architectural decisions, and operational guidelines.

## Trigger Conditions
- Introducing a major architectural decision (record an ADR in `docs/decisions/`).
- Adding or altering an API route (update `docs/api/README.md`).
- Updating the database schema or migration history (update `docs/database/schema.md`).
- Modifying environment variables or setup steps (update `README.md` and `.env.example`).

## Documentation Map
- `README.md`: Project overview, capabilities, setup commands, architecture diagram.
- `docs/architecture/`:
  - `system-overview.md`: 3-tier architecture diagram and responsibilities.
  - `frontend-architecture.md`: Next.js App Router, components, state.
  - `backend-architecture.md`: Router-Service-Repository pattern.
  - `request-lifecycle.md`: Step-by-step sequence of requests.
  - `authentication-flow.md`: Cookie transport, refresh rotation, family revocation.
- `docs/database/`:
  - `schema.md`: Complete entity and column dictionary.
  - `erd.md`: Mermaid entity-relationship diagram.
  - `migrations.md`: Alembic migration guidelines.
- `docs/security/`:
  - `threat-model.md`: Assets, threat actors, and attack surfaces.
  - `ssrf-protection.md`: SSRF IP blocklists, DNS resolution, and limitations.
  - `authorization-matrix.md`: RBAC permission table.
- `docs/decisions/`: Architecture Decision Records (ADR-001 through ADR-006).

## Documentation Rule
Never write speculative documentation claiming future phases are implemented. Clearly state what is active in Phase 1 versus planned for Phase 2/3.

