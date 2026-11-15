"""Unit tests for Phase 3 Security Analytics and deterministic scoring."""

import pytest
from app.models.execution import FindingSeverity
from app.services.analytics_service import (
    CATEGORY_WEIGHTS,
    SEVERITY_PENALTIES,
    _calculate_letter_grade,
)


def test_letter_grade_calculation():
    assert _calculate_letter_grade(98.5) == "A+"
    assert _calculate_letter_grade(92.0) == "A"
    assert _calculate_letter_grade(85.0) == "B"
    assert _calculate_letter_grade(74.0) == "C"
    assert _calculate_letter_grade(65.0) == "D"
    assert _calculate_letter_grade(45.0) == "F"
    assert _calculate_letter_grade(0.0) == "F"


def test_category_weights_sum_to_one():
    total_weight = sum(CATEGORY_WEIGHTS.values())
    assert abs(total_weight - 1.0) < 1e-6


def test_severity_penalties_monotonic():
    assert SEVERITY_PENALTIES[FindingSeverity.CRITICAL] > SEVERITY_PENALTIES[FindingSeverity.HIGH]
    assert SEVERITY_PENALTIES[FindingSeverity.HIGH] > SEVERITY_PENALTIES[FindingSeverity.MEDIUM]
    assert SEVERITY_PENALTIES[FindingSeverity.MEDIUM] > SEVERITY_PENALTIES[FindingSeverity.LOW]
    assert SEVERITY_PENALTIES[FindingSeverity.LOW] > SEVERITY_PENALTIES[FindingSeverity.INFO]
    assert SEVERITY_PENALTIES[FindingSeverity.INFO] == 0.0
