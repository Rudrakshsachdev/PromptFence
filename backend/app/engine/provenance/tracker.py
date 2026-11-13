"""Evidence-based provenance tracing and source attribution for canary tokens."""

from dataclasses import dataclass
from typing import Any

from app.models.execution import AttributionLevel


@dataclass
class ProvenanceRecord:
    canary_digest: str
    token_preview: str
    source_id: str | None
    source_type: str | None
    observation_location: str
    detection_method: str
    attribution_level: AttributionLevel
    evidence: dict[str, Any]
    explanation: str
    research_limitations: list[str]


class ProvenanceTracker:
    """Evaluates evidence-based attribution levels from observed canaries and target traces."""

    RESEARCH_LIMITATIONS = [
        "Exact-token matching detects the canary itself; semantic paraphrase or summarization may not trigger exact detection.",
        "Absence of observed canary does not mathematically prove absence of other forms of data leakage.",
        "Causal attribution requires validated trace linkage; when target does not provide intermediate traces, attribution is classified as OBSERVED_CANARY rather than CONFIRMED_SOURCE_MATCH.",
    ]

    def evaluate_attribution(
        self,
        *,
        canary_digest: str,
        token_preview: str,
        source_id: str | None,
        source_type: str | None,
        observation_location: str,
        detection_method: str,
        is_token_verified: bool,
        target_traces: list[dict[str, Any]] | None = None,
    ) -> ProvenanceRecord:
        """Compute the attribution level and structured evidence for an observed canary."""
        traces = target_traces or []
        evidence: dict[str, Any] = {
            "token_preview": token_preview,
            "observation_location": observation_location,
            "detection_method": detection_method,
            "is_token_verified": is_token_verified,
            "trace_count": len(traces),
        }

        if not is_token_verified:
            return ProvenanceRecord(
                canary_digest=canary_digest,
                token_preview=token_preview,
                source_id=source_id,
                source_type=source_type,
                observation_location=observation_location,
                detection_method=detection_method,
                attribution_level=AttributionLevel.UNATTRIBUTED,
                evidence=evidence,
                explanation="Canary token could not be cryptographically verified against the active test run context.",
                research_limitations=self.RESEARCH_LIMITATIONS,
            )

        # Look for matching trace evidence linking to source_id
        matched_trace = None
        for trace in traces:
            trace_source = trace.get("source_id")
            if source_id and trace_source == source_id:
                matched_trace = trace
                break

        if matched_trace:
            evidence["matched_trace"] = matched_trace
            attribution = AttributionLevel.CONFIRMED_SOURCE_MATCH
            explanation = (
                f"Canary {token_preview} was verified via HMAC-SHA256 and matched to synthetic source "
                f"'{source_id}' with corroborating target execution trace linkage."
            )
        else:
            attribution = AttributionLevel.OBSERVED_CANARY
            explanation = (
                f"Canary {token_preview} was verified in {observation_location} via HMAC-SHA256 and mapped to "
                f"source '{source_id}', but intermediate execution trace linkage was not provided by the target adapter."
            )

        return ProvenanceRecord(
            canary_digest=canary_digest,
            token_preview=token_preview,
            source_id=source_id,
            source_type=source_type,
            observation_location=observation_location,
            detection_method=detection_method,
            attribution_level=attribution,
            evidence=evidence,
            explanation=explanation,
            research_limitations=self.RESEARCH_LIMITATIONS,
        )
