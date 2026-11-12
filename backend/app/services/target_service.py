"""Target service for managing AI application targets, versioning, and secure validation."""

import time
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.dependencies.permissions import check_resource_ownership
from app.integrations.ssrf import safe_http_request, validate_url
from app.models.target import Target, TargetVersion
from app.models.user import User
from app.repositories.target_repository import TargetRepository


class TargetService:
    """Business logic for target management and validation."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.target_repo = TargetRepository(db)

    async def create_target(self, user: User, target_data: dict) -> Target:
        """Create target and record its initial version (v1)."""
        # Validate base_url for SSRF safety
        validate_url(target_data["base_url"])

        target = await self.target_repo.create(owner_id=user.id, **target_data)

        # Snapshot version 1
        snapshot = {
            "name": target.name,
            "description": target.description,
            "target_type": target.target_type.value,
            "base_url": target.base_url,
            "endpoint": target.endpoint,
            "http_method": target.http_method,
            "authentication_type": target.authentication_type.value,
            "headers_config": target.headers_config,
            "request_template": target.request_template,
            "expected_response_format": target.expected_response_format,
            "timeout_seconds": target.timeout_seconds,
        }
        await self.target_repo.create_version(
            target_id=target.id,
            version_number=1,
            configuration_snapshot=snapshot,
        )

        return target

    async def get_target(self, target_id: uuid.UUID, user: User, user_roles: list[str]) -> Target:
        """Get target by ID with ownership enforcement."""
        target = await self.target_repo.get_by_id(target_id)
        if not target:
            raise NotFoundError("Target not found")
        check_resource_ownership(target.owner_id, user, user_roles)
        return target

    async def list_targets(
        self, user: User, user_roles: list[str], *, page: int = 1, page_size: int = 20
    ) -> tuple[list[Target], int]:
        """List targets owned by user with pagination."""
        return await self.target_repo.list_by_owner(user.id, page=page, page_size=page_size)

    async def update_target(
        self, target_id: uuid.UUID, user: User, user_roles: list[str], update_data: dict
    ) -> Target:
        """Update target and create a new version snapshot if configuration changed."""
        target = await self.get_target(target_id, user, user_roles)

        if "base_url" in update_data and update_data["base_url"]:
            validate_url(update_data["base_url"])

        clean_data = {k: v for k, v in update_data.items() if v is not None}
        updated_target = await self.target_repo.update(target, **clean_data)

        # Check if versioned fields changed
        versioned_fields = [
            "name", "base_url", "endpoint", "http_method", "authentication_type",
            "headers_config", "request_template", "timeout_seconds"
        ]
        if any(field in clean_data for field in versioned_fields):
            latest_version = await self.target_repo.get_latest_version_number(target.id)
            snapshot = {
                "name": updated_target.name,
                "description": updated_target.description,
                "target_type": updated_target.target_type.value,
                "base_url": updated_target.base_url,
                "endpoint": updated_target.endpoint,
                "http_method": updated_target.http_method,
                "authentication_type": updated_target.authentication_type.value,
                "headers_config": updated_target.headers_config,
                "request_template": updated_target.request_template,
                "expected_response_format": updated_target.expected_response_format,
                "timeout_seconds": updated_target.timeout_seconds,
            }
            await self.target_repo.create_version(
                target_id=target.id,
                version_number=latest_version + 1,
                configuration_snapshot=snapshot,
            )

        return updated_target

    async def delete_target(self, target_id: uuid.UUID, user: User, user_roles: list[str]) -> None:
        """Delete a target."""
        target = await self.get_target(target_id, user, user_roles)
        await self.target_repo.delete(target)

    async def update_status(
        self, target_id: uuid.UUID, user: User, user_roles: list[str], is_active: bool
    ) -> Target:
        """Update active status of a target."""
        target = await self.get_target(target_id, user, user_roles)
        return await self.target_repo.update(target, is_active=is_active)

    async def list_versions(
        self, target_id: uuid.UUID, user: User, user_roles: list[str]
    ) -> list[TargetVersion]:
        """List version history of a target."""
        target = await self.get_target(target_id, user, user_roles)
        return await self.target_repo.list_versions(target.id)

    async def validate_connectivity(
        self, target_id: uuid.UUID, user: User, user_roles: list[str]
    ) -> dict:
        """
        Validate network connectivity to target application endpoint safely.
        Applies SSRF prevention and timing measurements.
        """
        target = await self.get_target(target_id, user, user_roles)

        full_url = target.base_url.rstrip("/") + "/" + target.endpoint.lstrip("/")

        start_time = time.monotonic()
        try:
            response = await safe_http_request(
                url=full_url,
                method=target.http_method,
                headers=target.headers_config,
                timeout=float(target.timeout_seconds or 10),
            )
            elapsed_ms = (time.monotonic() - start_time) * 1000
            return {
                "reachable": True,
                "status_code": response.status_code,
                "response_time_ms": round(elapsed_ms, 2),
                "error": None,
            }
        except Exception as e:
            elapsed_ms = (time.monotonic() - start_time) * 1000
            # Return safe, non-sensitive error description
            error_msg = str(e)
            if "Restricted" in error_msg or "blocked" in error_msg.lower():
                safe_err = "Destination address is restricted for security reasons"
            else:
                safe_err = f"Connection failed: {type(e).__name__}"

            return {
                "reachable": False,
                "status_code": None,
                "response_time_ms": round(elapsed_ms, 2),
                "error": safe_err,
            }

