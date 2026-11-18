'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { getRedirectFromLocation } from '@/lib/auth-redirect';
import { getHomeRoute } from '@/lib/roles';
import type { Permission } from '@/constants/permissions';

export { useAuth };

/**
 * Permission checks for the signed-in user, from the permissions returned by
 * /auth/me. Admins pass every check, mirroring the API's admin bypass. This
 * only shapes the UI; the API enforces every permission independently.
 */
export function usePermissions() {
  const { user } = useAuth();
  const can = useCallback(
    (permission: Permission) =>
      !!user && (user.roles.includes('admin') || (user.permissions ?? []).includes(permission)),
    [user],
  );
  return { can };
}

/**
 * Send an already-signed-in visitor away from guest-only pages (sign in,
 * register) to their requested destination or their role's workspace.
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getRedirectFromLocation() ?? getHomeRoute(user));
    }
  }, [isAuthenticated, isLoading, router, user]);
}
