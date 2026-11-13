"""RAG (Retrieval-Augmented Generation) adapter for testing synthetic document injection."""

import asyncio
import time
from typing import Any

from app.engine.adapters.base import AdapterRequest, AdapterResponse, BaseAdapter
from app.engine.adapters.mock_adapter import MockAdapter


class RagAdapter(BaseAdapter):
    """Adapter for testing RAG pipelines and indirect prompt injection through retrieved context."""

    def __init__(self):
        self.mock_delegate = MockAdapter()

    def validate_configuration(self, config: dict[str, Any]) -> tuple[bool, str | None]:
        return True, None

    def get_capabilities(self) -> list[str]:
        return [
            "RAG_RETRIEVAL",
            "SYNTHETIC_DOC_INJECTION",
            "CHUNK_METADATA",
            "RETRIEVAL_TRACES",
            "INDIRECT_PROMPT_INJECTION",
        ]

    async def execute(self, request: AdapterRequest) -> AdapterResponse:
        start_time = time.perf_counter()
        docs = request.synthetic_documents or []
        traces = []

        # Simulate retrieval step
        for doc in docs:
            doc_id = doc.get("source_id") or doc.get("id", "doc_1")
            traces.append({
                "source_id": doc_id,
                "trace_type": "RAG_RETRIEVAL",
                "retrieval_score": 0.96,
                "document_title": doc.get("metadata", {}).get("title", "Untitled Knowledge Chunk"),
                "token_count": len(str(doc.get("content", "")).split()),
            })

        # Delegate execution to mock model incorporating synthetic context
        response = await self.mock_delegate.execute(request)
        # Merge retrieval traces
        all_traces = traces + [t for t in response.traces if t not in traces]
        response.traces = all_traces
        response.latency_ms = int((time.perf_counter() - start_time) * 1000)
        return response

    async def health_check(self, target_config: dict[str, Any]) -> tuple[bool, int, int, str]:
        return True, 200, 5, "RAG pipeline simulation ready"
