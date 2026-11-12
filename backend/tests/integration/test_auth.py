"""Integration tests for registration, email verification, login, refresh rotation, and logout."""

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import EmailVerificationToken, RefreshToken
from app.models.user import User


@pytest.mark.asyncio
async def test_register_flow(client: AsyncClient, db_session: AsyncSession):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@promptfence.local",
            "password": "ValidPassword123!",
            "full_name": "New User",
        },
    )
    assert response.status_code == 201

    # Verify user in database
    res = await db_session.execute(select(User).where(User.email == "newuser@promptfence.local"))
    user = res.scalar_one_or_none()
    assert user is not None
    assert user.is_verified is False

    # Check verification token was generated
    res = await db_session.execute(select(EmailVerificationToken).where(EmailVerificationToken.user_id == user.id))
    evt = res.scalar_one_or_none()
    assert evt is not None


@pytest.mark.asyncio
async def test_duplicate_registration_fails(client: AsyncClient, test_user: User):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "password": "ValidPassword123!",
            "full_name": "Duplicate User",
        },
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_flow(client: AsyncClient, test_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "Password123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

    # Verify cookies
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_login_invalid_password_fails(client: AsyncClient, test_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "WrongPassword!",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient, test_user: User):
    # 1. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    refresh_token_1 = login_res.cookies.get("refresh_token")

    # 2. Call refresh endpoint
    client.cookies.set("refresh_token", refresh_token_1)
    refresh_res = await client.post("/api/v1/auth/refresh")
    assert refresh_res.status_code == 200
    refresh_token_2 = refresh_res.cookies.get("refresh_token")
    assert refresh_token_2 != refresh_token_1

    # 3. REUSE DETECTION TEST: Reusing refresh_token_1 should fail and revoke family
    client.cookies.set("refresh_token", refresh_token_1)
    reuse_res = await client.post("/api/v1/auth/refresh")
    assert reuse_res.status_code == 401


@pytest.mark.asyncio
async def test_logout_clears_cookies(client: AsyncClient, test_user: User):
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "Password123!"},
    )
    assert login_res.status_code == 200

    logout_res = await client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200

