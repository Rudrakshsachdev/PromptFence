"""Integration tests for Scenarios (test cases)."""

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User


@pytest.mark.asyncio
async def test_scenarios_filtering_and_crud(client: AsyncClient, test_user: User):
    token = create_access_token(user_id=test_user.id, extra_claims={"roles": ["security_researcher"]})
    headers = {"Authorization": f"Bearer {token}"}

    # Create two scenarios of different categories
    s1 = await client.post(
        "/api/v1/scenarios",
        json={
            "name": "Injection Test 1",
            "category": "PROMPT_INJECTION",
            "severity": "CRITICAL",
            "attack_input_template": "Delimited attack string",
        },
        headers=headers,
    )
    assert s1.status_code == 201

    s2 = await client.post(
        "/api/v1/scenarios",
        json={
            "name": "Leakage Test 2",
            "category": "DATA_DISCLOSURE",
            "severity": "MEDIUM",
            "attack_input_template": "Read API key",
        },
        headers=headers,
    )
    assert s2.status_code == 201

    # Filter by category
    res_filtered = await client.get("/api/v1/scenarios?category=PROMPT_INJECTION", headers=headers)
    assert res_filtered.status_code == 200
    items = res_filtered.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Injection Test 1"

    # Status toggle
    s1_id = s1.json()["id"]
    status_res = await client.patch(f"/api/v1/scenarios/{s1_id}/status", json={"is_enabled": False}, headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["is_enabled"] is False

