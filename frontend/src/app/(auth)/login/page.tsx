'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { AuthCard, AuthHeader, AuthInput, AuthPasswordInput, AuthButton } from '@/components/auth';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Local seed accounts for convenient development testing. */
const SEED_ACCOUNTS = [
  { label: 'Admin', email: 'admin@promptfence.internal', password: 'AdminSecurePass123!' },
  { label: 'Researcher', email: 'researcher@promptfence.internal', password: 'ResearcherPass123!' },
];
const SHOW_SEED_ACCOUNTS = process.env.NODE_ENV !== 'production';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success('Authenticated successfully');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Invalid email or password');
      } else {
        toast.error('An unexpected login error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Welcome back"
        description="Sign in to your PromptFence security testing lab"
        showLogo
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthInput
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@organization.com"
          autoComplete="email"
          required
          disabled={isLoading}
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthPasswordInput
          id="password"
          label="Password"
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
          disabled={isLoading}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950 focus:ring-offset-0"
            />
            <span className="text-xs text-neutral-600">Remember me</span>
          </label>

          <Link
            href="/forgot-password"
            className="text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <AuthButton type="submit" isLoading={isLoading} loadingText="Signing in…">
          <LogIn className="h-4 w-4" />
          <span>Sign In</span>
        </AuthButton>
      </form>

      {SHOW_SEED_ACCOUNTS && (
        <div className="mt-6 rounded-lg border border-neutral-200/90 bg-neutral-50/80 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
              Development Accounts
            </p>
            <span className="text-[10px] text-neutral-400">Click to fill</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SEED_ACCOUNTS.map((acct) => (
              <button
                key={acct.email}
                type="button"
                onClick={() => handleFillCredentials(acct.email, acct.password)}
                className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-left transition-all hover:border-neutral-400 hover:shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950"
              >
                <span className="block text-xs font-semibold text-neutral-900">{acct.label}</span>
                <span className="block truncate font-mono text-[10px] text-neutral-500">
                  {acct.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 border-t border-neutral-100 pt-5 text-center text-xs text-neutral-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-neutral-950 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
