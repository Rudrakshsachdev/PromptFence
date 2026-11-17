/**
 * Permission names, identical to the backend's PermissionType values
 * (backend/app/permissions/roles.py). The API enforces them; the UI uses them
 * only to avoid offering actions that would be rejected.
 */
export const PERMISSIONS = {
  targetsWrite: 'targets:write',
  targetsDelete: 'targets:delete',
  targetsValidate: 'targets:validate',
  testSuitesWrite: 'test_suites:write',
  testSuitesDelete: 'test_suites:delete',
  scenariosWrite: 'scenarios:write',
  scenariosDelete: 'scenarios:delete',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
