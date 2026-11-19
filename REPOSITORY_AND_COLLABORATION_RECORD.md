# PromptFence: Repository Structure and Collaboration Record

## 1. Repository Overview and Metadata

| Attribute | Verified Value |
| :--- | :--- |
| **Repository Name** | PromptFence |
| **Primary Remote URL** | `https://github.com/Rudrakshsachdev/PromptFence.git` |
| **Default Remote Head** | `main` (`origin/main`) |
| **Local Active Branch** | `frontend/refinement` |
| **Total Commit Count (Global)** | 28 commits (including 2 merge commits) |
| **Unique Contributors (Git Identities)** | 2 physical contributors (4 distinct committer signature strings) |
| **First Recorded Commit** | `2026-07-17 16:36:50 +0530` (`695256f`) |
| **Latest Recorded Commit** | `2026-11-18 10:02:46 +0530` (`678c7e5`) |
| **Architecture Monorepo Structure** | Full-stack monorepo: `backend/` (FastAPI/SQLAlchemy/Python), `frontend/` (Next.js 14 App Router/TypeScript/Tailwind CSS), `docs/` (Architecture/ADRs/Security/QA/Research), `infrastructure/` (Docker/Nginx) |

---

## 2. Branch Structure and Development History

### Active and Remote Branches
An audit of local and remote branches (`git branch -a`) reveals four active development branches alongside ten historical swarm scratch worktrees:

