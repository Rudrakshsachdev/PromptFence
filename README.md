# PromptFence — AI Application Security Testing Lab

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

**A provenance-aware adversarial security testing platform for AI-powered applications.**

</div>

---

## Overview

**PromptFence** is an enterprise-grade AI Application Security Testing Lab designed to evaluate LLMs, AI agents, and RAG pipelines against:

1. **Indirect Prompt Injection** (untrusted context hijacking execution flow).
2. **Sensitive Data Disclosure** (system prompt extraction, PII leaks, secret exposure).
3. **Unauthorized Tool Execution** (jailbreaking LLMs to invoke unauthorized backend tools).
4. **Instruction-Conflict Scenarios** (system prompt overrides and compliance bypasses).
5. **Security Regressions** (verifying prompt updates and safety guards across iterations).

### Research Contribution
**Dynamic Session-Bound Canary Tainting & Provenance Tracing**: Generating cryptographically random, ephemeral canary tokens bound to individual test runs and synthetic context chunks to definitively prove data leakage and trace adversarial injection sources.

---

## Architecture

PromptFence uses a modern, high-performance monorepo architecture:

```
┌─────────────────────┐
│   Next.js Frontend  │  Port 3000 (Next.js 14 App Router, TypeScript,
│   (Server-First)    │  Tailwind CSS, shadcn/ui, TanStack Query)
└────────┬────────────┘
         │ HTTP/REST (HttpOnly JWT Cookies)
┌────────▼────────────┐
│   FastAPI Backend    │  Port 8000 (Python 3.12, SQLAlchemy 2.0 Async,
│   (4-Tier Layered)  │  Pydantic v2, Argon2id, Multi-stage SSRF Protection)
└────────┬────────────┘
         │ SQL
┌────────▼────────────┐
│   PostgreSQL 16     │  Port 5432 (Alembic Migrations, JSONB Extension Points)
└─────────────────────┘
```

---

## Quick Start with Docker Compose

Ensure Docker and Docker Compose are installed:

```bash
# 1. Clone repository
git clone https://github.com/promptfence/promptfence.git
cd promptfence

# 2. Configure environment
cp .env.example .env

# 3. Launch database, backend, and frontend
docker compose up -d --build

# 4. Run migrations and seed sample security scenarios
docker compose exec backend alembic upgrade head
docker compose exec backend python scripts/seed.py
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Default Credentials (Local Seed)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@promptfence.internal` | `AdminSecurePass123!` |
| **Security Researcher** | `researcher@promptfence.internal` | `ResearcherPass123!` |

---

## Repository Structure

```
PromptFence/
├── backend/               # FastAPI backend (Python 3.12, SQLAlchemy 2.0)
│   ├── app/               # 4-tier layered architecture (api, services, repos, models)
│   ├── migrations/        # Alembic schema migrations
│   ├── scripts/           # DB seeding and maintenance scripts
│   └── tests/             # Unit, integration, and security tests
├── frontend/              # Next.js 14 frontend (TypeScript, Tailwind, shadcn/ui)
│   ├── src/app/           # App Router pages (Server Components first)
│   ├── src/components/    # Reusable UI primitives and layouts
│   ├── src/features/      # Domain modules (auth, targets, suites, scenarios)
│   └── tests/             # Vitest unit tests & Playwright E2E tests
├── docs/                  # Architecture, API, DB, security, and ADR documentation
├── infrastructure/        # Dockerfiles, Nginx configurations, deployment scripts
├── .claude/skills/        # Reusable AI engineering skills and project knowledge
├── docker-compose.yml     # Multi-container orchestration
└── AGENTS.md              # AI agent guidelines & engineering standards
```

---

## Key Features

- **Strict Multi-Stage SSRF Protection**: Comprehensive IP validation blocking loopback, link-local, cloud metadata (169.254.169.254), and RFC 1918 private subnets for target endpoints.
- **Immutable Target Versioning**: Every modification to an AI target generates a new immutable snapshot (`TargetVersion`), ensuring historical test results maintain full forensic integrity.
- **Enterprise RBAC**: Role-based access control (`admin`, `security_researcher`, `viewer`) with granular permission strings and IDOR ownership verification.
- **Secure Token Rotation**: Short-lived JWTs combined with opaque refresh token rotation and token family reuse detection.

---

## Documentation

- [System Overview](docs/architecture/system-overview.md)
- [Backend Architecture](docs/architecture/backend-architecture.md)
- [Frontend Architecture](docs/architecture/frontend-architecture.md)
- [Security Threat Model](docs/security/threat-model.md)
- [Architecture Decision Records (ADRs)](docs/decisions/)
- [Development Guide](DEVELOPMENT.md)
- [Deployment Guide](DEPLOYMENT.md)

---

## License

MIT License. See [LICENSE](LICENSE) for details.

