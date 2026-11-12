# Security Policy

PromptFence is an AI application security testing lab built by and for security professionals. We prioritize the security of our platform, our users, and the targets configured within it.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

---

## Reporting a Vulnerability

If you discover a security vulnerability in PromptFence:

1. **Do not create a public issue or discussion thread.**
2. Send an email with vulnerability details to `security@promptfence.internal` (or via GitHub Private Vulnerability Reporting).
3. Include the following details in your report:
   - Severity and attack vector description.
   - Proof of concept (PoC) or step-by-step reproduction instructions.
   - Affected components (backend router, frontend client, database query, etc.).
   - Potential impact on confidential data or test targets.

---

## Security Architecture Highlights

PromptFence implements defense-in-depth security principles:

1. **SSRF Hardening**: All outbound connections to user-registered target endpoints are inspected to block loopback addresses, private RFC 1918 subnets, cloud metadata endpoints (`169.254.169.254`), and non-HTTP schemes.
2. **Token Security**: JWT access tokens are short-lived. Refresh tokens are single-use, stored as hashes in PostgreSQL, and protected by token family reuse detection.
3. **Password Hashing**: Passwords use Argon2id with strict computational difficulty parameters.
4. **IDOR Mitigation**: All state-modifying requests enforce resource ownership verification alongside granular RBAC permissions.
5. **Secret Protection**: Secrets are never hardcoded. Environment variables are loaded strictly via Pydantic v2 Settings.

