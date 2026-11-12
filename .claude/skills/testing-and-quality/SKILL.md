---
name: testing-and-quality
description: Design, implement, and run automated unit, integration, security, and end-to-end tests across PromptFence.
---

# Testing and Quality Skill

## Purpose
Guarantee code correctness, prevent regressions, and enforce 80%+ test coverage across backend and frontend codebases.

## Trigger Conditions
- Adding new service methods or API endpoints.
- Building frontend pages and interactive forms.
- Running CI quality gates or pre-merge verification.

## Testing Layers

### 1. Backend Tests (`backend/tests/`)
- **Unit Tests** (`tests/unit/`): Pure unit logic (password hashing, JWT encode/decode, SSRF URL blocking).
- **Integration Tests** (`tests/integration/`): API route testing with mock or in-memory DB sessions.
- **Security Tests** (`tests/security/`): IDOR resource tampering, unauthenticated route rejection, token reuse detection.
- **Run Command**:
  ```bash
  cd backend && python -m pytest tests/unit -v
  ```

### 2. Frontend Tests (`frontend/tests/`)
- Vitest + React Testing Library.
- Test form validation, empty states, and badge rendering.
- **Run Command**:
  ```bash
  cd frontend && pnpm test
  ```

### 3. End-to-End Tests (`frontend/e2e/`)
- Playwright tests covering critical user journeys:
  1. Register account
  2. Verify email
  3. Sign in
  4. Create AI target
  5. Author scenario
  6. Assemble test suite
  7. Logout
- **Run Command**:
  ```bash
  cd frontend && pnpm test:e2e
  ```

## Quality Gate Checklist
- [ ] Backend unit and integration tests pass without error?
- [ ] Frontend unit tests pass?
- [ ] No type check warnings (`tsc --noEmit`)?
- [ ] No secrets committed into git?

