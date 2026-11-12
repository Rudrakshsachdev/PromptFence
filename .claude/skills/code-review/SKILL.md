---
name: code-review
description: Perform senior-level code reviews to identify architectural violations, security flaws, and performance bottlenecks.
---

# Code Review Skill

## Purpose
Enforce engineering standards and security rigor before code is merged into the PromptFence repository.

## Trigger Conditions
- Reviewing pull requests or uncommitted changes.
- Auditing newly implemented modules for anti-patterns.
- Conducting security inspections on authentication, SSRF, and authorization.

## Review Anti-Patterns (Auto-Reject)
1. **Business Logic in Routers**: Routers must only extract parameters and call services.
2. **Direct DB queries in Frontend**: Components must use TanStack Query hooks calling `src/services/`.
3. **Hardcoded Secrets**: Any API keys, passwords, or tokens in source code.
4. **Suppressed Errors**: Bare `except:` or empty `catch {}` blocks that swallow exceptions.
5. **Missing IDOR Verification**: Fetching an entity without verifying `user.id == entity.owner_id` (or admin bypass).
6. **Bypassed SSRF Check**: Making outbound requests without validating the URL through `app/integrations/ssrf.py`.
7. **Tokens in localStorage**: Access or refresh tokens stored in browser web storage instead of HttpOnly cookies.
8. **Premature Phase 2 Implementation**: Full canary generation or background execution logic committed before Phase 1 is sealed.

## Review Output Format
When reviewing code, provide:
- **Verdict**: [APPROVE / CHANGES_REQUESTED]
- **Architectural Alignment**: Summary of layering compliance.
- **Security Assessment**: Review of auth, IDOR, SSRF, input validation.
- **Actionable Findings**: Concrete file paths, line numbers, and proposed corrections.

