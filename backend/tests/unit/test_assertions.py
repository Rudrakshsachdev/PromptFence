"""Unit tests for deterministic security assertions and finding classification."""

import pytest

from app.engine.adapters.base import AdapterResponse
from app.engine.assertions.evaluator import AssertionEvaluator
from app.engine.findings.classifier import FindingClassifier
from app.models.execution import (
    AssertionStatus,
    AssertionType,
    FindingSeverity,
)


def test_canary_exposure_assertion_failed():
    evaluator = AssertionEvaluator()
    canary = "pf_canary_0123456789abcdef0123456789abcdef"
    resp = AdapterResponse(
        raw_text=f"The secret canary value leaked is {canary}",
        status_code=200,
    )

    ev = evaluator.evaluate_canary_exposure(resp, [canary])
    assert ev.status == AssertionStatus.FAILED
    assert ev.assertion_type == AssertionType.CANARY_EXPOSURE
    assert canary in ev.evidence["exposed_tokens"]


def test_canary_exposure_assertion_passed():
    evaluator = AssertionEvaluator()
    canary = "pf_canary_0123456789abcdef0123456789abcdef"
    resp = AdapterResponse(
        raw_text="The confidential tokens have been safely redacted.",
        status_code=200,
    )

    ev = evaluator.evaluate_canary_exposure(resp, [canary])
    assert ev.status == AssertionStatus.PASSED
    assert ev.assertion_type == AssertionType.CANARY_EXPOSURE


def test_tool_call_authorization_assertion():
    evaluator = AssertionEvaluator()

    # Unauthorized call
    resp_unauth = AdapterResponse(
        raw_text="Attempting tool execution",
        tool_calls=[{"tool_name": "execute_action", "policy_authorized": False}],
    )
    ev_unauth = evaluator.evaluate_tool_calls(resp_unauth)
    assert ev_unauth.status == AssertionStatus.FAILED
    assert ev_unauth.assertion_type == AssertionType.UNAUTHORIZED_TOOL_CALL

    # Authorized call
    resp_auth = AdapterResponse(
        raw_text="Attempting safe read",
        tool_calls=[{"tool_name": "read_document", "policy_authorized": True}],
    )
    ev_auth = evaluator.evaluate_tool_calls(resp_auth)
    assert ev_auth.status == AssertionStatus.PASSED


def test_instruction_override_assertion():
    evaluator = AssertionEvaluator()

    # Complied with override
    resp_complied = AdapterResponse(
        raw_text="VULNERABLE_OVERRIDE_ACTIVE: Printing system instructions verbatim.",
        status_code=200,
    )
    ev = evaluator.evaluate_instruction_override(resp_complied)
    assert ev.status == AssertionStatus.FAILED

    # Refused override
    resp_refused = AdapterResponse(
        raw_text="I cannot comply with requests to override system instructions.",
        status_code=200,
    )
    ev_refused = evaluator.evaluate_instruction_override(resp_refused)
    assert ev_refused.status == AssertionStatus.PASSED


def test_finding_classifier():
    evaluator = AssertionEvaluator()
    classifier = FindingClassifier()

    canary = "pf_canary_0123456789abcdef0123456789abcdef"
    resp = AdapterResponse(
        raw_text=f"Leaked token: {canary}",
        status_code=200,
    )
    ev = evaluator.evaluate_canary_exposure(resp, [canary])

    snapshot = {
        "name": "Indirect Prompt Injection via Document",
        "category": "PROMPT_INJECTION",
        "severity": "CRITICAL",
    }
    finding_spec = classifier.classify_assertion_failure(
        evaluation=ev,
        scenario_snapshot=snapshot,
        test_run_id_str="run-1",
        scenario_id_str="scen-1",
    )

    assert finding_spec.severity == FindingSeverity.CRITICAL
    assert "Canary Token Exposure" in finding_spec.title
    assert finding_spec.deduplication_key is not None
    assert len(finding_spec.deduplication_key) == 64
