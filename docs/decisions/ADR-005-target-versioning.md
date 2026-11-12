# ADR-005: Target Configuration Versioning and Audit Trail

## Status
Accepted

## Context
In security regression testing, an AI application's system prompt, temperature, model version, or authentication headers might change over time. If a user updates a Target in place, historical test run results would point to the latest configuration rather than the exact configuration that was tested at the time, destroying the integrity of forensic evidence and regression comparisons.

## Decision
We decouple target identity from target configuration using an immutable versioning model:
1. **`targets` Table**:
   - Represents the target entity (`id`, `name`, `description`, `owner_id`, `created_at`, `is_active`).
2. **`target_versions` Table**:
   - Stores immutable snapshots of target configuration:
     - `version_number` (monotonic integer per target)
     - `endpoint_url`
     - `api_format` (e.g. `openai_chat`, `anthropic_messages`, `generic_json`)
     - `default_headers` (encrypted/hashed if containing sensitive keys)
     - `default_parameters` (temperature, max_tokens, etc.)
     - `system_prompt`
     - `changelog_summary`
     - `created_by`
     - `created_at`
3. **Automated Version Creation**:
   - Whenever a target configuration is modified via `target_service.update_target`, the service increments `current_version` and appends a new `TargetVersion` record in a single database transaction.
   - Historical test runs link directly to `target_version_id`, guaranteeing reproducible evaluation history.

## Consequences
### Positive
- Full auditability: researchers can see exactly what changed, when, and by whom.
- Enables accurate longitudinal comparisons between model prompts and model iterations in Phase 3.
- Database integrity: historical test executions are never invalidated by target updates.

### Negative / Trade-offs
- Modifying a target requires an insert into `target_versions` in addition to updating the parent record.
- Read operations for "current configuration" perform a join with the latest `target_versions` row.

