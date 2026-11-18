import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import LoginPage from '@/app/auth/login/page';
import RegisterPage from '@/app/auth/register/page';
import ForgotPasswordPage from '@/app/auth/forgot-password/page';
import ResetPasswordPage from '@/app/auth/reset-password/page';
import VerifyEmailPage from '@/app/auth/verify-email/page';
import DashboardLayout from '@/app/(dashboard)/layout';
import { AuthPasswordInput } from '@/components/auth';
import { AuthProvider, SESSION_NOT_ESTABLISHED_MESSAGE, useAuth } from '@/providers/auth-provider';
import { ApiError, NETWORK_ERROR_MESSAGE, apiClient } from '@/lib/api-client';

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => nav,
  usePathname: () => window.location.pathname,
  useSearchParams: () => nav.searchParams,
}));

const authService = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock('@/services/auth.service', () => ({ authService }));

const USER = {
  id: 'u-1',
  email: 'researcher@promptfence.internal',
  full_name: 'Research Lead',
  is_active: true,
  is_verified: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  roles: ['security_researcher'],
};

const ADMIN_USER = { ...USER, id: 'u-admin', email: 'admin@promptfence.internal', roles: ['admin'] };
const VIEWER_USER = { ...USER, id: 'u-viewer', email: 'viewer@promptfence.internal', roles: ['viewer'] };

const VALID_PASSWORD = 'ValidPass123!';

function renderWithAuth(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
  );
  return { queryClient, ...utils };
}

