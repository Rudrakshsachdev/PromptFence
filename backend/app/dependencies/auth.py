"""Authentication dependencies."""

import uuid
from typing import Annotated

from fastapi import Cookie, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import AuthenticationError
from app.core.security import JWTError, decode_token
from app.dependencies.database import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository


async def get_token_from_request(
    access_token_cookie: Annotated[str | None, Cookie(alias="access_token")] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """Extract JWT token from cookie or Authorization Bearer header."""
    if access_token_cookie:
        return access_token_cookie
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    raise AuthenticationError("Authentication credentials were not provided")


async def get_current_user(
    token: Annotated[str, Depends(get_token_from_request)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Resolve current authenticated user from token."""
    try:
        payload = decode_token(token)
    except JWTError:
        raise AuthenticationError("Invalid or expired access token")

    token_type = payload.get("type")
    if token_type != "access":
        raise AuthenticationError("Invalid token type")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AuthenticationError("Token payload missing user identifier")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthenticationError("Invalid user ID in token")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise AuthenticationError("User not found or account removed")

    return user


async def require_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Ensure user account is active."""
    if not current_user.is_active:
        raise AuthenticationError("Account is inactive")
    return current_user


async def require_verified_user(
    current_user: Annotated[User, Depends(require_active_user)],
) -> User:
    """Ensure user email has been verified."""
    if not current_user.is_verified:
        raise AuthenticationError("Email verification is required to perform this action")
    return current_user
