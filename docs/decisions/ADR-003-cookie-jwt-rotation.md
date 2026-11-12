# ADR-003: Cookie-Transported JWT with Single-Use Refresh Token Rotation and Family Invalidation

## Status
Accepted

## Context
PromptFence is an AI application security testing lab used by security professionals. Storing access tokens in browser `localStorage` or `sessionStorage` leaves them vulnerable to Cross-Site Scripting (XSS) extraction. Conversely, traditional server-side stateful sessions create horizontal scaling bottlenecks.

## Decision
We implement a hybrid, highly secure authentication architecture:
1. **Access Token (Short-Lived JWT)**:
   - Lifespan: 15 to 30 minutes.
   - Encoded with user ID, role, permissions, and cryptographic signature (`HS256` or `RS256`).
   - Transported in `HttpOnly`, `Secure`, `SameSite=Lax` cookies (or `Authorization: Bearer` header for programmatic API access).
2. **Refresh Token (Long-Lived Opaque Cryptographic Token)**:
   - Lifespan: 7 days.
   - Stored in PostgreSQL with family tracking (`family_id`), hashed token values (`token_hash`), IP address, and user agent metadata.
   - Transported in a dedicated `HttpOnly`, `Path=/api/v1/auth`, `SameSite=Lax` cookie.
3. **Single-Use Rotation**:
   - Every refresh request invalidates the presenting refresh token and issues a new one in the same token family.
4. **Token Family Reuse Detection**:
   - If an already-used or revoked refresh token is presented, the system detects a potential token replay/theft attack and immediately revokes all tokens in that `family_id`, forcing re-authentication and logging a security alert.
5. **Argon2id Password Hashing**:
   - Primary password hashing uses Argon2id (with bcrypt fallback for compatibility) to protect stored credentials against GPU-based offline cracking.

## Consequences
### Positive
- Immune to XSS-based token exfiltration because JavaScript cannot read `HttpOnly` cookies.
- Resilient against token replay attacks via family invalidation.
- Stateless access token verification reduces DB load on frequent API queries while maintaining full revocation capability via refresh tokens.

### Negative / Trade-offs
- Refresh requests require a database lookup to verify token status and family validity.
- Cross-origin CORS setup requires `credentials: true` and explicit origin whitelisting.

