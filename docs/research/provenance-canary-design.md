# Research Contribution: Dynamic Session-Bound Canary Tainting & Provenance Tracing

## Executive Summary

PromptFence introduces **Dynamic Session-Bound Canary Tainting & Provenance Tracing** as a core research contribution for AI Application Security Testing. 

While conventional static testing analyzes model outputs for general pattern matching or heuristic toxicity scores, PromptFence provides **mathematically verifiable evidence** of indirect prompt injection and unauthorized data leakage by tracking cryptographically tainted canary tokens from input corpora into output streams.

---

## The Problem: Attribution Ambiguity in LLM Security

When testing LLM applications integrated with retrieval pipelines (RAG), external document loaders, or tool outputs, standard evaluators face two critical challenges:

1. **False Positives / Hallucination Attribution**: An LLM might mention a sensitive word purely out of parametric memory or prior pre-training, leading an analyst to believe a leak occurred when no actual context was exfiltrated.
2. **Provenance Obfuscation**: In indirect prompt injection, an adversarial payload hidden in an untrusted document instructs the model to leak data from another document. Without session-bound taint tracking, security analysts cannot determine which document or tool was the root vector.

---

## The Architecture: Canary Tainting Lifecycle

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Foundation (Current)                          │
│ - Target & TargetVersion models                        │
│ - TestSuite & TestCase models                          │
│ - Schema extension fields (parameters, metadata)       │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 2: Runtime Tainting Engine (Roadmap)             │
│                                                        │
│ 1. Dynamic Canary Generation                           │
│    - Cryptographically random high-entropy token        │
│    - HMAC-SHA256 signature bound to TestRun ID        │
│    - Pattern: PF_CANARY_<RUN_ID>_<HASH_CHUNK>          │
│                                                        │
│ 2. Context Injection & Taint Binding                   │
│    - Injected into synthetic document chunks, tools,   │
│      or system prompts                                 │
│    - Recorded in `run_canaries` provenance registry     │
│                                                        │
│ 3. Execution & Response Inspection                     │
│    - Output stream scanned for valid canary tokens      │
│    - Leakage confidence score calculated               │
│                                                        │
│ 4. Provenance Attribution                              │
│    - Canary token maps uniquely back to the source     │
│      instrumentation chunk                             │
└────────────────────────────────────────────────────────┘
```

---

## Phase 1 Extension Points

Phase 1 provides the foundational database schema and architectural seams to support this mechanism without prematurely introducing Phase 2 runtime overhead:

1. **`test_cases.parameters` JSONB field**:
   - Structured to store canary placement specifications (e.g., `taint_placement: "document_chunk_0"`, `canary_type: "session_bound"`).
2. **`test_cases.metadata` JSONB field**:
   - Configured to store expected extraction boundaries and provenance mapping keys.
3. **`test_cases.category` Enum**:
   - Includes `sensitive_data_disclosure`, `indirect_prompt_injection`, and `unauthorized_tool_execution`.
4. **Target Versioning**:
   - Guarantees that canary evaluation tests correlate directly to immutable target versions.

---

## Phase 2 Implementation Seams

During Phase 2, the following modules will plug directly into these extension points:
- `backend/app/engine/canary/generator.py`: Generates session-bound tokens.
- `backend/app/engine/canary/tracer.py`: Evaluates target model responses against the active canary registry.
- `backend/app/engine/execution/runner.py`: Dispatches scenarios with injected canaries and records evidence.

