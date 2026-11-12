# ADR-006: Role-Based Access Control (RBAC) and Resource Ownership Enforcement

## Status
Accepted

## Context
PromptFence supports diverse user personas: system administrators, security researchers authoring and running test suites, and read-only viewers or compliance auditors. Without granular permissions, users could tamper with other researchers' targets or trigger unauthorized tests (Insecure Direct Object Reference - IDOR).

## Decision
We implement a hybrid Role-Based Access Control (RBAC) and Object Ownership verification model:
1. **Three Core System Roles**:
   - `admin`: Full system administrative privileges, user management, global configuration, and access to all workspaces.
   - `security_researcher`: Creation, modification, execution, and deletion of own targets, test suites, and attack scenarios. Read-only access to shared resources.
   - `viewer`: Read-only access to public or team-visible targets, scenarios, test runs, and analytics. Cannot create or edit resources.
2. **Explicit Permission Strings**:
   - Permissions are fine-grained strings formatted as `<resource>:<action>` (e.g., `targets:create`, `targets:update`, `scenarios:delete`, `users:manage`).
   - Defined centrally in `app/permissions/roles.py` and mapped via `ROLE_PERMISSIONS_MATRIX`.
3. **Dual Enforcement in Dependencies**:
   - Route dependencies (`require_permission("targets:update")`) verify that the authenticated user possesses the required permission.
   - Ownership guards verify that non-admin users can only update or delete resources where `resource.owner_id == current_user.id`, completely mitigating IDOR.

## Consequences
### Positive
- Strict defense against privilege escalation and IDOR.
- Scalable: adding new roles or custom permission sets requires no changes to endpoint logic.
- Self-documenting matrix matches enterprise compliance standards.

### Negative / Trade-offs
- Every state-mutating service method must verify ownership or receive the requesting user object for contextual validation.

