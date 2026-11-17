import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import RegisterPage from '@/app/(auth)/register/page';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';
import { AuthProvider } from '@/providers/auth-provider';

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn().mockResolvedValue({ access_token: 'mock-token' }),
    register: vi.fn().mockResolvedValue({ message: 'Success' }),
    forgotPassword: vi.fn().mockResolvedValue({ message: 'Success' }),
    getMe: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
  },
}));

describe('Authentication Pages', () => {
  it('renders login form and inputs', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('correctly toggles password visibility on login page', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /show value/i });
    expect(toggleButton).toBeInTheDocument();

    // Click to reveal password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide value/i })).toBeInTheDocument();

    // Click again to hide password
    fireEvent.click(screen.getByRole('button', { name: /hide value/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /show value/i })).toBeInTheDocument();
  });

  it('renders registration form with password confirmation', () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('correctly toggles password visibility on registration page', () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );

    const toggleButtons = screen.getAllByRole('button', { name: /show value/i });
    expect(toggleButtons.length).toBe(2);

    // Toggle main password
    fireEvent.click(toggleButtons[0]);
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'text');

    // Toggle confirm password
    fireEvent.click(toggleButtons[1]);
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'text');
  });

  it('renders forgot password form', () => {
    render(
      <AuthProvider>
        <ForgotPasswordPage />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/account email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });
});
