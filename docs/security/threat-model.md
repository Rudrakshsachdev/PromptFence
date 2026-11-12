# Threat Model — PromptFence Security Lab

## 1. System Assets
1. **Target API Credentials**: Bearer tokens, API keys, and basic auth headers stored for external AI applications under evaluation.
2. **Adversarial Scenarios**: Proprietary attack prompts and sensitive canary token formulations.
3. **User Authentication Tokens**: Refresh tokens and session histories.
4. **Platform Infrastructure**: FastAPI backend, database, and Docker hosts.

## 2. Threat Actors & Attack Scenarios

### Threat Actor 1: Malicious / Compromised User (Tenant)
- **Goal**: Access other users' targets or test cases (IDOR).
- **Mitigation**: Service-layer ownership verification (`check_resource_ownership`), strict UUID indexing, and RBAC role dependencies.

### Threat Actor 2: Target Endpoint SSRF Exploiter
- **Goal**: Supply a Target URL pointing to AWS metadata (`http://169.254.169.254`), internal Docker services, or loopback interfaces, turning PromptFence into an internal network proxy.
- **Mitigation**: Hardened pre-request DNS resolution and IP blocklists in `app/integrations/ssrf.py`. Automatic redirect following is disabled.

### Threat Actor 3: Session Hijacker
- **Goal**: Steal access tokens or replay stale refresh tokens.
- **Mitigation**: HttpOnly, SameSite=Lax cookies; 15-minute access token expiry; token family tracking with automatic revocation of all descendant sessions upon detected reuse.

