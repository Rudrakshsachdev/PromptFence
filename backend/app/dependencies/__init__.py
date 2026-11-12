"""Dependencies package."""

from app.dependencies.auth import get_current_user, require_active_user, require_verified_user
from app.dependencies.database import get_db
from app.dependencies.pagination import PaginationParams, get_pagination_params
from app.dependencies.permissions import check_resource_ownership, require_permission, require_role

__all__ = [
    "get_db",
    "get_current_user",
    "require_active_user",
    "require_verified_user",
    "require_role",
    "require_permission",
    "check_resource_ownership",
    "PaginationParams",
    "get_pagination_params",
]

