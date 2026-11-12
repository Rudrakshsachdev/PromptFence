"""RBAC Permission Matrix mapping roles to permissions."""

from app.permissions.roles import PermissionType, RoleType

ROLE_PERMISSIONS_MATRIX: dict[RoleType, list[PermissionType]] = {
    RoleType.ADMIN: [
        PermissionType.USERS_READ,
        PermissionType.USERS_WRITE,
        PermissionType.USERS_DELETE,
        PermissionType.TARGETS_READ,
        PermissionType.TARGETS_WRITE,
        PermissionType.TARGETS_DELETE,
        PermissionType.TARGETS_VALIDATE,
        PermissionType.TEST_SUITES_READ,
        PermissionType.TEST_SUITES_WRITE,
        PermissionType.TEST_SUITES_DELETE,
        PermissionType.SCENARIOS_READ,
        PermissionType.SCENARIOS_WRITE,
        PermissionType.SCENARIOS_DELETE,
        PermissionType.DASHBOARD_READ,
        PermissionType.SYSTEM_ADMIN,
    ],
    RoleType.SECURITY_RESEARCHER: [
        PermissionType.TARGETS_READ,
        PermissionType.TARGETS_WRITE,
        PermissionType.TARGETS_DELETE,
        PermissionType.TARGETS_VALIDATE,
        PermissionType.TEST_SUITES_READ,
        PermissionType.TEST_SUITES_WRITE,
        PermissionType.TEST_SUITES_DELETE,
        PermissionType.SCENARIOS_READ,
        PermissionType.SCENARIOS_WRITE,
        PermissionType.SCENARIOS_DELETE,
        PermissionType.DASHBOARD_READ,
    ],
    RoleType.VIEWER: [
        PermissionType.TARGETS_READ,
        PermissionType.TEST_SUITES_READ,
        PermissionType.SCENARIOS_READ,
        PermissionType.DASHBOARD_READ,
    ],
}

