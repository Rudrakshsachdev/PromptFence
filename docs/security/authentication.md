# Authentication Specifications — PromptFence

## Password Security
- **Algorithm**: Argon2id
- **Parameters**: `time_cost=3`, `memory_cost=65536` (64 MB), `parallelism=4`, `hash_len=32`, `salt_len=16`
- **Minimum Requirements**: 8 characters minimum, at least one uppercase letter and one number.

## Token Specifications
- **Access Token**:
  - Format: JWT (JSON Web Token)
  - Signature: HMAC-SHA256 (HS256)
  - Expiry: 15 minutes
  - Claims: `sub` (User UUID), `iat`, `exp`, `type="access"`, `roles` (array)
- **Refresh Token**:
  - Format: JWT signed with secret key
  - Expiry: 7 days
  - Storage: Persisted strictly as **SHA-256 hash** (`token_hash`) in `refresh_tokens` table. Raw tokens are never stored in the database.
  - Claims: `sub`, `family` (UUID), `jti` (UUID), `exp`, `type="refresh"`

