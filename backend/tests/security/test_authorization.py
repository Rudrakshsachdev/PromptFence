"""Security tests: IDOR prevention and Role-Based Access Control."""

import uuid

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User


@pytest.mark.asyncio
async def test_idor_target_isolation(client: AsyncClient, test_user: User):
    """Ensure User B cannot access or modify User A's private target."""
    user_a_token = create_access_token(user_id=test_user.id, extra_claims={"roles": ["security_researcher"]})
    user_b_id = uuid.uuid4()
    user_b_token = create_access_token(user_id=user_b_id, extra_claims={"roles": ["security_researcher"]})

    # User A creates a target
    create_res = await client.post(
        "/api/v1/targets",
        json={
            "name": "Secret Target A",
            "target_type": "CHAT_API",
            "base_url": "https://example.com",
            "endpoint": "/private",
        },
        headers={"Authorization": f"Bearer {user_a_token}"},
    )
    assert create_res.status_code == 201
    target_id = create_res.json()["id"]

    # User B attempts to access User A's target -> 403 Forbidden
    b_get_res = await client.get(
        f"/api/v1/targets/{target_id}",
        headers={"Authorization": f"Bearer {user_b_token}"},
    )
    assert b_get_res.status_code in (403, 404)

    # User B attempts to update User A's target -> 403 Forbidden
    b_patch_res = await client.patch(
        f"/api/v1/targets/{target_id}",
        json={"name": "Hijacked Target"},
        headers={"Authorization": f"Bearer {user_b_token}"},
    )
    assert b_patch_res.status_code in (403, 404)

    # User B attempts to delete User A's target -> 403 Forbidden
    b_del_res = await client.delete(
        f"/api/v1/targets/{target_id}",
        headers={"Authorization": f"Bearer {user_b_token}"},
    )
    assert b_del_res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_unauthenticated_requests_blocked(client: AsyncClient):
    """Ensure endpoints reject unauthenticated access."""
    res = await client.get("/api/v1/targets")
    assert res.status_code == 401

    res2 = await client.get("/api/v1/dashboard/overview")
    assert res2.status_code == 401

    res3 = await client.get("/api/v1/users/me")
    assert res3.status_code == 401

