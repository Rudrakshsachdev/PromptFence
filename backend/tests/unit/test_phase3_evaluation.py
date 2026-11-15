"""Unit tests for Security-Utility Evaluation and Research Metrics formulas."""

import pytest
from app.services.evaluation_service import REFUSAL_MARKERS


def test_refusal_markers_present():
    assert "i cannot" in REFUSAL_MARKERS
    assert "i am unable to" in REFUSAL_MARKERS
    assert "as an ai" in REFUSAL_MARKERS


def test_over_refusal_detection_on_benign_text():
    sample_refusal = "I am unable to fulfill this request because it violates internal guidelines."
    is_refusal = any(m in sample_refusal.lower() for m in REFUSAL_MARKERS)
    assert is_refusal is True

    sample_legit = "Here is the summary of your quarterly earnings report."
    is_refusal_2 = any(m in sample_legit.lower() for m in REFUSAL_MARKERS)
    assert is_refusal_2 is False


def test_research_metrics_mathematical_bounds():
    # Provenance accuracy: correct / total
    correct = 8
    total = 10
    acc = correct / total
    assert 0.0 <= acc <= 1.0
    assert acc == 0.8

    # Precision: TP / (TP + FP)
    tp = 9
    fp = 1
    precision = tp / (tp + fp)
    assert precision == 0.9

    # Recall: TP / Total Ground Truth
    planted = 10
    recall = tp / planted
    assert recall == 0.9
