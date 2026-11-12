"""Integration tests for Dashboard endpoints."""

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User


@pytest.mark.asyncio
async def test_dashboard_overview_and_distributions(client: AsyncClient, test_user: User):
    token = create_access_token(user_id=test_user.id, extra_claims={"roles": ["security_researcher"]})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Overview before adding items
    ov_res = await client.get("/api/v1/dashboard/overview", headers=headers)
    assert ov_res.status_code == 200
    ov_data = ov_res.json()
    assert ov_data["total_targets"] == 0

    # 2. Create a target and a scenario
    await client.post(
        "/api/v1/targets",
        json={
            "name": "Dashboard Test Target",
            "target_type": "CHAT_API",
            "base_url": "https://example.com",
            "endpoint": "/chat",
        },
        headers=headers,
    )
    await client.post(
        "/api/v1/scenarios",
        json={
            "name": "Dashboard Test Scenario",
            "category": "PROMPT_INJECTION",
            "severity": "CRITICAL",
            "attack_input_template": "Test injection",
        },
        headers=headers,
    )

    # 3. Overview after adding items
    ov_res2 = await client.get("/api/v1/dashboard/overview", headers=headers)
    assert ov_res2.status_code == 200
    ov_data2 = ov_res2.json()
    assert ov_data2["total_targets"] == 1
    assert ov_data2["total_test_cases"] == 1
    assert len(ov_data2["recent_targets"]) == 1

    # 4. Activity
    act_res = await client.get("/api/v1/dashboard/activity", headers=headers)
    assert act_res.status_code == 200
    assert len(act_res.json()["activities"]) >= 2

    # 5. Distributions
    dist_res = await client.get("/api/v1/dashboard/distributions", headers=headers)
    assert dist_res.status_code == 200
    dist_data = dist_res.json()
    assert dist_data["targets_by_type"]["CHAT_API"] == 1
    assert dist_data["test_cases_by_category"]["PROMPT_INJECTION"] == 1

