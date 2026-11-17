/**
 * Centralized API client for communicating with the FastAPI backend.
 * Uses native fetch with credentials: 'include' for HttpOnly cookie transport.
 * Handles automatic token refresh on 401 and returns typed responses.
 */

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const REFRESH_ENDPOINT = '/api/v1/auth/refresh';

/**
 * Credential-bearing auth endpoints. A 401 from these means "bad credentials /
 * token", never "access token expired", so they must not trigger a refresh.
 */
const NO_REFRESH_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/logout',
];

export const NETWORK_ERROR_MESSAGE =
  'Unable to reach the PromptFence server. Check your connection and try again.';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

interface ValidationIssue {
  msg?: unknown;
}

/**
 * FastAPI returns `detail` as a string for application errors and as an array
 * of `{ loc, msg, type }` objects for request-validation (422) errors.
 */
function extractErrorMessage(detail: unknown): string | undefined {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((issue: ValidationIssue) => (typeof issue?.msg === 'string' ? issue.msg : undefined))
      .filter((msg): msg is string => Boolean(msg));
    if (messages.length) return messages.join('. ');
  }
  return undefined;
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: { detail?: unknown; code?: unknown } = await response.json().catch(() => ({}));
  const message =
    extractErrorMessage(body.detail) ??
    `HTTP Error ${response.status}${response.statusText ? `: ${response.statusText}` : ''}`;
  return new ApiError(message, response.status, typeof body.code === 'string' ? body.code : undefined);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

/** fetch() that reports connectivity failures as a typed ApiError (status 0). */
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, 'NETWORK_ERROR');
  }
}

/* ── Session refresh ─────────────────────────────────────────────────────────
 * Refresh tokens are single-use and rotated server-side, with reuse detection
 * that revokes the whole token family. Every request that sees a 401 at the
 * same moment must therefore share ONE refresh call rather than each rotating
 * (and possibly replaying) the same refresh cookie.
 */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Resolves `true` when the session was renewed and `false` when the server
 * rejected the refresh token. Connectivity failures reject with a network
 * ApiError so a flaky connection is not mistaken for an expired session.
 */
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = send(`${API_BASE}${REFRESH_ENDPOINT}`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * Subscribe to "the session could not be refreshed" events so auth state can be
 * cleared and the user sent back to sign in. Returns an unsubscribe function.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...rest } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Automatically sends HttpOnly cookies
  };

  const response = await send(url, init);

  // Handle 401 Unauthorized - attempt one silent refresh, then retry once.
  const canRefresh = !NO_REFRESH_ENDPOINTS.some((path) => endpoint.includes(path));
  if (response.status === 401 && canRefresh) {
    if (await refreshSession()) {
      return parseResponse<T>(await send(url, init));
    }
    sessionExpiredListeners.forEach((listener) => listener());
  }

  return parseResponse<T>(response);
}
