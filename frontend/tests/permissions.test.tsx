import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { RequirePermission } from '@/components/shared/require-permission';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermissions } from '@/hooks/use-auth';
import type { User } from '@/types/auth';

const auth = vi.hoisted(() => ({ user: null as User | null }));
vi.mock('@/providers/auth-provider', () => ({ useAuth: () => ({ user: auth.user }) }));

const baseUser = {
  id: 'u',
  email: 'u@example.com',
  full_name: 'U',
  is_active: true,
  is_verified: true,
  created_at: '',
  updated_at: '',
};

// Permission sets exactly as /auth/me returns them for each seeded role.
const ACCOUNTS: Record<string, User> = {
  admin: { ...baseUser, roles: ['admin'], permissions: [] },
  researcher: {
    ...baseUser,
    roles: ['security_researcher'],
    permissions: [
      'dashboard:read', 'scenarios:delete', 'scenarios:read', 'scenarios:write', 'targets:delete',
      'targets:read', 'targets:validate', 'targets:write', 'test_suites:delete', 'test_suites:read',
      'test_suites:write',
    ],
  },
  viewer: {
    ...baseUser,
    roles: ['viewer'],
    permissions: ['dashboard:read', 'scenarios:read', 'targets:read', 'test_suites:read'],
  },
};

const can = (account: keyof typeof ACCOUNTS | null, permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) => {
  auth.user = account ? ACCOUNTS[account] : null;
  return renderHook(() => usePermissions()).result.current.can(permission);
};

describe('usePermissions', () => {
  it.each(Object.values(PERMISSIONS))('admin can %s (admin bypass, as on the API)', (permission) => {
    expect(can('admin', permission)).toBe(true);
  });

  it.each(Object.values(PERMISSIONS))('security researcher can %s', (permission) => {
    expect(can('researcher', permission)).toBe(true);
  });

  it.each(Object.values(PERMISSIONS))('viewer cannot %s', (permission) => {
    expect(can('viewer', permission)).toBe(false);
  });

  it('denies everything when signed out', () => {
    expect(can(null, PERMISSIONS.targetsWrite)).toBe(false);
  });
});

describe('RequirePermission', () => {
  it('renders the page for users with the permission', () => {
    auth.user = ACCOUNTS.researcher;
    render(
      <RequirePermission permission={PERMISSIONS.targetsWrite} backHref="/targets" backLabel="Back to targets">
        <p>target form</p>
      </RequirePermission>,
    );
    expect(screen.getByText('target form')).toBeInTheDocument();
  });

  it('explains instead of rendering the form for read-only users opening the URL directly', () => {
    auth.user = ACCOUNTS.viewer;
    render(
      <RequirePermission permission={PERMISSIONS.targetsWrite} backHref="/targets" backLabel="Back to targets">
        <p>target form</p>
      </RequirePermission>,
    );
    expect(screen.queryByText('target form')).not.toBeInTheDocument();
    expect(screen.getByText("You don't have permission to do this")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to targets' })).toHaveAttribute('href', '/targets');
  });
});
