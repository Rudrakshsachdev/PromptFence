"""Unit tests for Evidence-Based Reporting (ReportLab PDF, JSON, CSV, Secret Redaction)."""

import json
from pathlib import Path
import pytest
from app.services.reporting_service import generate_pdf_report, redact_secrets


def test_redact_secrets_recursive():
    raw_payload = {
        "user": "analyst",
        "api_key": "sk-secret-12345",
        "authorization": "Bearer eyJhbGciOi...",
        "token_data": {"access_token": "secret_tok_99"},
        "nested": [
            {"safe": "public_data", "password": "super_secret_pwd"}
        ]
    }
    redacted = redact_secrets(raw_payload)

    assert redacted["user"] == "analyst"
    assert redacted["api_key"] == "[REDACTED]"
    assert redacted["authorization"] == "[REDACTED]"
    assert redacted["token_data"]["access_token"] == "[REDACTED]"
    assert redacted["nested"][0]["safe"] == "public_data"
    assert redacted["nested"][0]["password"] == "[REDACTED]"


def test_pdf_report_generation(tmp_path: Path):
    pdf_path = tmp_path / "test_report.pdf"
    generate_pdf_report(
        output_path=pdf_path,
        title="PromptFence Security Audit - Test Target",
        run=None,
        findings=[],
        cases=[],
    )

    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 1000  # ReportLab produced valid binary PDF
    # Verify PDF Magic Header (%PDF)
    with open(pdf_path, "rb") as f:
        header = f.read(4)
        assert header == b"%PDF"
