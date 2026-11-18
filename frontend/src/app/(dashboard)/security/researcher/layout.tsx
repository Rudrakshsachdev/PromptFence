'use client';

import React from 'react';
import { ShieldOff } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { canAccessResearcherWorkspace, getHomeRoute } from '@/lib/roles';

/**
 * Researcher workspace guard. Decided from the roles returned by /auth/me; the
 * API enforces its own permissions on every request regardless of this check.
 * Children (and therefore their data requests) are not mounted without access.
 */
export default function ResearcherWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!canAccessResearcherWorkspace(user)) {
    return (
      <EmptyState
        icon={ShieldOff}
        title="This workspace is for security researchers"
        description="Your role does not include access to the security researcher workspace."
        actionText="Go to your dashboard"
        actionHref={getHomeRoute(user)}
      />
    );
  }

  return <>{children}</>;
}
