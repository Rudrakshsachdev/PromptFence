"""Route-level RBAC: the role -> permission matrix is enforced by the API itself."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.role import Role, UserRole
from app.models.target import Target
from app.models.test_suite import TestSuite
from app.models.user import User
from app.permissions.matrix import ROLE_PERMISSIONS_MATRIX
from app.permissions.roles import PermissionType, RoleType
from app.repositories.role_repository import RoleRepository

PASSWORD = "Password123!"


async def _user_with_role(db: AsyncSession, email: str, role: RoleType) -> User:
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None:
        user = User(
            email=email,
            full_name=email,
            password_hash=hash_password(PASSWORD),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()
        role_row = (await db.execute(select(Role).where(Role.name == role.value))).scalar_one()
        db.add(UserRole(user_id=user.id, role_id=role_row.id))
    else:
        user.password_hash = hash_password(PASSWORD)
    await db.commit()
    return user


async def _headers(client: AsyncClient, email: str) -> dict[str, str]:
    res = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert res.status_code == 200, res.text
    # Login also sets an access_token cookie, which the API prefers over the
    # Authorization header; drop it so each account is identified by its header.
    client.cookies.clear()
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
async def accounts(client: AsyncClient, db_session: AsyncSession) -> dict[str, dict[str, str]]:
    await _user_with_role(db_session, "admin@promptfence.internal", RoleType.ADMIN)
    await _user_with_role(
        db_session, "researcher@promptfence.internal", RoleType.SECURITY_RESEARCHER
    )
    await _user_with_role(db_session, "viewer@promptfence.internal", RoleType.VIEWER)
    return {
        "admin": await _headers(client, "admin@promptfence.internal"),
        "researcher": await _headers(client, "researcher@promptfence.internal"),
        "viewer": await _headers(client, "viewer@promptfence.internal"),
    }


# ── /auth/me reports the real role and effective permissions ────────────────


@pytest.mark.parametrize(
    ("account", "role"),
    [("admin", "admin"), ("researcher", "security_researcher"), ("viewer", "viewer")],
)
async def test_me_returns_role_and_matrix_permissions(client: AsyncClient, accounts, account, role):  # noqa: ANN001
    res = await client.get("/api/v1/auth/me", headers=accounts[account])

    assert res.status_code == 200
    body = res.json()
    assert body["roles"] == [role]
    expected = {p.value for p in ROLE_PERMISSIONS_MATRIX[RoleType(role)]}
    if role == "admin":
        expected = {p.value for p in PermissionType}  # admin bypass
    assert set(body["permissions"]) == expected


async def test_researcher_lacks_admin_only_permissions(client: AsyncClient, accounts):  # noqa: ANN001
    perms = set(
        (await client.get("/api/v1/auth/me", headers=accounts["researcher"])).json()["permissions"]
    )

    assert "system:admin" not in perms
    assert not {p for p in perms if p.startswith("users:")}


# ── Viewer is read-only on the API, regardless of the UI ────────────────────


@pytest.mark.parametrize(
    "path",
    ["/api/v1/targets", "/api/v1/test-suites", "/api/v1/scenarios"],
)
async def test_viewer_can_read(client: AsyncClient, accounts, path: str):  # noqa: ANN001
    res = await client.get(path, headers=accounts["viewer"])
    assert res.status_code == 200


async def test_viewer_is_forbidden_from_every_write(
    client: AsyncClient, accounts, db_session: AsyncSession
):  # noqa: ANN001
    target = (await db_session.execute(select(Target))).scalars().first()
    suite = (await db_session.execute(select(TestSuite))).scalars().first()
    any_id = uuid.uuid4()
    h = accounts["viewer"]
    attempts = [
        (
            "POST",
            "/api/v1/targets",
            {
                "name": "x",
                "target_type": "CHAT_API",
                "base_url": "https://a.example",
                "endpoint": "/v1",
            },
        ),
        ("PATCH", f"/api/v1/targets/{target.id}", {"name": "renamed"}),
        ("PATCH", f"/api/v1/targets/{target.id}/status", {"is_active": False}),
        ("DELETE", f"/api/v1/targets/{target.id}", None),
        ("POST", f"/api/v1/targets/{target.id}/validate", None),
        ("POST", f"/api/v1/targets/{target.id}/health-check", None),
        ("POST", "/api/v1/test-suites", {"name": "x"}),
        ("PATCH", f"/api/v1/test-suites/{suite.id}", {"name": "renamed"}),
        ("DELETE", f"/api/v1/test-suites/{suite.id}", None),
        ("POST", f"/api/v1/test-suites/{suite.id}/scenarios", {"scenario_id": str(any_id)}),
        (
            "POST",
            "/api/v1/scenarios",
            {
                "name": "x",
                "category": "PROMPT_INJECTION",
                "severity": "LOW",
                "attack_input_template": "t",
            },
        ),
        ("PATCH", f"/api/v1/scenarios/{any_id}", {"name": "renamed"}),
        ("DELETE", f"/api/v1/scenarios/{any_id}", None),
        ("PATCH", f"/api/v1/scenarios/{any_id}/status", {"is_enabled": False}),
    ]
    for method, path, body in attempts:
        res = await client.request(method, path, headers=h, json=body)
        assert res.status_code == 403, f"{method} {path} -> {res.status_code}"
        assert res.json()["code"] == "AuthorizationError"

    # Nothing changed
    await db_session.refresh(target)
    assert target.name != "renamed" and target.is_active


async def test_researcher_can_create_and_delete_suites(client: AsyncClient, accounts):  # noqa: ANN001
    h = accounts["researcher"]
    created = await client.post("/api/v1/test-suites", headers=h, json={"name": "RBAC suite"})
    assert created.status_code == 201
    deleted = await client.delete(f"/api/v1/test-suites/{created.json()['id']}", headers=h)
    assert deleted.status_code == 200


async def test_admin_bypass_allows_writes(client: AsyncClient, accounts):  # noqa: ANN001
    created = await client.post(
        "/api/v1/test-suites", headers=accounts["admin"], json={"name": "Admin suite"}
    )
    assert created.status_code == 201


async def test_unauthenticated_requests_are_rejected_before_permissions(client: AsyncClient):
    for path in ["/api/v1/targets", "/api/v1/test-suites", "/api/v1/scenarios"]:
        assert (await client.get(path)).status_code == 401
    assert (await client.post("/api/v1/test-suites", json={"name": "x"})).status_code == 401


async def test_role_and_permission_lookup_is_a_single_query(db_session: AsyncSession):
    viewer = await _user_with_role(db_session, "viewer@promptfence.internal", RoleType.VIEWER)
    statements = {"n": 0}

    def count(*_args: object) -> None:
        statements["n"] += 1

    engine = db_session.bind.sync_engine
    event.listen(engine, "before_cursor_execute", count)
    try:
        roles, permissions = await RoleRepository(db_session).get_role_and_permission_names(
            viewer.id
        )
    finally:
        event.remove(engine, "before_cursor_execute", count)

    assert statements["n"] == 1
    assert roles == {"viewer"}
    assert permissions == {p.value for p in ROLE_PERMISSIONS_MATRIX[RoleType.VIEWER]}
