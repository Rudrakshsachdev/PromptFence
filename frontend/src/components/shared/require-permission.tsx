'use client';

import React from 'react';
import { ShieldOff } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { usePermissions } from '@/hooks/use-auth';
import type { Permission } from '@/constants/permissions';

/**
 * Route-level guard for pages that only make sense with a write permission
 * (create / edit forms opened directly by URL). The API rejects the action
 * regardless; this shows a clear explanation instead of a form that would fail.
 */
export function RequirePermission({
  permission,
  backHref,
  backLabel,
  children,
}: {
  permission: Permission;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
}) {
  const { can } = usePermissions();
  if (can(permission)) return <>{children}</>;
  return (
    <EmptyState
      icon={ShieldOff}
      title="You don't have permission to do this"
      description="Your role has read-only access to this area. Ask an administrator if you need to make changes."
      actionText={backLabel}
      actionHref={backHref}
    />
  );
}
