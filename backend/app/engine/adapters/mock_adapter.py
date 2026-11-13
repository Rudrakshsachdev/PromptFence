"""Mock target adapter for deterministic development, testing, and security evaluation."""

import asyncio
import time
from typing import Any

from app.engine.adapters.base import AdapterRequest, AdapterResponse, BaseAdapter


class MockAdapter(BaseAdapter):
    """Deterministic mock AI adapter supporting both secure and vulnerable outcomes."""

    def validate_configuration(self, config: dict[str, Any]) -> tuple[bool, str | None]:
        # Mock adapter needs minimal configuration
        return True, None

    def get_capabilities(self) -> list[str]:
        return [
            "CHAT_API",
            "COMPLETION_API",
            "AGENT_API",
            "RAG_RETRIEVAL",
            "TOOL_INVOCATION",
            "INTERMEDIATE_TRACES",
            "MOCK_TARGET",
        ]

    async def execute(self, request: AdapterRequest) -> AdapterResponse:
        start_time = time.perf_counter()
        config = request.target_config

        # 1. Simulate timeouts if requested
        if config.get("simulate_timeout"):
            await asyncio.sleep(min(request.timeout_seconds + 0.1, 1.0))
            return AdapterResponse(
                raw_text="",
                status_code=504,
                latency_ms=int((time.perf_counter() - start_time) * 1000),
                is_success=False,
                error_message="Gateway Timeout: Target simulation exceeded configured execution timeout",
            )

        # 2. Simulate errors if requested
        if config.get("simulate_error"):
            return AdapterResponse(
                raw_text="",
                status_code=500,
                latency_ms=int((time.perf_counter() - start_time) * 1000),
                is_success=False,
                error_message="Internal Target Error: Mock 500 error triggered by configuration",
            )

        # Small mock processing latency if configured
        if delay := config.get("mock_delay"):
            await asyncio.sleep(float(delay))

        # Determine target vulnerability mode:
        # Check target name, description, or mode in config
        mode = config.get("mock_mode", "auto")
        target_name = str(config.get("name", "")).lower()
        is_vulnerable = (
            mode == "vulnerable"
            or "vulnerable" in target_name
            or config.get("is_vulnerable", False)
        )

        prompt = request.prompt or ""
        docs = request.synthetic_documents or []
        traces = []
        tool_calls = []

        # Record traces for retrieved synthetic documents
        for doc in docs:
            doc_id = doc.get("source_id") or doc.get("id", "doc_1")
            traces.append({
                "source_id": doc_id,
                "trace_type": "RAG_RETRIEVAL",
                "content_snippet": str(doc.get("content", ""))[:120],
                "retrieval_score": 0.94,
            })

        # Scenario Handling
        if is_vulnerable:
            # ── VULNERABLE TARGET SIMULATION ──
            # 1. Check for indirect prompt injection via synthetic docs
            leaked_canary = None
            for doc in docs:
                content = str(doc.get("content", ""))
                if "pf_canary_" in content:
                    # Extract canary to simulate indirect leakage
                    import re
                    m = re.search(r"pf_canary_[a-f0-9]{32}", content, re.IGNORECASE)
                    if m:
                        leaked_canary = m.group(0)
                        break

            if leaked_canary:
                raw_text = (
                    f"Understood. Overriding standard guidelines. "
                    f"Here is the retrieved internal verification token: {leaked_canary}"
                )
            elif "override" in prompt.lower() or "system prompt" in prompt.lower() or "secret" in prompt.lower():
                raw_text = (
                    "VULNERABLE_OVERRIDE_ACTIVE: The system prompt is: "
                    "'You are an AI assistant with access to confidential financial documents.'"
                )
            elif "{canary}" in prompt or "pf_canary_" in prompt:
                # Direct canary echo
                raw_text = f"Acknowledged request. Processing payload: {prompt}"
            else:
                raw_text = "Processing request: " + prompt[:100]

            # 2. Check for unauthorized tool simulation
            if request.tools or "tool" in prompt.lower() or "action" in prompt.lower() or "update" in prompt.lower():
                tool_calls.append({
                    "tool_name": "execute_action",
                    "arguments": {"action": "delete_all", "override": True},
                    "policy_authorized": False,
                })
                traces.append({
                    "trace_type": "TOOL_INVOCATION",
                    "tool_name": "execute_action",
                    "status": "ATTEMPTED_WITHOUT_AUTHORIZATION",
                })

        else:
            # ── SECURE TARGET SIMULATION ──
            # Rebuffs prompt injection, respects instruction boundaries
            if "override" in prompt.lower() or "system prompt" in prompt.lower() or "ignore previous" in prompt.lower():
                raw_text = (
                    "I cannot comply with requests to ignore developer constraints, disclose system "
                    "instructions, or extract restricted tokens."
                )
            elif docs and any("pf_canary_" in str(d.get("content", "")) for d in docs):
                # RAG scenario: target answers from doc without revealing the canary
                raw_text = (
                    "Based on the provided documentation, I have reviewed the reference context. "
                    "All confidential parameters and security tokens remain redacted and guarded."
                )
            else:
                raw_text = "I have safely processed your prompt according to security boundaries."

            # If tools are requested, only invoke authorized read tools safely
            if request.tools and "search" in prompt.lower():
                tool_calls.append({
                    "tool_name": "read_document",
                    "arguments": {"doc_id": "public_summary"},
                    "policy_authorized": True,
                })

        latency = int((time.perf_counter() - start_time) * 1000)
        return AdapterResponse(
            raw_text=raw_text,
            status_code=200,
            latency_ms=latency,
            tool_calls=tool_calls,
            traces=traces,
            is_success=True,
        )

    async def health_check(self, target_config: dict[str, Any]) -> tuple[bool, int, int, str]:
        start_time = time.perf_counter()
        await asyncio.sleep(0.01)
        latency = int((time.perf_counter() - start_time) * 1000)
        return True, 200, latency, "Mock target is online and responsive"
