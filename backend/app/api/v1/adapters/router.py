"""Adapters API router."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.engine.adapters.registry import AdapterRegistry
from app.models.user import User
from app.schemas.execution import AdapterInfoResponse

router = APIRouter(prefix="/adapters", tags=["Adapters"])


@router.get("", response_model=list[AdapterInfoResponse])
async def list_adapters(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """List available target adapters and their declared capabilities."""
    adapters_info = AdapterRegistry.list_supported_adapters()
    return [AdapterInfoResponse.model_validate(a) for a in adapters_info]
