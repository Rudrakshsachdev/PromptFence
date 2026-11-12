"""Users API routes."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.user import ChangePasswordRequest, SessionResponse, UserResponse, UserUpdateRequest
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve authenticated user's profile."""
    user_service = UserService(db)
    user, roles = await user_service.get_profile(current_user)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=user.last_login_at,
        roles=roles,
    )


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    data: UserUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update profile details (full name, avatar URL)."""
    user_service = UserService(db)
    updated_user = await user_service.update_profile(
        current_user, full_name=data.full_name, avatar_url=data.avatar_url
    )
    user, roles = await user_service.get_profile(updated_user)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=user.last_login_at,
        roles=roles,
    )


@router.post("/me/change-password", response_model=SuccessResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Change account password and revoke other active sessions."""
    user_service = UserService(db)
    await user_service.change_password(
        current_user,
        current_password=data.current_password,
        new_password=data.new_password,
    )
    return SuccessResponse(message="Password changed successfully. All other sessions have been logged out.")


@router.get("/me/sessions", response_model=list[SessionResponse])
async def list_active_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all currently active sessions for the authenticated user."""
    user_service = UserService(db)
    sessions = await user_service.get_sessions(current_user.id)
    return [
        SessionResponse(
            id=s.id,
            device_info=s.device_info,
            created_at=s.created_at,
            last_used_at=s.last_used_at,
        )
        for s in sessions
    ]


@router.delete("/me/sessions/{session_id}", response_model=SuccessResponse)
async def revoke_session(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Revoke a specific active session."""
    user_service = UserService(db)
    await user_service.revoke_session(current_user.id, session_id)
    return SuccessResponse(message="Session revoked successfully")

