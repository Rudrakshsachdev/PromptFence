# Authentication and Token Lifecycle — PromptFence

## Overview
PromptFence utilizes a defense-in-depth authentication scheme combining short-lived access JWTs, long-lived refresh tokens stored as cryptographic hashes, token rotation with family tracking, and HttpOnly secure cookies.

## 1. Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Agent
    participant API as /api/v1/auth/login
    participant Service as AuthService
    participant Repo as SessionRepository
    participant DB as PostgreSQL

    User->>API: POST /login (email, password)
    API->>Service: Authenticate credentials
    Service->>Service: Verify Argon2id password hash
    Service->>Service: Generate 15-min Access Token (JWT)
    Service->>Service: Generate 7-day Refresh Token with family_id
    Service->>Repo: Store SHA-256(refresh_token)
    Repo->>DB: INSERT INTO refresh_tokens
    Service-->>API: Return tokens
    API-->>User: Set-Cookie: access_token (HttpOnly, Path=/)<br/>Set-Cookie: refresh_token (HttpOnly, Path=/api/v1/auth)
```

## 2. Token Rotation and Reuse Detection

```mermaid
sequenceDiagram
    autonumber
    actor User as User Agent
    participant API as /api/v1/auth/refresh
    participant Service as AuthService
    participant DB as PostgreSQL

    User->>API: POST /refresh with refresh_token cookie
    API->>Service: Rotate token
    Service->>DB: SELECT token WHERE hash = SHA-256(token)
    alt Token is valid and unrevoked
        Service->>DB: Mark old token revoked_at = NOW()
        Service->>Service: Generate new access token
        Service->>Service: Generate new refresh token with SAME family_id
        Service->>DB: INSERT new refresh token
        Service-->>User: Set updated cookies
    else Token is already revoked (REUSE DETECTED!)
        Note over Service,DB: Compromised token detected!
        Service->>DB: UPDATE refresh_tokens SET revoked_at = NOW()<br/>WHERE family_id = :family_id
        Service-->>User: 401 Unauthorized (All sessions in family terminated)
    end
```

