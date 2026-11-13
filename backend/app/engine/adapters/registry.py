"""Adapter registry and factory for resolving target adapters."""

from typing import Any

from app.engine.adapters.agent_adapter import AgentAdapter
from app.engine.adapters.base import BaseAdapter
from app.engine.adapters.http_adapter import HttpAdapter
from app.engine.adapters.mock_adapter import MockAdapter
from app.engine.adapters.rag_adapter import RagAdapter


class AdapterRegistry:
    """Registry of available target adapters."""

    @staticmethod
    def get_adapter(target_type: str, base_url: str = "") -> BaseAdapter:
        """Resolve an adapter instance based on target type and base URL."""
        norm_type = (target_type or "").upper()
        norm_url = (base_url or "").lower()

        # If base_url explicitly indicates mock testing
        if "mock" in norm_url or norm_url.startswith("mock://") or norm_type == "MOCK":
            return MockAdapter()

        if norm_type == "AGENT_API":
            return AgentAdapter()

        if norm_type in ("RAG_API", "KNOWLEDGE_BASE"):
            return RagAdapter()

        # Default to HttpAdapter if an actual http(s) URL is provided
        if norm_url.startswith("http://") or norm_url.startswith("https://"):
            return HttpAdapter()

        # Fallback to MockAdapter for safe in-memory testing
        return MockAdapter()

    @staticmethod
    def list_supported_adapters() -> list[dict[str, Any]]:
        """Return information on all supported adapters and capabilities."""
        return [
            {
                "name": "Mock AI Adapter",
                "target_type": "MOCK / IN_MEMORY",
                "description": "High-fidelity deterministic simulator supporting secure and vulnerable AI behaviors.",
                "supported_capabilities": MockAdapter().get_capabilities(),
            },
            {
                "name": "HTTP REST Adapter",
                "target_type": "CHAT_API / COMPLETION_API / CUSTOM",
                "description": "Enterprise HTTP client with SSRF protection, custom headers, and request templating.",
                "supported_capabilities": HttpAdapter().get_capabilities(),
            },
            {
                "name": "RAG Testing Adapter",
                "target_type": "RAG_API",
                "description": "Retrieval-Augmented Generation pipeline simulator for synthetic document injection.",
                "supported_capabilities": RagAdapter().get_capabilities(),
            },
            {
                "name": "AI Agent Adapter",
                "target_type": "AGENT_API",
                "description": "Autonomous agent sandbox with mock tools and policy enforcement evaluation.",
                "supported_capabilities": AgentAdapter().get_capabilities(),
            },
        ]
