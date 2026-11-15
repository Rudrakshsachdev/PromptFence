"""Unit tests for Security Regression Testing and Finding Fingerprints."""

import pytest
from app.services.regression_service import compute_finding_fingerprint


def test_compute_finding_fingerprint_deterministic():
    fp1 = compute_finding_fingerprint("PROMPT_INJECTION", "case_101", "CANARY_EXPOSURE")
    fp2 = compute_finding_fingerprint("prompt_injection", "case_101", "canary_exposure")
    assert fp1 == fp2
    assert len(fp1) == 64


def test_fingerprints_differ_for_different_categories():
    fp_inj = compute_finding_fingerprint("PROMPT_INJECTION", "case_1", "ASSERT_1")
    fp_leak = compute_finding_fingerprint("DATA_DISCLOSURE", "case_1", "ASSERT_1")
    assert fp_inj != fp_leak


def test_fingerprints_differ_for_different_scenarios():
    fp_a = compute_finding_fingerprint("PROMPT_INJECTION", "case_A", "ASSERT_1")
    fp_b = compute_finding_fingerprint("PROMPT_INJECTION", "case_B", "ASSERT_1")
    assert fp_a != fp_b
