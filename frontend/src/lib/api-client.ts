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

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
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

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    credentials: 'include', // Automatically sends HttpOnly cookies
  });

  // Handle 401 Unauthorized - attempt silent refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        // Retry the original request once
        const retryResponse = await fetch(url, {
          ...rest,
          headers: {
            ...defaultHeaders,
            ...headers,
          },
          credentials: 'include',
        });
        if (!retryResponse.ok) {
          const errData = await retryResponse.json().catch(() => ({}));
          throw new ApiError(errData.detail || 'Request failed after refresh', retryResponse.status, errData.code);
        }
        return (await retryResponse.json()) as T;
      }
    } catch {
      // Refresh failed, fall through to error
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `HTTP Error ${response.status}: ${response.statusText}`,
      response.status,
      errorData.code
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

