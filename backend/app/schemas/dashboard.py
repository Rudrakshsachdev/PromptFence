"""Dashboard schemas."""

from datetime import datetime

from pydantic import BaseModel


class DashboardOverview(BaseModel):
    """Dashboard overview stats."""
    total_targets: int = 0
    active_targets: int = 0
    total_test_suites: int = 0
    total_test_cases: int = 0
    enabled_test_cases: int = 0
    recent_targets: list[dict] = []
    recent_test_cases: list[dict] = []


class DashboardActivity(BaseModel):
    """Recent activity feed."""
    activities: list[dict] = []


class DashboardDistributions(BaseModel):
    """Distribution stats."""
    test_cases_by_category: dict[str, int] = {}
    test_cases_by_severity: dict[str, int] = {}
    targets_by_type: dict[str, int] = {}
