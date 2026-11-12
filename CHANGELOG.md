# Changelog

All notable changes to the PromptFence platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-11-12

### Phase 1: Platform Foundation & Core Application

#### Added
- **Backend Architecture**:
  - 4-tier layered architecture (Routers, Services, Repositories, Models).
  - Async SQLAlchemy 2.0 with PostgreSQL 16 and Alembic migrations.
  - Multi-stage SSRF protection validating target URLs against loopback, cloud metadata, link-local, and private RFC 1918 subnets.
  - Immutable target versioning via `Target` and `TargetVersion` models.
  - Role-Based Access Control (RBAC) with `admin`, `security_researcher`, and `viewer` roles.
  - Argon2id password hashing and secure JWT authentication with refresh token family reuse detection.
  - Comprehensive seed script (`scripts/seed.py`) with initial roles, admin user, and sample security scenarios.
  - FastAPI `/health` endpoint returning database readiness status.
- **Frontend Architecture**:
  - Next.js 14 App Router with Server Components first pattern.
  - TypeScript in strict mode.
  - Tailwind CSS with customized cybersecurity design tokens.
  - Headless UI primitives (Button, Card, Input, Table, Dialog, Dropdown, Tabs, etc.).
  - Feature slices: Auth, Targets, Test Suites, Scenarios, Dashboard.
  - Target creation and editing with version history, custom headers, and API formats.
  - Test Suite and Scenario management with category and severity badges.
  - Dashboard analytics overview with stats cards and Recharts distribution visualizer.
  - Automatic token refresh interceptor in HTTP client.
- **Testing & Verification**:
  - Backend unit tests for SSRF protections and JWT security.
  - Frontend unit tests with Vitest and React Testing Library.
  - End-to-end test specifications with Playwright.
- **Agent Knowledge & Documentation**:
  - Comprehensive `AGENTS.md` root guidelines and sub-package instructions.
  - 8 Reusable Claude agent skills in `.claude/skills/`.
  - Full architectural documentation and 6 Architecture Decision Records (ADRs).
  - Multi-container Docker Compose setup.

