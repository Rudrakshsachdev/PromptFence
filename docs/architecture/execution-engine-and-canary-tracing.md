# Execution Engine & Dynamic Canary Tracing Architecture

## 1. Overview & Research Objective

**PromptFence Phase 2** delivers the core security testing engine and the scientific implementation of **Dynamic Session-Bound Canary Tainting & Provenance Tracing**.

The platform evaluates LLM applications, RAG pipelines, and AI agents for:
- Indirect prompt injection
- Sensitive data disclosure & canary token exfiltration
- Unauthorized / unconstrained tool execution
- Instruction boundary failures
- SSRF and protocol manipulation

```
  ┌─────────────────────────┐
  │  Execution Orchestrator │ (Manages test runs, concurrency, cancellation)
  └───────────┬─────────────┘
              │ Spawns
  ┌───────────▼─────────────┐      Instruments      ┌───────────────────────────┐
  │    Scenario Executor    ├──────────────────────►│       Canary Manager      │
  └───────────┬─────────────┘                       │ (HMAC-SHA256, TTL, Regex) │
              │ Dispatches                           └─────────────┬─────────────┘
  ┌───────────▼─────────────┐                                     │
  │   Target Adapter Layer  │                                     │ Emits Session Token
  │ (Mock / HTTP / RAG /    │◄────────────────────────────────────┘
  │  Agent Adapters)        │ (Taint Injection into RAG context/tool parameters)
  └───────────┬─────────────┘
              │ Captures Traces & Raw Output
  ┌───────────▼─────────────┐
  │    Assertion Engine     │ (Deterministic: regex, exact, jsonpath, policy)
  └───────────┬─────────────┘
              │ Signals Violations
  ┌───────────▼─────────────┐
  │   Provenance Tracker    ├──────────────────────► Finding Classifier
  │ (Attribution Hierarchy) │                        (Generates Findings & Evidences)
  └─────────────────────────┘
```

---

## 2. Dynamic Session-Bound Canary Lifecycle

### 2.1 Cryptographic Token Design
- **Format**: `pf_canary_<32-hex-characters>` (total length: 42 characters).
- **Entropy**: Cryptographically secure pseudo-random bytes (`secrets.token_hex(16)`).
- **Signature & Verification**: HMAC-SHA256 digest keyed with `CANARY_HMAC_KEY` and versioned with `CANARY_KEY_VERSION` (enabling zero-downtime key rotation).
- **Time-to-Live (TTL)**: Default 60 minutes with per-run expiration enforcement.
- **Run Isolation**: Every canary is bound to a single `test_run_id` and unique `source_id` within the execution scope.

### 2.2 Extraction & Matching
The canary manager extracts tokens from arbitrary text, JSON, and tool arguments using precompiled regular expressions:
```python
CANARY_REGEX = re.compile(r"pf_canary_[a-f0-9]{32}", re.IGNORECASE)
```
Extracted tokens are verified against their stored HMAC signatures to reject fabricated or corrupt tokens before attribution.

---

## 3. Evidence-Based Provenance Model

PromptFence classifies taint propagation under an evidence hierarchy that distinguishes confirmed cryptographic observations from inferred correlations:

| Level | Definition | Technical Criteria |
| :--- | :--- | :--- |
| **`CONFIRMED_SOURCE_MATCH`** | Definitive Leakage | Exact token observed in target output matching an instrumented synthetic document or parameter registered for that run. |
| **`OBSERVED_CANARY`** | Valid Token Leak | Token verified by HMAC digest observed, but source mapping detached or ambiguous across multiple documents. |
| **`TRACE_CORRELATED`** | Intermediate Propagation | Token detected in intermediate tool arguments or retrieval traces before reaching final output. |
| **`INFERRED`** | Semantic Attribution | High similarity / pattern match with sensitive source without preserving verbatim token characters. |
| **`UNATTRIBUTED`** | Uncorrelated Failure | Assertion failed or error occurred without detectable canary or source linkage. |

### Scientific Limitation Disclaimer
> **Research Note**: Canary detection serves as a high-fidelity measurable indicator of synthetic token leakage. It does not imply exhaustiveness for all un-instrumented data exfiltration channels or abstract paraphrasing attacks that do not preserve exact tokens.

---

## 4. Target Adapters & Security Controls

All target interactions route through the `BaseAdapter` interface:
- **`MockAdapter`**: Deterministic simulator supporting both `secure` mode (rebuffs injection, respects instruction boundaries) and `vulnerable` mode (leaks canaries, triggers unauthorized tools) for repeatable testing.
- **`HttpAdapter`**: Production client for evaluating remote AI endpoints:
  - **SSRF Hardening**: Pre-execution IP validation checks all destination addresses against RFC 1918 private subnets, loopback (`127.0.0.0/8`, `::1`), link-local / cloud metadata endpoints (`169.254.169.254`), and CGNAT ranges before any HTTP connection is attempted.
  - **Timeout & Size Limits**: Strict configurable HTTP timeouts (`settings.EXECUTION_DEFAULT_TIMEOUT_SECONDS`) and response size capping (`settings.EXECUTION_MAX_RESPONSE_BYTES`).
- **`RagAdapter`**: Instruments knowledge base documents with canaries and inspects retrieved context traces.
- **`AgentAdapter`**: Evaluates tool-calling agents against privileged actions (`execute_action`, `update_record`) to detect unauthorized tool execution.

---

## 5. Execution State & Concurrency Management

- Orchestration runs asynchronously via FastAPI background tasks utilizing independent database sessions.
- Execution states: `QUEUED` ➔ `RUNNING` ➔ `COMPLETED` / `FAILED` / `CANCELLED`.
- Concurrency bounded per run (`concurrency` parameter, default 1-5) using `asyncio.Semaphore`.
- Live progress metrics (`total_cases`, `completed_cases`, `passed_cases`, `failed_cases`, `errored_cases`, `duration_ms`) updated in real time with polling support on the frontend.
