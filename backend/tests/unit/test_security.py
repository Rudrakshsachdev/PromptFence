"""Unit tests for password hashing and JWT security functions."""

import uuid

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_random_token,
    hash_password,
    verify_password,
)


def test_password_hashing():
    pw = "SuperSecurePassword123!"
    hashed = hash_password(pw)

    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False


def test_jwt_access_token_creation_and_decode():
    user_id = uuid.uuid4()
    token = create_access_token(user_id=user_id, extra_claims={"roles": ["security_researcher"]})

    payload = decode_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["type"] == "access"
    assert "roles" in payload
    assert payload["roles"] == ["security_researcher"]


def test_jwt_refresh_token_creation():
    user_id = uuid.uuid4()
    token, family_id = create_refresh_token(user_id=user_id)

    payload = decode_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["type"] == "refresh"
    assert payload["family"] == str(family_id)


def test_generate_random_token():
    t1 = generate_random_token()
    t2 = generate_random_token()
    assert len(t1) > 20
    assert t1 != t2

