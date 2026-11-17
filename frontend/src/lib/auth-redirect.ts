/** Where users land after signing in when no (valid) destination was requested. */
export const DEFAULT_AUTHENTICATED_ROUTE = '/overview';

/** Public authentication routes — never a post-login destination (avoids loops). */
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

/**
 * Validate a `?next=` value before navigating to it after sign-in.
 *
 * Only same-origin, absolute *paths* are accepted. Anything that could leave the
 * site (`https://…`, protocol-relative `//host`, back-slash variants browsers
 * normalise to `//`, control characters) or that points back at an auth page
 * falls back to the default route, preventing open redirects and redirect loops.
 */
export function getSafeRedirect(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F\\]/.test(next)) return DEFAULT_AUTHENTICATED_ROUTE;

  const pathname = next.split(/[?#]/, 1)[0];
  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }
  return next;
}

/** Read and validate the `next` parameter from the current URL (client only). */
export function getRedirectFromLocation(): string {
  if (typeof window === 'undefined') return DEFAULT_AUTHENTICATED_ROUTE;
  return getSafeRedirect(new URLSearchParams(window.location.search).get('next'));
}

/** Build the sign-in URL that returns the user to `path` afterwards. */
export function buildLoginUrl(path: string): string {
  const safe = getSafeRedirect(path);
  return safe === DEFAULT_AUTHENTICATED_ROUTE ? '/login' : `/login?next=${encodeURIComponent(safe)}`;
}
