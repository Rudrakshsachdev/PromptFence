# Secure Development Standards — PromptFence

## Guidelines for Developers and AI Agents

1. **Input Validation Everywhere**:
   - Backend: Every request body must be parsed through a Pydantic v2 schema with explicit boundary constraints (min/max length, regex patterns).
   - Frontend: Every form must validate with a Zod schema before submission.
2. **Never Return Raw Exceptions in Production**:
   - Generic JSON error formats (`{"detail": "...", "code": "..."}`) must be returned without internal database stack traces or SQL syntax snippets.
3. **Prevent Insecure Direct Object References (IDOR)**:
   - When querying by ID, always ensure the requesting user is the owner, or possesses the `admin` role.
4. **Secrets Management**:
   - No credentials, API tokens, or private keys in Git.
   - Configure all secrets through environment variables documented in `.env.example`.
5. **Cookie Security**:
   - Set `httponly=True`, `samesite="lax"`, and `secure=True` (in production).