/** A promise the test resolves/rejects by hand, to observe in-flight states. */
function deferred<T = unknown>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  nav.searchParams = new URLSearchParams();
  window.history.replaceState({}, '', '/');
  authService.getMe.mockRejectedValue(new ApiError('Not authenticated', 401));
  authService.logout.mockResolvedValue({ message: 'ok' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ─────────────────────────────── Password field ─────────────────────────────── */

describe('AuthPasswordInput visibility toggle', () => {
  it('switches the input between password and text and exposes the state', async () => {
    const user = userEvent.setup();
    render(<AuthPasswordInput id="pw" label="Password" />);
    const input = screen.getByLabelText(/^password/i);
    const toggle = screen.getByRole('button', { name: 'Show password' });

    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'pw');

    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('is reachable and operable from the keyboard', async () => {
    const user = userEvent.setup();
    render(<AuthPasswordInput id="pw" label="Password" />);
    const input = screen.getByLabelText(/^password/i);

    input.focus();
    await user.tab();
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(input).toHaveAttribute('type', 'text');
    await user.keyboard(' ');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('keeps the typed value and never submits the surrounding form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <AuthPasswordInput id="pw" label="Password" />
      </form>,
    );
    const input = screen.getByLabelText(/^password/i);
    await user.type(input, 'S3cret!');
    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(input).toHaveValue('S3cret!');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('is disabled together with its input', () => {
    render(<AuthPasswordInput id="pw" label="Password" disabled />);
    expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled();
  });

  it('marks required fields for assistive technology', () => {
    render(<AuthPasswordInput id="pw" label="Password" required />);
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('aria-required', 'true');
  });
});

/* ──────────────────────────────────── Login ─────────────────────────────────── */

describe('Login page', () => {
  async function fillLogin(email: string, password: string) {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), email);
    await user.type(screen.getByLabelText(/^password/i), password);
    return user;
  }

  it('renders labelled fields and links to sign-up and password recovery', () => {
    renderWithAuth(<LoginPage />);

    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/auth/register');
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/auth/forgot-password');
    // The former "Remember me" box never affected the session and was removed.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('validates empty and malformed input without calling the API', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('clears field errors once the input is corrected', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await screen.findByText('Email is required');

    await user.type(screen.getByLabelText(/email address/i), 'lead@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'x');

    await waitFor(() => expect(screen.queryByText('Email is required')).not.toBeInTheDocument());
    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
  });

  it('shows the API error inline, re-enables the form, and clears it on edit', async () => {
    authService.login.mockRejectedValue(new ApiError('Invalid email or password', 401, 'AuthenticationError'));
    renderWithAuth(<LoginPage />);
    const user = await fillLogin('lead@example.com', 'WrongPass1');

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
    expect(nav.replace).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/^password/i), '2');
    expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
  });

  it('shows a loading state and blocks duplicate submissions', async () => {
    const pending = deferred();
    authService.login.mockReturnValue(pending.promise);
    renderWithAuth(<LoginPage />);
    const user = await fillLogin('lead@example.com', VALID_PASSWORD);

    await user.dblClick(screen.getByRole('button', { name: /sign in/i }));

    const busy = await screen.findByRole('button', { name: /signing in/i });
    expect(busy).toBeDisabled();
    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    await user.keyboard('{Enter}');
    expect(authService.login).toHaveBeenCalledTimes(1);

    await act(async () => pending.reject(new ApiError('Invalid email or password', 401)));
  });

  it('signs a researcher in to the researcher workspace and stays locked while navigating', async () => {
    authService.login.mockResolvedValue({ access_token: 'token' });
    renderWithAuth(<LoginPage />);
    const user = await fillLogin('lead@example.com', VALID_PASSWORD);
    authService.getMe.mockResolvedValue(USER);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/security/researcher'));
    expect(authService.login).toHaveBeenCalledWith({ email: 'lead@example.com', password: VALID_PASSWORD });
    expect(toast.success).toHaveBeenCalledWith('Authenticated successfully');
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('returns to the protected page named in ?next=', async () => {
    window.history.replaceState({}, '', '/login?next=%2Ffindings%3Fseverity%3Dhigh');
    authService.login.mockResolvedValue({ access_token: 'token' });
    renderWithAuth(<LoginPage />);
    const user = await fillLogin('lead@example.com', VALID_PASSWORD);
    authService.getMe.mockResolvedValue(USER);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/findings?severity=high'));
  });

  it('ignores off-site ?next= targets (open-redirect protection)', async () => {
    window.history.replaceState({}, '', '/login?next=%2F%2Fevil.example%2Fphish');
    authService.login.mockResolvedValue({ access_token: 'token' });
    renderWithAuth(<LoginPage />);
    const user = await fillLogin('lead@example.com', VALID_PASSWORD);
    authService.getMe.mockResolvedValue(USER);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Unsafe target ignored: the researcher lands on their own workspace instead.
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/security/researcher'));
  });

  it.each([
    ['admin', ADMIN_USER, '/overview'],
    ['viewer', VIEWER_USER, '/overview'],
  ])('signs an %s in to the shared dashboard', async (_role, account, home) => {
    authService.login.mockResolvedValue({ access_token: 'token' });
    renderWithAuth(<LoginPage />);
    const user = await fillLogin('lead@example.com', VALID_PASSWORD);
    authService.getMe.mockResolvedValue(account);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith(home));
  });

  it('reports a login that did not produce a usable session instead of claiming success', async () => {
    authService.login.mockResolvedValue({ access_token: 'token' });
    renderWithAuth(<LoginPage />);
    const user = await fillLogin('lead@example.com', VALID_PASSWORD);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(SESSION_NOT_ESTABLISHED_MESSAGE);
    expect(toast.success).not.toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('sends an already signed-in visitor straight to their workspace', async () => {
    authService.getMe.mockResolvedValue(USER);
    renderWithAuth(<LoginPage />);

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/security/researcher'));
  });

  it('sends an already signed-in admin to /overview', async () => {
    authService.getMe.mockResolvedValue(ADMIN_USER);
    renderWithAuth(<LoginPage />);

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/overview'));
  });

  describe('development account autofill', () => {
    it('fills exactly the selected seed credentials and marks the account', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginPage />);
      const panel = screen.getByRole('group', { name: /development accounts/i });

      await user.click(within(panel).getByRole('button', { name: /admin/i }));

      expect(screen.getByLabelText(/email address/i)).toHaveValue('admin@promptfence.internal');
      expect(screen.getByLabelText(/^password/i)).toHaveValue('AdminSecurePass123!');
      expect(within(panel).getByRole('button', { name: /admin/i })).toHaveAttribute('aria-pressed', 'true');

      await user.click(within(panel).getByRole('button', { name: /researcher/i }));
      expect(screen.getByLabelText(/email address/i)).toHaveValue('researcher@promptfence.internal');
      expect(screen.getByLabelText(/^password/i)).toHaveValue('ResearcherPass123!');
      expect(within(panel).getByRole('button', { name: /admin/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('keeps password visibility working after autofill', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginPage />);
      await user.click(screen.getByRole('button', { name: /admin/i }));

      await user.click(screen.getByRole('button', { name: 'Show password' }));
      const password = screen.getByLabelText(/^password/i);
      expect(password).toHaveAttribute('type', 'text');
      expect(password).toHaveValue('AdminSecurePass123!');
    });

    it('drops the selected marker once the credentials are edited', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginPage />);
      await user.click(screen.getByRole('button', { name: /admin/i }));

      await user.type(screen.getByLabelText(/email address/i), 'x');

      expect(screen.getByRole('button', { name: /admin/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('signs in with the autofilled credentials', async () => {
      const user = userEvent.setup();
      authService.login.mockResolvedValue({ access_token: 'token' });
      renderWithAuth(<LoginPage />);
      authService.getMe.mockResolvedValue(USER);

      await user.click(screen.getByRole('button', { name: /researcher/i }));
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() =>
        expect(authService.login).toHaveBeenCalledWith({
          email: 'researcher@promptfence.internal',
          password: 'ResearcherPass123!',
        }),
      );
    });
  });
});

/* ────────────────────────────────── Register ────────────────────────────────── */

describe('Register page', () => {
  async function fillRegister(values: Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>) {
    const user = userEvent.setup();
    const fields = [
      [/full name/i, values.name],
      [/email address/i, values.email],
      [/^password/i, values.password],
      [/confirm password/i, values.confirm],
    ] as const;
    for (const [label, value] of fields) {
      if (!value) continue;
      await user.click(screen.getByLabelText(label));
      await user.paste(value);
    }
    return user;
  }

  const submit = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: /register account/i }));

  it('validates every required field', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterPage />);

    await submit(user);

    expect(await screen.findByText('Full name must be at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it.each([
    ['short1A', 'Password must be at least 8 characters'],
    ['lowercase1', 'Must include at least one uppercase letter'],
    ['NoDigitsHere', 'Must include at least one number'],
    [`A1${'x'.repeat(127)}`, 'Password must be at most 128 characters'],
  ])('enforces the password policy for %j', async (password, message) => {
    renderWithAuth(<RegisterPage />);
    const user = await fillRegister({ name: 'Ada', email: 'ada@example.com', password, confirm: password });

    await submit(user);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only name', async () => {
    renderWithAuth(<RegisterPage />);
    const user = await fillRegister({ name: '   ', email: 'ada@example.com', password: VALID_PASSWORD, confirm: VALID_PASSWORD });

    await submit(user);

    expect(await screen.findByText('Full name must be at least 2 characters')).toBeInTheDocument();
  });

  it('flags mismatched passwords and clears the error when either field is fixed', async () => {
    renderWithAuth(<RegisterPage />);
    const user = await fillRegister({ name: 'Ada', email: 'ada@example.com', password: 'ValidPass123', confirm: 'ValidPass124' });

    await submit(user);
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();

    // Fix it from the *first* field: the confirmation error must update too.
    const password = screen.getByLabelText(/^password/i);
    await user.clear(password);
    await user.type(password, 'ValidPass124');

    await waitFor(() => expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument());
  });

  it('toggles both password fields independently', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterPage />);
    const [first, second] = screen.getAllByRole('button', { name: 'Show password' });

    await user.click(second);

    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'text');
    expect(first).toHaveAttribute('aria-pressed', 'false');
    expect(second).toHaveAttribute('aria-pressed', 'true');
  });

  it('creates the account with trimmed values and shows the confirmation', async () => {
    const pending = deferred();
    authService.register.mockReturnValue(pending.promise);
    renderWithAuth(<RegisterPage />);
    const user = await fillRegister({ name: '  Ada Lovelace ', email: 'ada@example.com', password: VALID_PASSWORD, confirm: VALID_PASSWORD });

    await submit(user);
    expect(await screen.findByRole('button', { name: /creating account/i })).toBeDisabled();
    await act(async () => pending.resolve({ message: 'Registration successful.' }));

    expect(authService.register).toHaveBeenCalledTimes(1);
    expect(authService.register).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: VALID_PASSWORD,
      full_name: 'Ada Lovelace',
    });
    expect(await screen.findByRole('heading', { name: 'Account Created' })).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue to sign in/i })).toHaveAttribute('href', '/auth/login');
  });

  it('keeps the form and shows the server error when registration fails', async () => {
    authService.register.mockRejectedValue(
      new ApiError('An account with this email address already exists', 409, 'ConflictError'),
    );
    renderWithAuth(<RegisterPage />);
    const user = await fillRegister({ name: 'Ada', email: 'ada@example.com', password: VALID_PASSWORD, confirm: VALID_PASSWORD });

    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email address already exists');
    expect(screen.getByRole('button', { name: /register account/i })).toBeEnabled();
    expect(screen.queryByText('Account Created')).not.toBeInTheDocument();
  });

  it('links back to sign in', () => {
    renderWithAuth(<RegisterPage />);
    expect(screen.getByRole('link', { name: /^sign in$/i })).toHaveAttribute('href', '/auth/login');
  });
});

