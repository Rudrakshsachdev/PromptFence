import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiClient, onSessionExpired } from '@/lib/api-client';

const fetchMock = vi.fn();

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const isRefresh = (url: string) => url.endsWith('/api/v1/auth/refresh');

/** Await a request that is expected to fail and return its error. */
async function caught(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('Expected the request to fail');
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiClient error parsing', () => {
  it('uses the string `detail` from application errors', async () => {
    fetchMock.mockResolvedValue(
      json(409, { detail: 'An account with this email address already exists', code: 'ConflictError' }),
    );

    const err = await caught(apiClient('/api/v1/auth/register', { method: 'POST' }));

    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('An account with this email address already exists');
    expect(err.status).toBe(409);
    expect(err.code).toBe('ConflictError');
  });

  it('turns FastAPI 422 `detail` arrays into a readable message (not "[object Object]")', async () => {
    fetchMock.mockResolvedValue(
      json(422, {
        detail: [
          { type: 'string_too_long', loc: ['body', 'password'], msg: 'String should have at most 128 characters' },
          { type: 'value_error', loc: ['body', 'email'], msg: 'value is not a valid email address' },
        ],
      }),
    );

    const err = await caught(apiClient('/api/v1/auth/register', { method: 'POST' }));

    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).not.toContain('[object Object]');
    expect(err.message).toBe(
      'String should have at most 128 characters. value is not a valid email address',
    );
    expect(err.status).toBe(422);
  });

  it('falls back to the HTTP status when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502, statusText: 'Bad Gateway' }));

    const err = await caught(apiClient('/api/v1/auth/forgot-password', { method: 'POST' }));

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(502);
    expect(err.message).toMatch(/502/);
  });

  it('maps network failures to a typed ApiError with status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const err = await caught(apiClient('/api/v1/auth/login', { method: 'POST' }));

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.message).toMatch(/unable to reach/i);
  });

  it('rethrows aborts untouched so callers can tell cancellation from failure', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError');
    fetchMock.mockRejectedValue(abort);

    await expect(apiClient('/api/v1/targets')).rejects.toBe(abort);
  });
});

describe('apiClient session refresh', () => {
  it('shares one refresh request between concurrent 401 responses', async () => {
    let refreshed = false;
    fetchMock.mockImplementation(async (url: string) => {
      if (isRefresh(url)) {
        await new Promise((r) => setTimeout(r, 10));
        refreshed = true;
        return json(200, { access_token: 'new' });
      }
      return refreshed ? json(200, { url }) : json(401, { detail: 'Token expired' });
    });

    const results = await Promise.all([
      apiClient<{ url: string }>('/api/v1/targets'),
      apiClient<{ url: string }>('/api/v1/test-suites'),
      apiClient<{ url: string }>('/api/v1/findings'),
    ]);

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => isRefresh(url));
    expect(refreshCalls).toHaveLength(1);
    expect(results.map((r) => r.url)).toEqual([
      'http://localhost:8000/api/v1/targets',
      'http://localhost:8000/api/v1/test-suites',
      'http://localhost:8000/api/v1/findings',
    ]);
  });

  it('allows a new refresh once the previous one has settled', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      isRefresh(url) ? json(200, { access_token: 'x' }) : json(401, { detail: 'expired' }),
    );

    await apiClient('/api/v1/a').catch(() => undefined);
    await apiClient('/api/v1/b').catch(() => undefined);

    expect(fetchMock.mock.calls.filter(([url]) => isRefresh(url))).toHaveLength(2);
  });

  it('handles a 204 response on the retried request', async () => {
    let refreshed = false;
    fetchMock.mockImplementation(async (url: string) => {
      if (isRefresh(url)) {
        refreshed = true;
        return json(200, { access_token: 'x' });
      }
      return refreshed ? new Response(null, { status: 204 }) : json(401, { detail: 'expired' });
    });

    await expect(apiClient('/api/v1/targets/1', { method: 'DELETE' })).resolves.toEqual({});
  });

  it('surfaces the retried request’s own error instead of the original 401', async () => {
    let refreshed = false;
    fetchMock.mockImplementation(async (url: string) => {
      if (isRefresh(url)) {
        refreshed = true;
        return json(200, { access_token: 'x' });
      }
      return refreshed
        ? json(403, { detail: 'Insufficient permissions', code: 'AuthorizationError' })
        : json(401, { detail: 'expired' });
    });

    const err = await caught(apiClient('/api/v1/users'));

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(403);
    expect(err.message).toBe('Insufficient permissions');
  });

  it('notifies session-expired listeners when the refresh is rejected', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      isRefresh(url) ? json(401, { detail: 'Refresh token has expired' }) : json(401, { detail: 'expired' }),
    );
    const listener = vi.fn();
    const unsubscribe = onSessionExpired(listener);

    const err = await caught(apiClient('/api/v1/targets'));
    unsubscribe();

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not treat a network failure during refresh as an expired session', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (isRefresh(url)) throw new TypeError('Failed to fetch');
      return json(401, { detail: 'expired' });
    });
    const listener = vi.fn();
    const unsubscribe = onSessionExpired(listener);

    const err = await caught(apiClient('/api/v1/targets'));
    unsubscribe();

    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('NETWORK_ERROR');
    expect(listener).not.toHaveBeenCalled();
  });

  it.each([
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/verify-email',
    '/api/v1/auth/logout',
  ])('never attempts a refresh for %s', async (endpoint) => {
    fetchMock.mockResolvedValue(json(401, { detail: 'Invalid email or password' }));

    const err = await caught(apiClient(endpoint, { method: 'POST' }));

    expect(err.message).toBe('Invalid email or password');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
