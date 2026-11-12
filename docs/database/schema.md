# Database Schema Documentation

> PromptFence — AI Application Security Testing Platform
>
> PostgreSQL 16 · SQLAlchemy 2.0 · Alembic Migrations

This document describes every table in the Phase 1 database schema. Each entry covers columns, types, constraints, indexes, and relationships.

---

## Table of Contents

- [Authentication \& Authorization](#authentication--authorization)
  - [users](#users)
  - [roles](#roles)
  - [permissions](#permissions)
  - [role\_permissions](#role_permissions)
  - [user\_roles](#user_roles)
  - [refresh\_tokens](#refresh_tokens)
  - [password\_reset\_tokens](#password_reset_tokens)
  - [email\_verification\_tokens](#email_verification_tokens)
- [Targets](#targets)
  - [targets](#targets-1)
  - [target\_versions](#target_versions)
- [Test Management](#test-management)
  - [test\_suites](#test_suites)
  - [test\_cases](#test_cases)
  - [suite\_test\_cases](#suite_test_cases)
- [Enum Types](#enum-types)
- [Naming Conventions](#naming-conventions)

---

## Authentication & Authorization

### `users`

Core user accounts table. Stores credentials, profile information, and account‑security state.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique user identifier |
| `email` | `VARCHAR(255)` | NO | — | **UNIQUE**, indexed | User email address; used as login identifier |
| `hashed_password` | `VARCHAR(255)` | NO | — | — | Argon2id hash of the user password |
| `full_name` | `VARCHAR(150)` | NO | — | — | Display name |
| `is_active` | `BOOLEAN` | NO | `true` | — | Whether the account is enabled; `false` prevents login |
| `is_verified` | `BOOLEAN` | NO | `false` | — | Whether the email address has been verified |
| `failed_login_attempts` | `INTEGER` | NO | `0` | `CHECK (failed_login_attempts >= 0)` | Counter incremented on bad credentials; reset on success |
| `locked_until` | `TIMESTAMPTZ` | YES | `NULL` | — | If set, the account is locked until this timestamp |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | Row creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | Updated automatically on every write via trigger |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_users` | `id` | PRIMARY KEY | — |
| `uq_users_email` | `email` | UNIQUE | Case‑insensitive via `lower(email)` functional index recommended |
| `ix_users_is_active` | `is_active` | B‑tree | Speeds up filtering active users |
| `ix_users_created_at` | `created_at` | B‑tree | Supports ordering / pagination |

---

### `roles`

Named roles that bundle permissions (e.g., `admin`, `security_researcher`, `viewer`). System roles cannot be deleted through the API.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique role identifier |
| `name` | `VARCHAR(100)` | NO | — | **UNIQUE** | Human‑readable role name (e.g., `admin`) |
| `description` | `TEXT` | YES | `NULL` | — | Optional long description of the role's purpose |
| `is_system` | `BOOLEAN` | NO | `false` | — | System roles are seeded at startup and cannot be deleted |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | Row creation timestamp |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_roles` | `id` | PRIMARY KEY | — |
| `uq_roles_name` | `name` | UNIQUE | — |

---

### `permissions`

Granular permission entries describing an allowed (resource, action) pair. Permissions are assigned to roles, never directly to users.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique permission identifier |
| `resource` | `VARCHAR(100)` | NO | — | — | Resource name (e.g., `targets`, `test_suites`, `users`) |
| `action` | `VARCHAR(50)` | NO | — | — | Action verb (e.g., `create`, `read`, `update`, `delete`, `execute`) |
| `description` | `TEXT` | YES | `NULL` | — | Human‑readable description of what this permission grants |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | Row creation timestamp |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_permissions` | `id` | PRIMARY KEY | — |
| `uq_permissions_resource_action` | `(resource, action)` | UNIQUE | A resource/action pair appears at most once |

---

### `role_permissions`

Junction table implementing the many‑to‑many relationship between `roles` and `permissions`.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `role_id` | `UUID` | NO | — | **PK** (composite), **FK → roles.id** `ON DELETE CASCADE` | Role receiving the permission |
| `permission_id` | `UUID` | NO | — | **PK** (composite), **FK → permissions.id** `ON DELETE CASCADE` | Permission being granted |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_role_permissions` | `(role_id, permission_id)` | PRIMARY KEY (composite) | — |
| `ix_role_permissions_permission_id` | `permission_id` | B‑tree | Speeds up reverse lookups ("which roles have this permission?") |

---

### `user_roles`

Junction table assigning roles to users. Tracks who assigned the role and when.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `user_id` | `UUID` | NO | — | **PK** (composite), **FK → users.id** `ON DELETE CASCADE` | User receiving the role |
| `role_id` | `UUID` | NO | — | **PK** (composite), **FK → roles.id** `ON DELETE CASCADE` | Role being assigned |
| `assigned_by` | `UUID` | YES | `NULL` | **FK → users.id** `ON DELETE SET NULL` | Admin who made the assignment; `NULL` if seeded |
| `assigned_at` | `TIMESTAMPTZ` | NO | `now()` | — | Timestamp of assignment |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_user_roles` | `(user_id, role_id)` | PRIMARY KEY (composite) | — |
| `ix_user_roles_role_id` | `role_id` | B‑tree | Speeds up "which users have this role?" queries |
| `ix_user_roles_assigned_by` | `assigned_by` | B‑tree | Audit trail lookups by assigner |

---

### `refresh_tokens`

Opaque refresh tokens issued during login. The raw token value is never stored—only its SHA‑256 hash.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique token record identifier |
| `user_id` | `UUID` | NO | — | **FK → users.id** `ON DELETE CASCADE`, indexed | Owning user |
| `token_hash` | `VARCHAR(255)` | NO | — | **UNIQUE** | SHA‑256 hash of the raw refresh token |
| `expires_at` | `TIMESTAMPTZ` | NO | — | — | Absolute expiry; tokens past this timestamp are invalid |
| `is_revoked` | `BOOLEAN` | NO | `false` | — | Set `true` on explicit logout or rotation |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | When the token was issued |
| `revoked_at` | `TIMESTAMPTZ` | YES | `NULL` | — | When the token was revoked (if ever) |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_refresh_tokens` | `id` | PRIMARY KEY | — |
| `uq_refresh_tokens_token_hash` | `token_hash` | UNIQUE | Token look‑up by hash |
| `ix_refresh_tokens_user_id` | `user_id` | B‑tree | Retrieve all tokens for a user (e.g., "revoke all") |
| `ix_refresh_tokens_expires_at` | `expires_at` | B‑tree | Efficient cleanup of expired tokens |

---

### `password_reset_tokens`

One‑time tokens for the "forgot password" flow. Token is sent via email; only its hash is stored.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique record identifier |
| `user_id` | `UUID` | NO | — | **FK → users.id** `ON DELETE CASCADE`, indexed | User requesting the reset |
| `token_hash` | `VARCHAR(255)` | NO | — | **UNIQUE** | SHA‑256 hash of the reset token |
| `expires_at` | `TIMESTAMPTZ` | NO | — | — | Token validity window (typically 1 hour) |
| `is_used` | `BOOLEAN` | NO | `false` | — | Set `true` once the password has been successfully changed |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | When the token was generated |
| `used_at` | `TIMESTAMPTZ` | YES | `NULL` | — | When the token was consumed (if ever) |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_password_reset_tokens` | `id` | PRIMARY KEY | — |
| `uq_password_reset_tokens_token_hash` | `token_hash` | UNIQUE | Token look‑up |
| `ix_password_reset_tokens_user_id` | `user_id` | B‑tree | Find pending resets for a user |

---

### `email_verification_tokens`

One‑time tokens sent during registration to verify the user's email address.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique record identifier |
| `user_id` | `UUID` | NO | — | **FK → users.id** `ON DELETE CASCADE`, indexed | User whose email is being verified |
| `token_hash` | `VARCHAR(255)` | NO | — | **UNIQUE** | SHA‑256 hash of the verification token |
| `expires_at` | `TIMESTAMPTZ` | NO | — | — | Token validity window (typically 24 hours) |
| `is_used` | `BOOLEAN` | NO | `false` | — | Set `true` once the email is verified |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | When the token was generated |
| `used_at` | `TIMESTAMPTZ` | YES | `NULL` | — | When the token was consumed (if ever) |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_email_verification_tokens` | `id` | PRIMARY KEY | — |
| `uq_email_verification_tokens_token_hash` | `token_hash` | UNIQUE | Token look‑up |
| `ix_email_verification_tokens_user_id` | `user_id` | B‑tree | Find pending verifications for a user |

---

## Targets

### `targets`

AI systems under test. Each target represents an LLM endpoint (OpenAI, Anthropic, custom API, or local model) that PromptFence will probe for vulnerabilities.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique target identifier |
| `name` | `VARCHAR(200)` | NO | — | — | Human‑readable name (e.g., "Production GPT‑4") |
| `description` | `TEXT` | YES | `NULL` | — | Optional description of the target and its purpose |
| `target_type` | `target_type_enum` | NO | — | `CHECK (target_type IN ('OPENAI','ANTHROPIC','CUSTOM_API','LOCAL_MODEL'))` | Type of AI endpoint |
| `base_url` | `VARCHAR(2048)` | NO | — | — | Base URL of the target API |
| `owner_id` | `UUID` | NO | — | **FK → users.id** `ON DELETE CASCADE`, indexed | User who created the target |
| `is_active` | `BOOLEAN` | NO | `true` | — | Whether the target is available for testing |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | Row creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | Updated on every write via trigger |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_targets` | `id` | PRIMARY KEY | — |
| `ix_targets_owner_id` | `owner_id` | B‑tree | Filter targets by owner |
| `ix_targets_target_type` | `target_type` | B‑tree | Filter by endpoint type |
| `ix_targets_is_active` | `is_active` | B‑tree | Filter active targets |

---

### `target_versions`

Snapshot of a target's configuration at a point in time. Allows tracking which model version and settings were in use during a test run.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique version identifier |
| `target_id` | `UUID` | NO | — | **FK → targets.id** `ON DELETE CASCADE`, indexed | Parent target |
| `version_label` | `VARCHAR(100)` | NO | — | — | User‑assigned version label (e.g., `v1.2`, `2024-Q3`) |
| `model_name` | `VARCHAR(200)` | YES | `NULL` | — | Underlying model identifier (e.g., `gpt-4-turbo-2024-04-09`) |
| `config` | `JSONB` | YES | `'{}'::jsonb` | — | Free‑form configuration: temperature, max tokens, system prompt, headers, etc. |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | Row creation timestamp |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_target_versions` | `id` | PRIMARY KEY | — |
| `ix_target_versions_target_id` | `target_id` | B‑tree | List versions for a target |
| `uq_target_versions_target_label` | `(target_id, version_label)` | UNIQUE | No duplicate labels within the same target |

---

## Test Management

### `test_suites`

Ordered collections of test cases grouped by theme (e.g., "OWASP LLM Top 10", "Custom Prompt Injection Suite").

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique suite identifier |
| `name` | `VARCHAR(200)` | NO | — | — | Suite title |
| `description` | `TEXT` | YES | `NULL` | — | Detailed description of the suite's testing scope |
| `category` | `VARCHAR(100)` | YES | `NULL` | — | Logical category (e.g., `prompt_injection`, `data_exfiltration`, `jailbreak`) |
| `severity_level` | `severity_enum` | NO | `'MEDIUM'` | `CHECK (severity_level IN ('LOW','MEDIUM','HIGH','CRITICAL'))` | Default severity assigned to the suite |
| `owner_id` | `UUID` | NO | — | **FK → users.id** `ON DELETE CASCADE`, indexed | User who created the suite |
| `is_public` | `BOOLEAN` | NO | `false` | — | Public suites are visible to all users |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | Row creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | Updated on every write via trigger |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_test_suites` | `id` | PRIMARY KEY | — |
| `ix_test_suites_owner_id` | `owner_id` | B‑tree | Filter suites by owner |
| `ix_test_suites_category` | `category` | B‑tree | Filter by category |
| `ix_test_suites_is_public` | `is_public` | B‑tree | Filter public suites |

---

### `test_cases`

Individual security test definitions. Each test case contains a prompt template designed to probe for a specific vulnerability type.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **PK** | Unique test case identifier |
| `name` | `VARCHAR(200)` | NO | — | — | Short name of the test |
| `description` | `TEXT` | YES | `NULL` | — | Detailed description of the attack vector |
| `attack_type` | `attack_type_enum` | NO | — | `CHECK (attack_type IN ('PROMPT_INJECTION','JAILBREAK','DATA_EXFILTRATION','PRIVILEGE_ESCALATION','DENIAL_OF_SERVICE','MODEL_MANIPULATION','PII_LEAK','TOXICITY'))` | Classification of the attack |
| `prompt_template` | `TEXT` | NO | — | — | Jinja2 template for the attack prompt; supports variables like `{{system_prompt}}` |
| `expected_behavior` | `TEXT` | YES | `NULL` | — | Description of the expected safe response from the target |
| `severity` | `severity_enum` | NO | `'MEDIUM'` | `CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL'))` | Individual case severity |
| `owner_id` | `UUID` | NO | — | **FK → users.id** `ON DELETE CASCADE`, indexed | Creator of the test case |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — | Row creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — | Updated on every write via trigger |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_test_cases` | `id` | PRIMARY KEY | — |
| `ix_test_cases_attack_type` | `attack_type` | B‑tree | Filter by attack classification |
| `ix_test_cases_severity` | `severity` | B‑tree | Filter by severity |
| `ix_test_cases_owner_id` | `owner_id` | B‑tree | Filter by creator |

---

### `suite_test_cases`

Junction table linking test cases to test suites with explicit ordering.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `suite_id` | `UUID` | NO | — | **PK** (composite), **FK → test_suites.id** `ON DELETE CASCADE` | Parent suite |
| `test_case_id` | `UUID` | NO | — | **PK** (composite), **FK → test_cases.id** `ON DELETE CASCADE` | Test case in the suite |
| `order_index` | `INTEGER` | NO | `0` | `CHECK (order_index >= 0)` | Execution order within the suite (0‑based) |

**Indexes**

| Name | Columns | Type | Notes |
|---|---|---|---|
| `pk_suite_test_cases` | `(suite_id, test_case_id)` | PRIMARY KEY (composite) | — |
| `ix_suite_test_cases_test_case_id` | `test_case_id` | B‑tree | Reverse look‑up: "which suites include this case?" |
| `uq_suite_test_cases_order` | `(suite_id, order_index)` | UNIQUE | Prevents duplicate ordering within a suite |

---

## Enum Types

The following PostgreSQL `ENUM` types are created by the initial migration:

| Enum Name | Values | Used By |
|---|---|---|
| `target_type_enum` | `OPENAI`, `ANTHROPIC`, `CUSTOM_API`, `LOCAL_MODEL` | `targets.target_type` |
| `severity_enum` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `test_suites.severity_level`, `test_cases.severity` |
| `attack_type_enum` | `PROMPT_INJECTION`, `JAILBREAK`, `DATA_EXFILTRATION`, `PRIVILEGE_ESCALATION`, `DENIAL_OF_SERVICE`, `MODEL_MANIPULATION`, `PII_LEAK`, `TOXICITY` | `test_cases.attack_type` |

---

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural nouns | `user_roles` |
| Columns | `snake_case` | `created_at` |
| Primary keys | `pk_<table>` | `pk_users` |
| Foreign keys | `fk_<table>_<column>` | `fk_targets_owner_id` |
| Unique constraints | `uq_<table>_<columns>` | `uq_users_email` |
| Indexes | `ix_<table>_<columns>` | `ix_targets_owner_id` |
| Check constraints | `ck_<table>_<column>` | `ck_users_failed_login_attempts` |
| Enum types | `<name>_enum` | `severity_enum` |
