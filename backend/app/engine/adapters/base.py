"""Base target adapter interface and request/response models."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AdapterRequest:
    prompt: str
    system_prompt: str | None = None
    messages: list[dict[str, str]] | None = None
    synthetic_documents: list[dict[str, Any]] | None = None
    tools: list[dict[str, Any]] | None = None
    parameters: dict[str, Any] = field(default_factory=dict)
    target_config: dict[str, Any] = field(default_factory=dict)
    timeout_seconds: int = 30


@dataclass
class AdapterResponse:
    raw_text: str
    status_code: int = 200
    latency_ms: int = 0
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    traces: list[dict[str, Any]] = field(default_factory=list)
    is_success: bool = True
    error_message: str | None = None


class BaseAdapter(ABC):
    """Abstract base class for AI target adapters."""

    @abstractmethod
    def validate_configuration(self, config: dict[str, Any]) -> tuple[bool, str | None]:
        """Validate whether the provided target configuration has all required fields."""
        pass

    @abstractmethod
    def get_capabilities(self) -> list[str]:
        """Return declared capabilities supported by this adapter."""
        pass

    @abstractmethod
    async def execute(self, request: AdapterRequest) -> AdapterResponse:
        """Execute the security request against the target."""
        pass

    @abstractmethod
    async def health_check(self, target_config: dict[str, Any]) -> tuple[bool, int, int, str]:
        """Check reachability and response latency. Returns (is_reachable, status_code, latency_ms, message)."""
        pass