1. **`main` (`origin/main`)**:
   - Represents the mainline production branch.
   - Remote head commit: `edf5fcc` (*Merge pull request #2 from Rudrakshsachdev/fixing-bugs*).
2. **`frontend/refinement` (`origin/frontend/refinement`)**:
   - Primary branch for frontend UI/UX elevation, authentication namespace refactoring (`/auth/*`), and component redesign.
   - Head commit: `678c7e5` (*feat(auth): refactor all authentication routes to /auth/* URL structure with permanent legacy redirects*).
3. **`fixing-bugs` (`origin/fixing-bugs`)**:
   - Feature branch created to resolve database connection resilience (`pool_pre_ping`), optimize dashboard queries (`DashboardRepository`), fix execution runner serialization, and stabilize report hooks.
   - Head commit: `822d2a7`. Integrated into `main` via PR #2 (`edf5fcc`).
4. **`new-feature` (`origin/new-feature`)**:
   - Feature branch dedicated to RBAC enforcement across all backend endpoints, role-based navigation guards, and the specialized Security Researcher workspace (`/security/researcher`).
   - Head commit: `678c7e5` (synchronized with `frontend/refinement`).
5. **Historical Swarm Worktrees (`swarm-*`)**:
   - Branches branched from earlier repository checkpoints (`swarm-backend-*`, `swarm-docs-*`, `swarm-fe-*`, etc.) representing parallel subagent development workspaces during initial monorepo bootstrapping.

---

## 3. Contributor-Wise Commit Statistics and Verified Contribution Areas

Detailed inspection of Git log signatures shows that commits originate from two distinct physical collaborators who used slight variations of their Git configuration signatures:

### Summary Statistics
| Contributor Name | Git Author String | Email Address | Commit Count | Active Date Span | Primary Subsystem Ownership |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Rudraksh Sachdeva** | `Rudrakshsachdev`<br>`Rudraksh Sachdeva` | `rudrakshsachdeva04@gmail.com` | **15** (13 authored + 2 merge PRs) | 2026-07-17 to 2026-11-18 | System Architecture, Execution Engine, Dynamic Canary Tainting, Phase 3 Analytics, Full Frontend UI/UX Refinement, Auth Architecture, RBAC & Security Center |
| **Vedant Mathur** | `Vedant Mathur`<br>`VedantMathur1079` | `vedantmathur1079@gmail.com` | **13** (11 + 2) | 2026-11-15 (16:01 to 16:45) | Findings Triage Subsystem, Finding Status Lifecycle & History, Execution Metadata Schema & Migration, Frontend Finding Service & Custom Hooks |
| **Total** | — | — | **28** | **2026-07-17 to 2026-11-18** | **PromptFence Monorepo** |

> **Methodological Note on Effort vs. Commit Counts**: In accordance with empirical software engineering standards, commit counts do not represent raw engineering effort or technical complexity. A single commit (e.g., `4904f03` implementing the full execution engine or `f84096d` implementing Phase 3 analytics) contains thousands of lines of core architectural code and test suites, whereas granular refactoring commits span fewer lines. Both contributions represent distinct, essential architectural layers of PromptFence.

### Granular Verified Contribution Log

#### A. Vedant Mathur (`vedantmathur1079@gmail.com`) — 13 Commits
All 13 commits were authored on November 15, 2026, establishing the end-to-end finding management and triage lifecycle:
1. `e32c731`: Refactor findings router to delegate business logic to `findings_service`.
2. `f2d7fed`: Implement `findings_service.py` for finding triage, search, filter, and status transition validation.
3. `c7c798e`: Extend Pydantic execution schemas with `status` and `fingerprint` tracking fields.
4. `e1d8b98`: Create Alembic migration `003_findings_lifecycle.py` introducing `finding_status_history` table and enum columns.
5. `9f89c4f`: Define `FindingStatus` enum and `FindingStatusHistory` declarative SQLAlchemy models.
6. `78258f9`: Register `FindingStatusHistory` in `backend/app/models/__init__.py`.
7. `5ba011d`: Add `trace_metadata` and `evidence_reference` attributes to the `Execution` model.
8. `c9f1b4b`: Update Docker configuration and triage state markers.
9. `e53ca4b`: Clean up local build artefacts and refine `.gitignore`.
10. `1b764d0`: Add TypeScript types for `FindingStatus`, history records, and filter parameters in `frontend/src/types/finding.ts`.
11. `61654b4`: Refactor `finding.service.ts` to support paginated and filtered queries (`FindingListParams`).
12. `3b0f6f0`: Introduce React Query hooks (`useFindings`, `useFindingHistory`, `useChangeFindingStatus`) in `frontend/src/hooks/use-findings.ts`.
13. `140b035`: Refine response type handling in `finding.service.ts`.

#### B. Rudraksh Sachdeva (`rudrakshsachdeva04@gmail.com`) — 15 Commits
Spanning project inception to current refinement:
1. `695256f` (2026-07-17): Initial repository baseline and research platform demonstration.
2. `e020369` (2026-11-12): Monorepo scaffolding, FastAPI backend, Next.js frontend, Docker orchestration, and initial documentation.
3. `23477f9` (2026-11-12): Phase 1 UI transformation, dashboard widgets, and target/suite CRUD interfaces.
4. `4904f03` (2026-11-13): Phase 2 execution engine: orchestrator service, mock/HTTP/agent target adapters, dynamic session-bound canary generation, taint instrumentation, and assertion evaluation.
5. `f84096d` (2026-11-15): Phase 3 architecture: regression comparison engine, report export generator, experiment evaluation matrix, and analytics service.
6. `c4f5b64` (2026-11-16): Public landing page with typography animations, product previews, and brand assets.
7. `cbc90a1` (2026-11-17): Authentication suite redesign aligning `/login`, `/register`, and recovery pages with the landing page design language; add automated async test runner fixtures in `backend/tests/conftest.py`.
8. `cd09fa8` (2026-11-17): Enterprise UI/UX elevation: developer sandbox quick-fill badge, four-segment password security scoring, and subtle canvas backdrops.
9. `ba8c877` (2026-11-17): Password reveal toggle resolution, prop isolation, and Windows Edge `::-ms-reveal` CSS suppression.
10. `17c2f79` (2026-11-17): Full frontend refinement: email verification page, auth alerts, open-redirect protection, responsive top-bar/sidebar, ProblemDetails error handler, and 112 passing frontend tests.
11. `822d2a7` (2026-11-17): Backend connection resilience (`pool_pre_ping`), `DashboardRepository` extraction for aggregated queries, test-run async execution validation, and report hook tests.
12. `75e158d` (2026-11-17): RBAC enforcement: `RoleRepository`, security dependency injection, Security Center (`/security`), and researcher workspace (`/security/researcher`).
13. `783e533` (2026-11-17): Merge Pull Request #1 (`frontend/refinement` into `main`).
14. `edf5fcc` (2026-11-17): Merge Pull Request #2 (`fixing-bugs` into `main`).
15. `678c7e5` (2026-11-18): Reorganization of all authentication routes to canonical `/auth/*` namespace (`/auth/login`, `/auth/register`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`) with 308 permanent legacy redirects.

---

## 4. Pull Request and Collaboration Information

Repository commit logs record two formal pull request merges on the remote repository (`github.com/Rudrakshsachdev/PromptFence`):
- **Pull Request #1**: Branch `frontend/refinement` merged into `main` by Rudraksh Sachdeva on 2026-11-17 (`783e533`), delivering the enterprise UI redesign, comprehensive authentication suite, and test suites.
- **Pull Request #2**: Branch `fixing-bugs` merged into `main` by Rudraksh Sachdeva on 2026-11-17 (`edf5fcc`), delivering the database idle-ping connection fix and dashboard single-pass query optimization.
- **Direct Collaborative Pushes**: Commits by Vedant Mathur were committed directly on 2026-11-15 during the Phase 2 findings triage milestone, followed by subsequent feature integration and refinement by Rudraksh Sachdeva.

---

## 5. Documentation and Testing Artefacts

The repository contains extensive, production-grade technical documentation and multi-tiered automated test suites:

### A. Documentation Artefacts (28 Markdown Documents in `docs/`)
- **System Architecture (7 files)**:
  - `system-overview.md`, `backend-architecture.md`, `frontend-architecture.md`, `execution-engine-and-canary-tracing.md`, `phase3-analytics-and-evaluation.md`, `authentication-flow.md`, `request-lifecycle.md`.
- **Architecture Decision Records (ADRs) (7 files)**:
  - `ADR-001` (Layered Backend), `ADR-002` (Server Components), `ADR-003` (Cookie JWT Rotation), `ADR-004` (SSRF Defense), `ADR-005` (Target Versioning), `ADR-006` (RBAC Model), `ADR-007` (Canary Tainting Engine).
- **Security & Authorization (5 files)**:
  - `threat-model.md`, `authentication.md`, `authorization-matrix.md`, `ssrf-protection.md`, `secure-development.md`.
- **Database & Schemas (3 files)**:
  - `schema.md`, `erd.md`, `migrations.md`.
- **QA & Testing Reports (2 files)**:
  - `docs/qa/authentication-audit.md`: Comprehensive audit of authentication security, rate limiting, and open-redirect protection.
  - `docs/research/test-cases-and-observed-outcomes.md`: Formal verification record of tests T1–T10 supporting Section V-A and Table V of the IEEE paper.
- **Operations & Research (4 files)**:
  - `docs/api/README.md`, `docs/deployment/README.md`, `docs/development/README.md`, `docs/research/provenance-canary-design.md`.

### B. Automated Testing Artefacts (42 Test Files)
- **Backend Test Suite (23 test files + `conftest.py`)**:
  - `backend/tests/unit/` (10 files): Unit tests for Canary generation (`test_canaries.py`), Assertion evaluation (`test_assertions.py`), Target adapters (`test_adapters.py`), SSRF protection (`test_ssrf.py`), Database idle ping (`test_db_idle_ping.py`), JWT security (`test_security.py`), and Phase 3 analytics/reporting/regression/evaluation.
  - `backend/tests/integration/` (11 files): Integration suites for auth (`test_auth.py`), CORS (`test_cors.py`), targets (`test_targets.py`), test suites (`test_test_suites.py`), scenarios (`test_scenarios.py`), test runs (`test_test_runs_api.py`), dashboard aggregations (`test_dashboard_queries.py`), execution flow (`test_execution_flow.py`), security overview (`test_security_overview.py`), and phase 3 pipelines.
  - `backend/tests/security/` (2 files): Role-based access control and unauthorized invocation tests (`test_authorization.py`, `test_rbac_enforcement.py`).
- **Frontend Test Suite (15 unit/integration test files + `setup.ts`)**:
  - Covers auth flows (`auth.test.tsx`, `auth-integration.test.tsx`), open-redirect defense (`auth-redirect.test.ts`), dashboard charts (`dashboard-components.test.tsx`), overview KPIs (`overview.test.tsx`), researcher workspace (`researcher-workspace.test.tsx`), permissions (`permissions.test.tsx`), API client retry loop (`api-client.test.ts`), and reporting (`use-reports.test.ts`).
  - Total passing frontend assertions: **175 unit/integration tests across 14 test files**.
- **End-to-End Test Suite (4 Playwright test files in `frontend/e2e/`)**:
  - `auth.spec.ts` (authentication workflows, keyboard navigation, 320px viewport responsiveness, legacy redirects), `navigation.spec.ts`, `targets.spec.ts`, and `test-suites.spec.ts`.

---

## 6. Audit of Inaccuracies in Informal/Unverified Contribution Tables

Prior informal tables or oral summaries of project division often suffer from specific empirical inaccuracies. The audit reveals the following corrections based strictly on verifiable Git and file evidence:

1. **Incorrect Branch Attribution**:
   - *Inaccuracy*: Assigning the same branch (e.g., attributing `main` or `frontend/refinement` entirely to both contributors or claiming one contributor owned branches where they have no commit records).
   - *Correction*: Commits demonstrate clear branch creation and ownership. Vedant Mathur authored commits directly on `main` during Phase 2 (`e32c731` through `140b035`). Rudraksh Sachdeva established feature branches `frontend/refinement`, `fixing-bugs`, and `new-feature`, and merged them via PRs #1 and #2.
2. **Subsystem Overlap Misattribution**:
   - *Inaccuracy*: Claiming one author implemented the entire backend or entire frontend.
   - *Correction*: The Findings Lifecycle subsystem is collaborative: the database models, migration scripts, finding service, and React Query finding hooks were built by Vedant Mathur, whereas the core execution engine, canary generation, taint analysis, analytics, auth security, and frontend layout architecture were built by Rudraksh Sachdeva.
3. **Commit Count Distortion**:
   - *Inaccuracy*: Evaluating contributor workload by raw commit count (e.g., 15 vs 13).
   - *Correction*: Commit granularity differed: Vedant Mathur committed feature units incrementally in single-purpose commits (13 commits within 45 minutes on Nov 15), while Rudraksh Sachdeva committed major architectural modules in holistic multi-file feature blocks.

---

## 7. IEEE Report Subsection

*(The following subsection is formatted for direct inclusion into Section IV or V of the PromptFence IEEE Research Paper).*

### B. Repository and Collaboration Record

To ensure reproducible research and transparent engineering governance, PromptFence was developed within a centralized, version-controlled monorepo (`https://github.com/Rudrakshsachdev/PromptFence.git`). The codebase encompasses 28 recorded Git commits across four functional branches (`main`, `frontend/refinement`, `fixing-bugs`, and `new-feature`), accompanied by two verified GitHub pull request integrations (PR #1 and PR #2).

Engineering responsibilities were divided across two primary contributors according to architectural boundaries:

1. **Core Architecture, Security Testing Engine, and System Integration (Lead: Rudraksh Sachdeva)**: Responsible for the initial monorepo architecture, Phase 1 UI/UX system, Phase 2 test orchestration engine, session-bound canary token generator, AST-based prompt taint instrumentation, target adapter interfaces (Mock, HTTP, Agent), Phase 3 regression testing and reporting engine, RBAC permission enforcement, and the `/auth/*` URL namespace refactoring with permanent legacy redirection.
2. **Findings Management, Lifecycle Triage, and Data Provenance Hooks (Lead: Vedant Mathur)**: Responsible for the finding status state machine (`FindingStatus`, `FindingStatusHistory`), Alembic schema migration (`003_findings_lifecycle`), triage business logic (`findings_service.py`), execution trace schema extensions (`trace_metadata`, `evidence_reference`), and client-side state integration via TanStack Query hooks (`useFindings`, `useFindingHistory`, `useChangeFindingStatus`).

System integrity is safeguarded by 24 backend automated test modules (spanning unit, integration, and security layers), 15 frontend unit/integration test suites encompassing 175 passing test cases, 4 Playwright end-to-end specifications, and 28 formal architectural and threat-modeling documentation records.

---

## 8. Table IV: Repository Structure and Contribution Record

The table below summarizes the verifiable repository structure, module ownership, commit evidence, and test coverage.

### Table IV: Repository Structure and Contribution Record

| Subsystem / Architectural Layer | Primary Directory / Artefact Path | Verifiable Scope & Implemented Modules | Verified Contributor(s) | Commit Evidence (Hashes / PRs) | Automated Test Suite Artefact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Baseline & Orchestration** | `docker-compose.yml`, `Makefile`, `backend/app/main.py`, `infrastructure/` | Container orchestration, FastAPI lifecycle, CORS middleware, global error handlers, monorepo environment configuration. | Rudraksh Sachdeva | `e020369`, `17c2f79` | `backend/tests/integration/test_cors.py` |
| **Execution Engine & Dynamic Canary Tracing** | `backend/app/engine/`, `backend/app/core/canary.py`, `backend/app/engine/adapters/` | Session-bound canary token generation (`secrets.token_hex`), target adapter interface (Mock, HTTP, Agent), assertion evaluators, taint instrumentation. | Rudraksh Sachdeva | `4904f03` | `backend/tests/unit/test_canaries.py`<br>`backend/tests/unit/test_adapters.py`<br>`backend/tests/unit/test_assertions.py`<br>`backend/tests/integration/test_execution_flow.py` |
| **Findings Triage & Lifecycle State Machine** | `backend/app/models/execution.py`, `backend/app/services/findings_service.py`, `backend/migrations/versions/003_*.py` | Finding status lifecycle (`NEW` → `CONFIRMED` → `RESOLVED` → `FALSE_POSITIVE`), status audit history, database schema migration, execution fingerprinting. | Vedant Mathur | `e32c731`, `f2d7fed`, `c7c798e`, `e1d8b98`, `9f89c4f`, `78258f9`, `5ba011d`, `c9f1b4b` | `backend/app/api/v1/findings/router.py`<br>`backend/tests/integration/test_phase3_integration.py` |
| **Findings Client Services & Hooks** | `frontend/src/services/finding.service.ts`, `frontend/src/hooks/use-findings.ts`, `frontend/src/types/finding.ts` | Client finding API client, paginated search/filter params, `useFindings` and `useChangeFindingStatus` hooks, TypeScript interfaces. | Vedant Mathur | `1b764d0`, `61654b4`, `3b0f6f0`, `140b035` | `frontend/tests/dashboard.test.tsx` |
| **Analytics, Regression & Research Evaluation** | `backend/app/services/analytics_service.py`, `backend/app/services/regression_service.py`, `backend/app/services/report_service.py` | Cross-target comparative vulnerability scoring, regression fingerprinting, report generation (JSON/Markdown), experiment matrix tracking. | Rudraksh Sachdeva | `f84096d` | `backend/tests/unit/test_phase3_*.py`<br>`backend/tests/integration/test_phase3_integration.py` |
| **RBAC, Security Center & Researcher Workspace** | `backend/app/api/v1/security/`, `backend/app/dependencies/permissions.py`, `frontend/src/app/(dashboard)/security/` | Role-based authorization matrix (Admin, Security Researcher, Viewer), permission dependencies, dedicated security researcher assessment workspace. | Rudraksh Sachdeva | `75e158d` | `backend/tests/security/test_rbac_enforcement.py`<br>`backend/tests/integration/test_security_overview.py`<br>`frontend/tests/permissions.test.tsx`<br>`frontend/tests/researcher-workspace.test.tsx` |
| **Authentication Architecture & URL Refactoring** | `frontend/src/app/auth/`, `frontend/src/lib/auth-redirect.ts`, `frontend/next.config.mjs` | Unified `/auth/*` URL namespace (`login`, `register`, `forgot-password`, `reset-password`, `verify-email`), 308 permanent legacy redirects, open-redirect protection. | Rudraksh Sachdeva | `cbc90a1`, `cd09fa8`, `ba8c877`, `678c7e5`, PR #1 | `frontend/tests/auth.test.tsx` (48 tests)<br>`frontend/tests/auth-redirect.test.ts` (28 tests)<br>`frontend/e2e/auth.spec.ts` |
| **Frontend UI/UX & Responsive Design System** | `frontend/src/app/(dashboard)/`, `frontend/src/components/`, `frontend/src/styles/globals.css` | Vercel-inspired landing page, responsive dashboard layout, KPI sparklines, column charts, accessible form components, Edge password toggle fix. | Rudraksh Sachdeva | `23477f9`, `c4f5b64`, `17c2f79`, PR #1 | `frontend/tests/dashboard-components.test.tsx`<br>`frontend/tests/overview.test.tsx` |
| **Database Performance & Connection Resilience** | `backend/app/core/database.py`, `backend/app/repositories/dashboard_repository.py` | Engine `pool_pre_ping` connection recycling, single-pass SQL metric aggregation via `DashboardRepository`, async test session factory. | Rudraksh Sachdeva | `822d2a7`, PR #2 | `backend/tests/unit/test_db_idle_ping.py`<br>`backend/tests/integration/test_dashboard_queries.py`<br>`backend/tests/integration/test_test_runs_api.py` |
| **Technical Documentation & Research Evidence** | `docs/architecture/`, `docs/decisions/`, `docs/security/`, `docs/research/` | 28 technical specifications: 7 Architecture docs, 7 ADRs, 5 Security docs, 3 Database schemas, and formal research test verification records (T1–T10). | Rudraksh Sachdeva | `e020369`, `4904f03`, `17c2f79`, `cbc90a1` | `docs/qa/authentication-audit.md`<br>`docs/research/test-cases-and-observed-outcomes.md` |
