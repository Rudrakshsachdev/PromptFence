"""Finding classifier for synthesizing security vulnerabilities from assertion failures and canary exposures."""

import hashlib
from dataclasses import dataclass
from typing import Any

from app.engine.assertions.evaluator import AssertionEvaluation
from app.engine.provenance.tracker import ProvenanceRecord
from app.models.execution import (
    AssertionStatus,
    AssertionType,
    AttributionLevel,
    FindingSeverity,
)


@dataclass
class FindingSpec:
    category: str
    title: str
    description: str
    severity: FindingSeverity
    confidence: str
    observation_location: str
    detection_method: str
    attribution_level: AttributionLevel
    evidence_reference: dict[str, Any]
    deduplication_key: str


class FindingClassifier:
    """Classifies execution anomalies and failed assertions into actionable security findings."""

    def classify_assertion_failure(
        self,
        *,
        evaluation: AssertionEvaluation,
        scenario_snapshot: dict[str, Any],
        provenance: ProvenanceRecord | None = None,
        test_run_id_str: str = "",
        scenario_id_str: str = "",
    ) -> FindingSpec:
        """Transform a failed assertion into a structured security finding."""
        scenario_name = scenario_snapshot.get("name", "Adversarial Test Scenario")
        scenario_cat = scenario_snapshot.get("category", "PROMPT_INJECTION")
        configured_severity = scenario_snapshot.get("severity", "HIGH")

        # Map scenario severity to FindingSeverity
        severity_map = {
            "CRITICAL": FindingSeverity.CRITICAL,
            "HIGH": FindingSeverity.HIGH,
            "MEDIUM": FindingSeverity.MEDIUM,
            "LOW": FindingSeverity.LOW,
            "INFO": FindingSeverity.INFO,
        }
        severity = severity_map.get(configured_severity, FindingSeverity.HIGH)

        # 1. Canary Exposure Finding
        if evaluation.assertion_type == AssertionType.CANARY_EXPOSURE:
            category = "DATA_DISCLOSURE" if scenario_cat == "DATA_DISCLOSURE" else "PROMPT_INJECTION"
            title = f"Canary Token Exposure via {scenario_name}"
            attribution = provenance.attribution_level if provenance else AttributionLevel.OBSERVED_CANARY
            confidence = "CONFIRMED" if attribution == AttributionLevel.CONFIRMED_SOURCE_MATCH else "HIGH"

            description = (
                f"During evaluation of scenario '{scenario_name}', a dynamic session-bound canary token was "
                f"observed in target response output. This provides measurable empirical evidence of data propagation "
                f"from synthetic test inputs to observable endpoints."
            )
            location = "RESPONSE_OUTPUT"
            method = "HMAC_VERIFIED_EXACT_MATCH"

        # 2. Unauthorized Tool Invocation Finding
        elif evaluation.assertion_type == AssertionType.UNAUTHORIZED_TOOL_CALL:
            category = "TOOL_EXECUTION"
            title = f"Unauthorized Tool Invocation: {scenario_name}"
            severity = FindingSeverity.CRITICAL if severity == FindingSeverity.CRITICAL else FindingSeverity.HIGH
            attribution = AttributionLevel.CONFIRMED_SOURCE_MATCH
            confidence = "CONFIRMED"
            location = "TOOL_INVOCATION_ATTEMPT"
            method = "POLICY_VIOLATION_CHECK"
            description = (
                f"The target AI application attempted to execute privileged tools or actions without "
                f"required authorization in violation of security policy."
            )

        # 3. Instruction Override Finding
        elif evaluation.assertion_type == AssertionType.INSTRUCTION_OVERRIDE:
            category = "INSTRUCTION_CONFLICT"
            title = f"Instruction Boundary Override: {scenario_name}"
            attribution = AttributionLevel.INFERRED
            confidence = "HIGH"
            location = "RESPONSE_OUTPUT"
            method = "INSTRUCTION_HIERARCHY_ANALYSIS"
            description = (
                f"The target application complied with adversarial system prompt override commands, "
                f"failing to maintain instruction boundary separation."
            )

        # 4. Sensitive Pattern Match Finding
        elif evaluation.assertion_type == AssertionType.SENSITIVE_PATTERN_MATCH:
            category = "DATA_DISCLOSURE"
            title = f"Sensitive Pattern Match in Output: {scenario_name}"
            attribution = AttributionLevel.OBSERVED_CANARY
            confidence = "HIGH"
            location = "RESPONSE_OUTPUT"
            method = "PATTERN_MATCH"
            description = (
                f"Forbidden sensitive data markers were matched in the target application's output."
            )

        # 5. Default Finding
        else:
            category = scenario_cat
            title = f"Security Assertion Failed: {scenario_name}"
            attribution = AttributionLevel.UNATTRIBUTED
            confidence = "MEDIUM"
            location = "RESPONSE_VALIDATION"
            method = "DETERMINISTIC_ASSERTION"
            description = evaluation.message

        evidence = {
            "assertion_id": evaluation.assertion_id,
            "assertion_type": evaluation.assertion_type.value,
            "expected_value": evaluation.expected_value,
            "actual_value": evaluation.actual_value,
            "assertion_evidence": evaluation.evidence,
        }
        if provenance:
            evidence["provenance"] = {
                "attribution_level": provenance.attribution_level.value,
                "token_preview": provenance.token_preview,
                "source_id": provenance.source_id,
                "source_type": provenance.source_type,
                "explanation": provenance.explanation,
                "limitations": provenance.research_limitations,
            }

        # Deduplication key based on run, scenario, assertion, and category
        dedup_raw = f"{test_run_id_str}:{scenario_id_str}:{evaluation.assertion_id}:{category}"
        deduplication_key = hashlib.sha256(dedup_raw.encode("utf-8")).hexdigest()

        return FindingSpec(
            category=category,
            title=title,
            description=description,
            severity=severity,
            confidence=confidence,
            observation_location=location,
            detection_method=method,
            attribution_level=attribution,
            evidence_reference=evidence,
            deduplication_key=deduplication_key,
        )
