/**
 * Auth pages wired to the real service + API client, with only `fetch` stubbed,
 * so backend response shapes are exercised end to end.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegisterPage from '@/app/(auth)/register/page';
import LoginPage from '@/app/(auth)/login/page';
import { AuthProvider } from '@/providers/auth-provider';

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fetchMock = vi.fn();

function renderPage(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('auth pages against real API response shapes', () => {
  it('register renders a FastAPI 422 validation error as readable text', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/register')) {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({
          email: 'ada@corp.example',
          password: 'ValidPass123',
          full_name: 'Ada',
        });
        return respond(422, {
          detail: [{ type: 'value_error', loc: ['body', 'email'], msg: 'value is not a valid email address' }],
        });
      }
      return respond(401, { detail: 'Not authenticated' });
    });
    const user = userEvent.setup();
    renderPage(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), 'Ada');
    await user.type(screen.getByLabelText(/email address/i), 'ada@corp.example');
    await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');
    await user.click(screen.getByRole('button', { name: /register account/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('value is not a valid email address');
    expect(alert).not.toHaveTextContent('[object Object]');
  });

  it('login reports an unreachable server clearly', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/auth/login')) throw new TypeError('Failed to fetch');
      return respond(401, { detail: 'Not authenticated' });
    });
    const user = userEvent.setup();
    renderPage(<LoginPage />);

    await user.type(screen.getByLabelText(/email address/i), 'ada@corp.example');
    await user.type(screen.getByLabelText(/^password/i), 'whatever');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to reach the promptfence server/i);
  });
});