/* ─────────────────────────────── Forgot password ────────────────────────────── */

describe('Forgot password page', () => {
  it('validates the email before calling the API', async () => {
    const user = userEvent.setup();
    renderWithAuth(<ForgotPasswordPage />);

    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/account email/i), 'nope');
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('shows a loading state, then the generic confirmation', async () => {
    const pending = deferred();
    authService.forgotPassword.mockReturnValue(pending.promise);
    const user = userEvent.setup();
    renderWithAuth(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/account email/i), 'ada@example.com');

    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByRole('button', { name: /sending/i })).toBeDisabled();
    await act(async () => pending.resolve({ message: 'ok' }));

    expect(authService.forgotPassword).toHaveBeenCalledWith('ada@example.com');
    expect(await screen.findByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to sign in/i })).toHaveAttribute('href', '/auth/login');
  });

  it('does not claim the email was sent when the request fails', async () => {
    authService.forgotPassword.mockRejectedValue(new ApiError(NETWORK_ERROR_MESSAGE, 0, 'NETWORK_ERROR'));
    const user = userEvent.setup();
    renderWithAuth(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/account email/i), 'ada@example.com');

    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(NETWORK_ERROR_MESSAGE);
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeEnabled();
  });

  it('links back to sign in', () => {
    renderWithAuth(<ForgotPasswordPage />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login');
  });
});

