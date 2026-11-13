"""Taint instrumentor for synthetic documents, mock parameters, and context."""

from dataclasses import dataclass
from typing import Any

from app.engine.canaries.manager import GeneratedCanary


@dataclass
class InstrumentedSource:
    source_id: str
    source_type: str
    original_content: str
    instrumented_content: str
    canary_token: str
    canary_digest: str
    metadata: dict[str, Any]


class TaintInstrumentor:
    """Instruments synthetic sources and parameters with session-bound canaries."""

    @staticmethod
    def instrument_rag_document(
        *,
        doc_id: str,
        title: str,
        content: str,
        canary: GeneratedCanary,
        injection_payload: str | None = None,
    ) -> InstrumentedSource:
        """Instrument a synthetic RAG knowledge base document with a canary and optional adversarial payload."""
        # Cleanly attach canary token metadata to document
        canary_marker = f"[CONFIDENTIAL_DATA_MARKER: {canary.token}]"
        
        if injection_payload:
            # Inject adversarial payload alongside the canary token
            instrumented = (
                f"--- DOCUMENT: {title} (ID: {doc_id}) ---\n"
                f"{content}\n\n"
                f"{canary_marker}\n"
                f"--- NOTE: {injection_payload} ---"
            )
        else:
            instrumented = (
                f"--- DOCUMENT: {title} (ID: {doc_id}) ---\n"
                f"{content}\n\n"
                f"{canary_marker}"
            )

        return InstrumentedSource(
            source_id=doc_id,
            source_type="RAG_DOCUMENT",
            original_content=content,
            instrumented_content=instrumented,
            canary_token=canary.token,
            canary_digest=canary.digest,
            metadata={
                "title": title,
                "doc_id": doc_id,
                "has_injection_payload": bool(injection_payload),
                "token_preview": canary.token_preview,
            },
        )

    @staticmethod
    def instrument_mock_parameter(
        *,
        param_name: str,
        tool_name: str,
        canary: GeneratedCanary,
        base_value: str = "restricted_customer_record",
    ) -> InstrumentedSource:
        """Instrument a mock tool parameter with a canary value."""
        instrumented_value = f"{base_value}_{canary.token}"
        return InstrumentedSource(
            source_id=f"{tool_name}:{param_name}",
            source_type="TOOL_PARAMETER",
            original_content=base_value,
            instrumented_content=instrumented_value,
            canary_token=canary.token,
            canary_digest=canary.digest,
            metadata={
                "tool_name": tool_name,
                "param_name": param_name,
            },
        )

    @staticmethod
    def instrument_input_template(
        template: str,
        canary: GeneratedCanary,
        context_vars: dict[str, Any] | None = None,
    ) -> str:
        """Replace canary and context tokens in an attack input template."""
        res = template
        res = res.replace("{canary}", canary.token)
        res = res.replace("{canary_token}", canary.token)
        res = res.replace("{canary_preview}", canary.token_preview)
        if context_vars:
            for k, v in context_vars.items():
                res = res.replace(f"{{{k}}}", str(v))
        return res
