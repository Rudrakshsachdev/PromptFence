"""Services package."""

from app.services.auth_service import AuthService
from app.services.dashboard_service import DashboardService
from app.services.email_service import get_email_service
from app.services.target_service import TargetService
from app.services.test_case_service import TestCaseService
from app.services.test_suite_service import TestSuiteService
from app.services.user_service import UserService

__all__ = [
    "AuthService",
    "UserService",
    "TargetService",
    "TestSuiteService",
    "TestCaseService",
    "DashboardService",
    "get_email_service",
]

