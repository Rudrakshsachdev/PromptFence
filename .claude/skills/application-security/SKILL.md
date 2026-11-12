---
name: application-security
description: Enforce application security controls, authentication mechanisms, authorization boundaries, and SSRF prevention.
---

# Application Security Skill

## Purpose
Ensure PromptFence adheres to strict security standards, preventing vulnerabilities (OWASP Top 10, SSRF, IDOR, Token Reuse).

## Trigger Conditions
- Modifying authentication or session rotation logic.
- Adding outbound HTTP request logic (target validation, webhook dispatch).
- Evaluating authorization checks or modifying the RBAC permission matrix.

## Key Security Controls

### 1. SSRF Prevention (`backend/app/integrations/ssrf.py`)
PromptFence validates user-defined target application endpoints. Outbound HTTP requests must strictly enforce:
- HTTP/HTTPS schemes only.
- DNS resolution of hostnames before making socket connections.
- Validation that resolved IP addresses do NOT belong to private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), link-local (`169.254.0.0/16`), or cloud metadata (`169.254.169.254`, `metadata.google.internal`).
- Strict connection timeout (max 10 seconds).
- Disable automatic redirect following to prevent DNS rebinding.

### 2. Session Security & Refresh Token Rotation
- Access tokens expire in 15 minutes.
- Refresh tokens (7 days) are hashed with SHA-256 before persistence in `refresh_tokens`.
- **Token Family Reuse Detection**: If a revoked refresh token is presented, the entire family is immediately revoked, forcing re-authentication across compromised chains.
- Passwords hashed with Argon2id (`time_cost=3`, `memory_cost=65536`, `parallelism=4`).

### 3. IDOR and RBAC Isolation
- Check ownership on every resource: `check_resource_ownership(resource.owner_id, user, roles)`.
- Enforce roles: Admin (platform-wide), Security Researcher (manage targets, suites, scenarios), Viewer (read-only).

## Security Checklist
- [ ] Are sensitive tokens transmitted in HttpOnly, Secure, SameSite cookies?
- [ ] Is password reset resistant to account enumeration (generic response)?
- [ ] Does target validation execute through `safe_http_request()`?
- [ ] Are SQL queries strictly built with SQLAlchemy ORM (parameterized)?

