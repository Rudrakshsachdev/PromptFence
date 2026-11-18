import type { User } from '@/types/auth';

/** Role names exactly as the backend defines them (backend/app/permissions/roles.py). */
export const ROLES = {
  admin: 'admin',
  securityResearcher: 'security_researcher',
  viewer: 'viewer',
} as const;

export const ADMIN_HOME = '/overview';
export const RESEARCHER_HOME = '/security/researcher';

/**
 * Users whose workspace is the security researcher workspace: researchers who
 * are not also admins (admins keep the existing /overview). Decided from the
 * roles returned by /auth/me only.
 */
export function usesResearcherWorkspace(user: User | null | undefined): boolean {
  return !!user && user.roles.includes(ROLES.securityResearcher) && !user.roles.includes(ROLES.admin);
}

/** Who may open /security/researcher (researchers, plus admins via the usual admin bypass). */
export function canAccessResearcherWorkspace(user: User | null | undefined): boolean {
  return !!user && (user.roles.includes(ROLES.securityResearcher) || user.roles.includes(ROLES.admin));
}

/** Landing page after sign-in when no specific destination was requested. */
export function getHomeRoute(user: User | null | undefined): string {
  return usesResearcherWorkspace(user) ? RESEARCHER_HOME : ADMIN_HOME;
}
