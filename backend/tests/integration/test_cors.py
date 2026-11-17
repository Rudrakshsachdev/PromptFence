"""CORS behaviour: preflights, origin allow-list, and CORS headers on error responses."""

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.core.config import LOCAL_DEV_CORS_ORIGINS, Settings
from app.main import app
from app.middleware import configure_middleware

AUTH_ENDPOINTS = [
    "/api/v1/auth/me",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
]


def preflight_headers(origin: str, method: str = "POST") -> dict[str, str]:
    return {
        "Origin": origin,
        "Access-Control-Request-Method": method,
        "Access-Control-Request-Headers": "content-type,authorization",
    }


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ── Preflight ────────────────────────────────────────────────────────────────


@pytest.mark.parametrize("origin", LOCAL_DEV_CORS_ORIGINS)
@pytest.mark.parametrize("endpoint", AUTH_ENDPOINTS)
async def test_preflight_allowed_for_local_frontends(
    client: AsyncClient, origin: str, endpoint: str
):
    method = "GET" if endpoint.endswith("/me") else "POST"
    res = await client.options(endpoint, headers=preflight_headers(origin, method))

    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == origin
    assert res.headers["access-control-allow-credentials"] == "true"
    allowed_methods = res.headers["access-control-allow-methods"]
    for m in ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"):
        assert m in allowed_methods
    allowed_headers = res.headers["access-control-allow-headers"].lower()
    assert "content-type" in allowed_headers
    assert "authorization" in allowed_headers


@pytest.mark.parametrize("origin", ["http://evil.example", "http://localhost:3002", "null"])
async def test_preflight_rejected_for_unapproved_origin(client: AsyncClient, origin: str):
    res = await client.options("/api/v1/auth/login", headers=preflight_headers(origin))

    assert res.status_code == 400
    assert "access-control-allow-origin" not in res.headers


async def test_preflight_rejected_for_unlisted_request_header(client: AsyncClient):
    headers = preflight_headers("http://localhost:3001")
    headers["Access-Control-Request-Headers"] = "content-type,x-evil-header"

    res = await client.options("/api/v1/auth/login", headers=headers)

    assert res.status_code == 400


async def test_actual_request_from_unapproved_origin_gets_no_cors_grant(client: AsyncClient):
    res = await client.get("/api/v1/auth/me", headers={"Origin": "http://evil.example"})

    assert "access-control-allow-origin" not in res.headers


# ── Actual requests and error responses keep CORS headers ───────────────────


async def test_login_failure_response_carries_cors_headers(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "WrongPass123!"},
        headers={"Origin": "http://localhost:3001"},
    )

    assert res.status_code == 401
    assert res.headers["access-control-allow-origin"] == "http://localhost:3001"
    assert res.headers["access-control-allow-credentials"] == "true"


async def test_successful_login_from_port_3001_sets_cookies_with_cors(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "researcher@promptfence.internal", "password": "ResearcherPass123!"},
        headers={"Origin": "http://localhost:3001"},
    )

    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == "http://localhost:3001"
    assert "access_token" in res.cookies


async def test_validation_and_not_found_errors_carry_cors_headers(client: AsyncClient):
    origin = {"Origin": "http://127.0.0.1:3001"}
    invalid = await client.post("/api/v1/auth/register", json={"email": "x"}, headers=origin)
    missing = await client.get("/api/v1/does-not-exist", headers=origin)

    assert invalid.status_code == 422
    assert missing.status_code == 404
    for res in (invalid, missing):
        assert res.headers["access-control-allow-origin"] == "http://127.0.0.1:3001"


# ── Authentication is not weakened ──────────────────────────────────────────


async def test_preflight_does_not_authenticate_or_leak_data(client: AsyncClient):
    res = await client.options(
        "/api/v1/auth/me", headers=preflight_headers("http://localhost:3001", "GET")
    )

    assert res.status_code == 200
    assert res.text == "OK"  # CORS layer answers; the route never runs


async def test_protected_route_still_requires_authentication(client: AsyncClient):
    res = await client.get("/api/v1/auth/me", headers={"Origin": "http://localhost:3001"})

    assert res.status_code == 401
    assert res.headers["access-control-allow-origin"] == "http://localhost:3001"


# ── Middleware ordering (isolated app with the real middleware stack) ───────


def build_app(rate_limit_requests: int = 100) -> FastAPI:
    test_app = FastAPI()
    configure_middleware(
        test_app, rate_limit_requests=rate_limit_requests, rate_limit_window_seconds=60
    )

    @test_app.get("/boom")
    async def boom() -> None:
        raise RuntimeError("unexpected failure with internal details")

    @test_app.post("/echo")
    async def echo() -> dict[str, bool]:
        return {"ok": True}

    return test_app


async def test_unhandled_exception_returns_json_500_with_cors_headers():
    transport = ASGITransport(app=build_app(), raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        res = await c.get("/boom", headers={"Origin": "http://localhost:3001"})

    assert res.status_code == 500
    assert res.json() == {
        "detail": "An internal server error occurred.",
        "code": "INTERNAL_SERVER_ERROR",
    }
    assert "internal details" not in res.text
    assert res.headers["access-control-allow-origin"] == "http://localhost:3001"
    assert res.headers["x-content-type-options"] == "nosniff"


async def test_rate_limited_response_carries_cors_headers_and_preflights_are_not_counted():
    origin = "http://localhost:3001"
    async with AsyncClient(
        transport=ASGITransport(app=build_app(rate_limit_requests=2)), base_url="http://test"
    ) as c:
        for _ in range(5):
            pre = await c.options("/echo", headers=preflight_headers(origin))
            assert pre.status_code == 200  # preflights never hit the limiter
        first = await c.post("/echo", headers={"Origin": origin})
        second = await c.post("/echo", headers={"Origin": origin})
        limited = await c.post("/echo", headers={"Origin": origin})

    assert first.status_code == second.status_code == 200
    assert limited.status_code == 429
    assert limited.headers["access-control-allow-origin"] == origin


# ── Configuration ───────────────────────────────────────────────────────────


def test_development_adds_local_frontend_origins():
    s = Settings(APP_ENV="development", CORS_ORIGINS=["https://app.example.com"])

    assert s.cors_allowed_origins[0] == "https://app.example.com"
    for origin in LOCAL_DEV_CORS_ORIGINS:
        assert origin in s.cors_allowed_origins


def test_production_uses_only_configured_origins():
    s = Settings(APP_ENV="production", CORS_ORIGINS=["https://promptfence.example.com/"])

    assert s.cors_allowed_origins == ["https://promptfence.example.com"]


def test_production_allows_nothing_by_default():
    assert Settings(APP_ENV="production", CORS_ORIGINS=[]).cors_allowed_origins == []


@pytest.mark.parametrize(
    "bad", [["*"], ["https://*.example.com"], ["https://app.example.com/path"], ["app.example.com"]]
)
def test_invalid_or_wildcard_origins_are_rejected(bad: list[str]):
    with pytest.raises(ValidationError):
        Settings(CORS_ORIGINS=bad)
