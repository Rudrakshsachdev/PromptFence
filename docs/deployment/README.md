# Deployment Guide

This document outlines deployment architectures, configuration requirements, and operations for PromptFence in staging and production environments.

## Architecture Overview

PromptFence is deployed as three containerized services managed by Docker or Kubernetes, fronted by an Nginx reverse proxy:

```
┌────────────────────────────────────────────────────────┐
│               Public Internet / TLS 443               │
└──────────────────────────┬─────────────────────────────┘
                           │
                 ┌─────────▼─────────┐
                 │ Nginx Proxy / WAF │
                 └────┬─────────┬────┘
                      │         │
    /api/*, /docs, /health      │ /* (Next.js SSR)
                      │         │
       ┌──────────────▼───┐  ┌──▼───────────────┐
       │ FastAPI Backend  │  │ Next.js Frontend │
       │ (Port 8000)      │  │ (Port 3000)      │
       └──────────────┬───┘  └──────────────────┘
                      │
           ┌──────────▼──────────┐
           │ PostgreSQL 16 DB    │
           │ (Port 5432)         │
           └─────────────────────┘
```

---

## Production Configuration Checklist

Before deploying to production, verify all environment variables in `.env`:

| Variable | Requirement | Description |
|----------|-------------|-------------|
| `ENVIRONMENT` | `production` | Enables production security checks and disables debug mode |
| `SECRET_KEY` | 64+ char random hex | Secret key for cryptographic signatures and JWTs |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Connection string to managed PostgreSQL database |
| `ALLOWED_HOSTS` | FQDN list | Host header validation |
| `CORS_ORIGINS` | `https://promptfence.yourdomain.com` | Strict CORS origin whitelisting |
| `SECURE_COOKIES` | `true` | Enforces `Secure` flag on all session and auth cookies |
| `SSRF_ALLOW_PRIVATE_IPS` | `false` | Must strictly be false in production |

---

## Docker Compose Deployment

The repository includes a production-ready `docker-compose.yml`:

```bash
# Build and launch all services in detached mode
docker compose -f docker-compose.yml up -d --build

# Run database migrations
docker compose exec backend alembic upgrade head

# Check status of running containers
docker compose ps
```

---

## Health Checks & Monitoring

PromptFence provides dedicated health check endpoints:

- **Backend Health**: `GET /health`
  - Returns `{"status": "healthy", "database": "connected", "version": "0.1.0"}`
  - Used by Docker, Kubernetes liveness/readiness probes, and load balancers.
- **Frontend Health**: `GET /api/health`
  - Returns HTTP 200 when the Next.js server is actively serving requests.

---

## Database Backup and Restoration

### Automated Database Backup
```bash
docker compose exec db pg_dump -U postgres promptfence > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restoration
```bash
cat backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T db psql -U postgres promptfence
```

