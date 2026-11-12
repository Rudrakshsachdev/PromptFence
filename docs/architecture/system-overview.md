# System Architecture Overview — PromptFence

## 1. System Vision
PromptFence is an AI Application Security Testing Lab engineered for evaluating LLM-integrated systems against indirect prompt injection, sensitive data leakage, unauthorized tool execution, and instruction conflicts.

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 14 Frontend                    │
│   App Router, Server Components, TypeScript, shadcn/ui      │
│   Port: 3000                                                │
└──────────────────────────────┬──────────────────────────────┘
                               │
            HttpOnly Cookies   │ REST / JSON
            JWT Authorization  │ CORS Restricted
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│   Uvicorn, Pydantic v2, Async SQLAlchemy 2.0, Argon2id      │
│   Port: 8000                                                │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
         SQL / │                        HTTP  │ Safe HTTP Client
        Async  │ Transactions       Outbound  │ SSRF Protected
               ▼                              ▼
┌──────────────────────────────┐  ┌───────────────────────────┐
│        PostgreSQL 16         │  │    External AI Targets    │
│   Alembic Migrations         │  │    LLM Chat & Agent APIs  │
│   Port: 5432                 │  │    Tested Applications    │
└──────────────────────────────┘  └───────────────────────────┘
```

## 3. Tier Responsibilities

### Frontend Tier (Next.js 14 App Router)
- **Server Components by default**: Minimizes client JavaScript payload and accelerates initial rendering.
- **Client Components**: Used strictly for interactive forms, search filters, modal dialogues, and live charts.
- **State Separation**: Server state managed via TanStack Query (React Query) with automatic cache invalidation; authentication state synchronized via React Context with silent cookie-based token refresh.

### Backend Tier (FastAPI & Python 3.12)
- **Layered Architecture**: Strict Router → Dependency → Service → Repository → Model hierarchy.
- **Security Middleware**: Slotted CORS allowlisting, sliding-window rate limiting, structured request logging, and secure HTTP response headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- **Outbound HTTP Client**: Hardened SSRF validator prohibiting loopback, private RFC 1918 subnets, cloud instance metadata services, and link-local destinations.

### Data Tier (PostgreSQL 16)
- Normalized relational schema supporting users, RBAC roles, refresh token families, AI application targets, target version snapshots, test suites, and attack scenario templates.
- Explicit UUID primary keys and timezone-aware timestamps.
- Alembic database migration management.

