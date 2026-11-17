import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordForm } from '@/app/(dashboard)/settings/_components/change-password-form';

const authService = vi.hoisted(() => ({ changePassword: vi.fn() }));
vi.mock('@/services/auth.service', () => ({ authService }));

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

const controlledWarnings = () =>
  consoleError.mock.calls.filter((args: unknown[]) => /uncontrolled|controlled input/i.test(String(args[0])));

afterEach(() => {
  // React reports an uncontrolled→controlled switch only once per module
  // lifetime (it can happen on first mount), so every test must check for it.
  const warnings = controlledWarnings();
  consoleError.mockRestore();
  expect(warnings).toEqual([]);
});

describe('Settings → Change password', () => {
  it('gives every password field an accessible, independent visibility toggle', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    const toggles = screen.getAllByRole('button', { name: 'Show password' });
    expect(toggles).toHaveLength(3);

    await user.click(toggles[1]);

    expect(screen.getByLabelText(/^new password/i)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/^current password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/^confirm new password/i)).toHaveAttribute('type', 'password');
    expect(toggles[1]).toHaveAttribute('aria-pressed', 'true');
    expect(toggles[1]).toHaveAttribute('aria-controls', 'new_password');
  });

  it('reaches the toggle from the keyboard', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    screen.getByLabelText(/^current password/i).focus();

    await user.tab();

    expect(screen.getAllByRole('button', { name: 'Show password' })[0]).toHaveFocus();
  });

  it('never switches the strength input between uncontrolled and controlled', async () => {
    authService.changePassword.mockResolvedValue({ message: 'ok' });
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/^current password/i), 'OldPass123');
    await user.type(screen.getByLabelText(/^new password/i), 'NewPass1234');
    await user.type(screen.getByLabelText(/^confirm new password/i), 'NewPass1234');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => expect(authService.changePassword).toHaveBeenCalledTimes(1));
    // reset() after success empties the fields without a controlled→uncontrolled flip
    await waitFor(() => expect(screen.getByLabelText(/^new password/i)).toHaveValue(''));
  });

  it('clears the mismatch error when the new password is edited to match', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    await user.type(screen.getByLabelText(/^current password/i), 'OldPass123');
    await user.type(screen.getByLabelText(/^new password/i), 'NewPass1234');
    await user.type(screen.getByLabelText(/^confirm new password/i), 'NewPass1235');
    await user.click(screen.getByRole('button', { name: /update password/i }));
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();

    const newPassword = screen.getByLabelText(/^new password/i);
    await user.clear(newPassword);
    await user.type(newPassword, 'NewPass1235');

    await waitFor(() => expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument());
    expect(authService.changePassword).not.toHaveBeenCalled();
  });
});
