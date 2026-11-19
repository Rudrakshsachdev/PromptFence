"""Authentication API routes."""

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.user import User
from app.permissions.roles import PermissionType, RoleType
from app.repositories.role_repository import RoleRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.common import SuccessResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set secure HttpOnly authentication cookies."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",  # Scoped to auth endpoints for security
    )


def _clear_auth_cookies(response: Response) -> None:
    """Clear authentication cookies on logout."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")


@router.post("/register", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new user account and dispatch verification email."""
    auth_service = AuthService(db)
    user, _ = await auth_service.register(
        email=data.email,
        password=data.password,
        full_name=data.full_name,
    )
    return SuccessResponse(message="Registration successful. Please check your email to verify your account.")


@router.post("/verify-email", response_model=SuccessResponse)
async def verify_email(
    data: VerifyEmailRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Verify email address with verification token."""
    auth_service = AuthService(db)
    await auth_service.verify_email(data.token)
    return SuccessResponse(message="Email address verified successfully. You may now log in.")


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate user with email and password, setting secure HttpOnly cookies."""
    auth_service = AuthService(db)
    device_info = request.headers.get("user-agent", "Unknown Device")
    user, access_token, refresh_token, user_response = await auth_service.login(
        email=data.email,
        password=data.password,
        device_info=device_info,
    )

    _set_auth_cookies(response, access_token, refresh_token)
    return TokenResponse(access_token=access_token, user=user_response)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
):
    """Rotate refresh token and issue new access & refresh tokens."""
    if not refresh_token:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return TokenResponse(access_token="")

    auth_service = AuthService(db)
    new_access_token, new_refresh_token = await auth_service.refresh_tokens(refresh_token)
    _set_auth_cookies(response, new_access_token, new_refresh_token)
    return TokenResponse(access_token=new_access_token)


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
):
    """Logout by revoking current refresh token and clearing auth cookies."""
    auth_service = AuthService(db)
    await auth_service.logout(refresh_token)
    _clear_auth_cookies(response)
    return SuccessResponse(message="Successfully logged out")


@router.post("/logout-all", response_model=SuccessResponse)
async def logout_all(
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Logout from all active sessions on all devices."""
    auth_service = AuthService(db)
    await auth_service.logout_all(current_user.id)
    _clear_auth_cookies(response)
    return SuccessResponse(message="Successfully logged out of all devices")


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Send password reset email (generic response to prevent email enumeration)."""
    auth_service = AuthService(db)
    await auth_service.forgot_password(data.email)
    return SuccessResponse(message="If an account with that email exists, password reset instructions have been sent.")


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(
    data: ResetPasswordRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Reset password using reset token and terminate other sessions."""
    auth_service = AuthService(db)
    await auth_service.reset_password(data.token, data.new_password)
    _clear_auth_cookies(response)
    return SuccessResponse(message="Password reset successfully. Please log in with your new password.")


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Return the authenticated user's profile, roles and effective permissions."""
    role_names, permissions = await RoleRepository(db).get_role_and_permission_names(
        current_user.id
    )
    if RoleType.ADMIN.value in role_names:
        # Mirrors the admin bypass in require_role/require_permission.
        permissions |= {p.value for p in PermissionType}

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login_at=current_user.last_login_at,
        roles=sorted(role_names),
        permissions=sorted(permissions),
    )

