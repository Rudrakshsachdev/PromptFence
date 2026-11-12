"""Role definitions and permission constants for RBAC."""

from enum import Enum


class RoleType(str, Enum):
    ADMIN = "admin"
    SECURITY_RESEARCHER = "security_researcher"
    VIEWER = "viewer"


class PermissionType(str, Enum):
    # User permissions
    USERS_READ = "users:read"
    USERS_WRITE = "users:write"
    USERS_DELETE = "users:delete"

    # Target permissions
    TARGETS_READ = "targets:read"
    TARGETS_WRITE = "targets:write"
    TARGETS_DELETE = "targets:delete"
    TARGETS_VALIDATE = "targets:validate"

    # Test Suite permissions
    TEST_SUITES_READ = "test_suites:read"
    TEST_SUITES_WRITE = "test_suites:write"
    TEST_SUITES_DELETE = "test_suites:delete"

    # Scenario / Test Case permissions
    SCENARIOS_READ = "scenarios:read"
    SCENARIOS_WRITE = "scenarios:write"
    SCENARIOS_DELETE = "scenarios:delete"

    # Dashboard permissions
    DASHBOARD_READ = "dashboard:read"

    # System administration
    SYSTEM_ADMIN = "system:admin"