/* ─────────────────────────────── Reset password ─────────────────────────────── */

describe('Reset password page', () => {
  it('blocks submission when the link has no token', () => {
    renderWithAuth(<ResetPasswordPage />);

    expect(screen.getByRole('alert')).toHaveTextContent(/missing a valid reset token/i);
    expect(screen.getByRole('link', { name: /request a new one/i })).toHaveAttribute('href', '/auth/forgot-password');
    expect(screen.getByRole('button', { name: /save new password/i })).toBeDisabled();
    expect(screen.getByLabelText(/^new password/i)).toBeDisabled();
  });

  describe('with a token', () => {
    beforeEach(() => {
      nav.searchParams = new URLSearchParams('token=reset-token-123');
    });

    async function fillReset(password: string, confirm: string) {
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/^new password/i), password);
      await user.type(screen.getByLabelText(/confirm new password/i), confirm);
      return user;
    }

    it('validates policy and confirmation', async () => {
      renderWithAuth(<ResetPasswordPage />);
      const user = await fillReset('weakpass', 'different');

      await user.click(screen.getByRole('button', { name: /save new password/i }));

      expect(await screen.findByText('Must include at least one uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('resets the password, replaces history with sign-in and stays locked', async () => {
      authService.resetPassword.mockResolvedValue({ message: 'ok' });
      renderWithAuth(<ResetPasswordPage />);
      const user = await fillReset(VALID_PASSWORD, VALID_PASSWORD);

      await user.click(screen.getByRole('button', { name: /save new password/i }));

      await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/auth/login'));
      expect(authService.resetPassword).toHaveBeenCalledWith({ token: 'reset-token-123', new_password: VALID_PASSWORD });
      expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
    });

    it('explains a rejected token and offers a new link', async () => {
      authService.resetPassword.mockRejectedValue(
        new ApiError('Password reset token has expired', 422, 'ValidationError'),
      );
      renderWithAuth(<ResetPasswordPage />);
      const user = await fillReset(VALID_PASSWORD, VALID_PASSWORD);

      await user.click(screen.getByRole('button', { name: /save new password/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Password reset token has expired');
      expect(within(alert).getByRole('link', { name: /request a new one/i })).toHaveAttribute('href', '/auth/forgot-password');
      expect(screen.getByRole('button', { name: /save new password/i })).toBeEnabled();
    });

    it('toggles both password fields independently', async () => {
      const user = userEvent.setup();
      renderWithAuth(<ResetPasswordPage />);
      const [first] = screen.getAllByRole('button', { name: 'Show password' });

      await user.click(first);

      expect(screen.getByLabelText(/^new password/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/confirm new password/i)).toHaveAttribute('type', 'password');
    });
  });
});

/* ──────────────────────────────── Verify email ──────────────────────────────── */

describe('Verify email page', () => {
  it('explains a link without a token', () => {
    renderWithAuth(<VerifyEmailPage />);
    expect(screen.getByRole('heading', { name: /verification failed/i })).toBeInTheDocument();
    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });

  it('verifies the token exactly once, even under React Strict Mode', async () => {
    nav.searchParams = new URLSearchParams('token=verify-123');
    authService.verifyEmail.mockResolvedValue({ message: 'ok' });

    renderWithAuth(
      <React.StrictMode>
        <VerifyEmailPage />
      </React.StrictMode>,
    );

    expect(await screen.findByRole('heading', { name: /email verified/i })).toBeInTheDocument();
    expect(authService.verifyEmail).toHaveBeenCalledTimes(1);
    expect(authService.verifyEmail).toHaveBeenCalledWith('verify-123');
    expect(screen.getByRole('link', { name: /continue to sign in/i })).toHaveAttribute('href', '/auth/login');
  });

  it('shows the server reason when verification fails', async () => {
    nav.searchParams = new URLSearchParams('token=used');
    authService.verifyEmail.mockRejectedValue(
      new ApiError('Verification token has already been used', 422, 'ValidationError'),
    );

    renderWithAuth(<VerifyEmailPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Verification token has already been used');
  });
});

/* ───────────────────────────── Session management ───────────────────────────── */

describe('Session handling', () => {
  function SessionProbe() {
    const { isAuthenticated, isLoading, logout } = useAuth();
    if (isLoading) return <p>loading</p>;
    return (
      <div>
        <p>{isAuthenticated ? 'signed-in' : 'signed-out'}</p>
        <button type="button" onClick={() => logout()}>
          log out
        </button>
      </div>
    );
  }

  it('clears cached server data and returns to sign-in on logout', async () => {
    authService.getMe.mockResolvedValue(USER);
    const user = userEvent.setup();
    const { queryClient } = renderWithAuth(<SessionProbe />);
    await screen.findByText('signed-in');
    queryClient.setQueryData(['targets'], [{ id: 'previous-user-target' }]);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/auth/login'));
    expect(screen.getByText('signed-out')).toBeInTheDocument();
    expect(queryClient.getQueryData(['targets'])).toBeUndefined();
  });

  it('signs the user out locally when the API reports an unrecoverable session', async () => {
    authService.getMe.mockResolvedValue(USER);
    const { queryClient } = renderWithAuth(<SessionProbe />);
    await screen.findByText('signed-in');
    queryClient.setQueryData(['findings'], [{ id: 'cached' }]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ detail: 'Refresh token has expired' }), { status: 401 })),
    );
    await act(async () => {
      await apiClient('/api/v1/findings').catch(() => undefined);
    });

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
    expect(queryClient.getQueryData(['findings'])).toBeUndefined();
  });

  it('redirects unauthenticated visitors of protected pages to sign-in, keeping their destination', async () => {
    window.history.replaceState({}, '', '/findings/f-42?tab=evidence');

    renderWithAuth(
      <DashboardLayout>
        <p>secret dashboard</p>
      </DashboardLayout>,
    );

    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/auth/login?next=%2Ffindings%2Ff-42%3Ftab%3Devidence'),
    );
    expect(screen.queryByText('secret dashboard')).not.toBeInTheDocument();
  });
});
