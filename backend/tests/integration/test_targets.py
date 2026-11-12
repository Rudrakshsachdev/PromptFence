"""Integration tests for Target management and versioning."""

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User


@pytest.mark.asyncio
async def test_target_crud_and_versioning(client: AsyncClient, test_user: User):
    token = create_access_token(user_id=test_user.id, extra_claims={"roles": ["security_researcher"]})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create target
    create_payload = {
        "name": "Production Assistant API",
        "description": "Production LLM conversational endpoint",
        "target_type": "CHAT_API",
        "base_url": "https://httpbin.org",
        "endpoint": "/post",
        "http_method": "POST",
        "authentication_type": "BEARER",
        "headers_config": {"Authorization": "Bearer secret-token"},
        "request_template": {"input": "{{prompt}}"},
        "expected_response_format": "json",
        "timeout_seconds": 15,
    }
    create_res = await client.post("/api/v1/targets", json=create_payload, headers=headers)
    assert create_res.status_code == 201
    target = create_res.json()
    target_id = target["id"]
    assert target["name"] == "Production Assistant API"

    # 2. Check initial version created
    versions_res = await client.get(f"/api/v1/targets/{target_id}/versions", headers=headers)
    assert versions_res.status_code == 200
    versions = versions_res.json()
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1

    # 3. Update target configuration
    update_res = await client.patch(
        f"/api/v1/targets/{target_id}",
        json={"name": "Production Assistant API (v2)", "timeout_seconds": 25},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Production Assistant API (v2)"

    # 4. Verify version 2 created
    versions_res2 = await client.get(f"/api/v1/targets/{target_id}/versions", headers=headers)
    assert versions_res2.status_code == 200
    assert len(versions_res2.json()) == 2

    # 5. List targets
    list_res = await client.get("/api/v1/targets", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1

    # 6. Delete target
    del_res = await client.delete(f"/api/v1/targets/{target_id}", headers=headers)
    assert del_res.status_code == 200

    # 7. Verify deletion
    get_res = await client.get(f"/api/v1/targets/{target_id}", headers=headers)
    assert get_res.status_code == 404

