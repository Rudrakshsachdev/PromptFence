# RBAC Authorization Matrix — PromptFence

## Role Hierarchy

| Role Name | Description | Key Capabilities |
|---|---|---|
| **Admin** (`admin`) | Full platform administrator | Manage all users, assign roles, view global system metrics, configure platform-wide policies |
| **Security Researcher** (`security_researcher`) | Security practitioner & test author | Create & validate targets, author attack scenarios, build test suites, execute evaluations |
| **Viewer** (`viewer`) | Read-only auditor | View dashboard metrics, inspect shared targets, browse scenario library without modification rights |

## Permission Mapping

| Permission | Admin | Security Researcher | Viewer |
|---|:---:|:---:|:---:|
| `users:read` | ✓ | — | — |
| `users:write` | ✓ | — | — |
| `users:delete` | ✓ | — | — |
| `targets:read` | ✓ | ✓ | ✓ |
| `targets:write` | ✓ | ✓ | — |
| `targets:delete` | ✓ | ✓ | — |
| `targets:validate` | ✓ | ✓ | — |
| `test_suites:read` | ✓ | ✓ | ✓ |
| `test_suites:write` | ✓ | ✓ | — |
| `test_suites:delete` | ✓ | ✓ | — |
| `scenarios:read` | ✓ | ✓ | ✓ |
| `scenarios:write` | ✓ | ✓ | — |
| `scenarios:delete` | ✓ | ✓ | — |
| `dashboard:read` | ✓ | ✓ | ✓ |
| `system:admin` | ✓ | — | — |

