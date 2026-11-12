# Contributing to PromptFence

Thank you for your interest in contributing to PromptFence! We welcome contributions from the cybersecurity, machine learning, and software engineering communities.

---

## Code of Conduct

All contributors must adhere to high standards of respectful, collaborative, and inclusive communication. As a security-oriented project, responsible disclosure and high engineering rigor are paramount.

---

## Development Workflow

1. **Fork and Branch**: Create a feature branch named according to convention:
   - `feature/<name>` for new capabilities
   - `fix/<name>` for bug fixes
   - `security/<name>` for security enhancements
   - `docs/<name>` for documentation updates
2. **Follow Architectural Layering**:
   - Backend changes must maintain the 4-tier separation: `Router -> Service -> Repository -> Model`.
   - Frontend changes must adhere to Server Components first, with client components restricted to interactive leaves.
3. **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(targets): add pagination and tag filtering`
   - `fix(auth): invalidate token families on reuse`
   - `test(ssrf): add unit test for link-local ipv6 range`
4. **Automated Testing**:
   - Every new feature must be accompanied by automated tests.
   - Run tests before opening a pull request:
     ```bash
     cd backend && pytest
     cd frontend && npm test
     ```

---

## Code Quality Standards

Before committing, ensure your changes pass all linters and type checkers:

- **Python (Backend)**:
  - Formatter & Linter: `ruff check` and `ruff format`
  - Type Checker: `mypy --strict`
- **TypeScript (Frontend)**:
  - Linter: `npm run lint`
  - Type Checker: `npm run type-check`

---

## Security Vulnerability Reporting

Please **do not** open public GitHub issues for sensitive security vulnerabilities. Follow the procedures outlined in our [SECURITY.md](SECURITY.md).

