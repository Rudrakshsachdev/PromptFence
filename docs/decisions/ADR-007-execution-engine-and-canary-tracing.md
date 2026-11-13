# ADR-007: Phase 2 Execution Engine, Dynamic Canary Tainting & Provenance Tracing

## Status
Accepted

## Context
Phase 1 of PromptFence established core entities (Targets, Test Suites, Scenarios, Users, RBAC, Authentication). Phase 2 requires an execution engine that can execute test suites against targets, dynamically generate session-bound canaries, instrument synthetic sources, run deterministic security assertions, detect canary propagation, attribute findings with provenance evidence, and provide an interactive testing experience in the frontend.

## Decisions

### 1. In-Process Async Worker & Execution Queue
Rather than introducing external heavy message brokers (such as Redis/Celery/RabbitMQ), execution runs are managed asynchronously using Python's `asyncio` task orchestration combined with transactional PostgreSQL state persistence.
- Runs are enqueued with atomic status transitions (`PENDING` -> `QUEUED` -> `RUNNING` -> `COMPLETED` / `FAILED` / `CANCELLED`).
- Runs and test cases maintain immutable execution snapshots ensuring changes to targets or scenarios after run creation do not alter execution history.
- Cancellation flags are polled between test case boundaries and adapter calls, guaranteeing responsive termination.

### 2. Cryptographic Session-Bound Canary Lifecycle
- Canary tokens follow the format `pf_canary_<32-hex-bytes>` generated via `secrets.token_hex(16)`.
- Canaries are strictly session-bound to a specific `test_run_id` and synthetic `source_id`.
- For storage and verification, we do not store plaintext secrets; tokens are verified against their HMAC-SHA256 digest using `APP_SECRET_KEY` and an explicit `key_version` (`v1`).
- Tokens are time-limited (`expires_at`) and lookups are strictly run-isolated, preventing cross-run contamination or false attribution.

### 3. Evidence-Based Provenance Model
Attribution levels reflect verified trace evidence rather than inferred causality:
- `CONFIRMED_SOURCE_MATCH`: Canary observed and verified in an adapter-returned trace directly linked to the instrumented source.
- `OBSERVED_CANARY`: Canary observed in output/trace with verified digest, but intermediate trace linkage is unavailable.
- `TRACE_CORRELATED`: Target trace shows retrieval of the instrumented document chunk, but canary did not propagate to final output.
- `INFERRED`: Heuristic or behavioral indicators without exact cryptographic token verification.
- `UNATTRIBUTED`: Token or anomaly detected without known instrumented source mapping.

### 4. Pluggable Adapter Interface
All adapters implement a unified async interface (`validate_configuration`, `get_capabilities`, `execute`, `normalize_response`, `collect_traces`, `health_check`).
- `MockAdapter`: In-memory configurable engine supporting secure baseline behavior and deterministic vulnerable behaviors (indirect prompt injection, canary leakage, unauthorized tool execution).
- `HttpAdapter`: Authorized external AI endpoints with strict SSRF defenses (DNS resolution validation, loopback/private IP blocking, redirect validation, timeout and response size limits).
- `RagAdapter`: Simulates retrieval-augmented generation and injects synthetic instrumented chunks.
- `AgentAdapter`: Simulates tool-calling AI agents with mock execution policies and invocation attempt logging.

### 5. Deterministic Assertions & Severity Classification
All security assertions (canary exposure, unauthorized tool calls, policy violations, instruction overrides, sensitive pattern matches) are deterministic without requiring external LLM judges. Severity levels (`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) are computed based on scenario configuration and observation impact.

## Consequences
- **Positive**: Zero external infrastructure overhead; completely reproducible deterministic testing; strict security boundaries with verified canary attribution.
- **Trade-offs**: Background tasks run within the application process lifecycle; for massive horizontal clustering in Phase 3, an external broker can be integrated without modifying the engine interfaces.
