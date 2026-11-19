'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Terminal, Shield, Check, ShieldAlert, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthHeader,
  AuthInput,
  AuthPasswordInput,
} from '@/components/auth';
import { useAuth, useRedirectIfAuthenticated } from '@/hooks/use-auth';
import { getRedirectFromLocation } from '@/lib/auth-redirect';
import { emailSchema, getErrorMessage } from '@/lib/auth-schemas';

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Local development accounts, one per backend role (admin, security_researcher,
 * viewer). Seeded by backend/scripts/seed.py and create_test_users.py.
 * Declared behind the NODE_ENV check so production bundles carry no credentials.
 */
const SEED_ACCOUNTS =
  process.env.NODE_ENV !== 'production'
    ? [
        {
          role: 'Admin',
          badge: 'Full access',
          email: 'admin@promptfence.io',
          password: 'AdminPassword123!',
          icon: ShieldAlert,
        },
        {
          role: 'Researcher',
          badge: 'Read & write',
          email: 'researcher@promptfence.io',
          password: 'ResearcherPassword123!',
          icon: Shield,
        },
        {
          role: 'Viewer',
          badge: 'Read-only',
          email: 'viewer@promptfence.io',
          password: 'ViewerPassword123!',
          icon: Eye,
        },
      ]
    : [];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  useRedirectIfAuthenticated();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-warm client navigation cache for post-login destination routes
  useEffect(() => {
    router.prefetch('/overview');
    router.prefetch('/scenarios');
    router.prefetch('/targets');
  }, [router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [emailValue, passwordValue] = watch(['email', 'password']);
  const selectedSeed = SEED_ACCOUNTS.find(
    (acct) => acct.email === emailValue && acct.password === passwordValue,
  )?.role;

  // A failed sign-in message no longer applies once the credentials change.
  useEffect(() => {
    setFormError(null);
  }, [emailValue, passwordValue]);

  const onSubmit = async (data: LoginFormValues) => {
    setFormError(null);
    setIsLoading(true);
    try {
      await login(data, { redirectTo: getRedirectFromLocation() });
      toast.success('Authenticated successfully');
      // Stay locked while the router navigates away so the form cannot be
      // re-submitted (which would open a second session).
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Unable to sign in. Please try again.'));
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (email: string, pass: string, role: string) => {
    setValue('email', email, { shouldValidate: true, shouldDirty: true });
    setValue('password', pass, { shouldValidate: true, shouldDirty: true });
    toast.info(`Filled ${role} test credentials`);
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Welcome back"
        description="Sign in to your PromptFence security testing lab"
        showLogo
      />

      {formError && <AuthAlert>{formError}</AuthAlert>}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-busy={isLoading || undefined}
      >
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

        <div className="flex items-center justify-end pt-0.5">
          <Link
            href="/auth/forgot-password"
            className="rounded-sm text-[13px] font-medium text-neutral-600 hover:text-neutral-950 transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-1.5">
          <AuthButton type="submit" isLoading={isLoading} loadingText="Signing in…">
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </AuthButton>
        </div>
      </form>

      {/* Integrated Developer Sandbox Utility Panel (never rendered in production) */}
      {SEED_ACCOUNTS.length > 0 && (
        <div
          className="mt-6 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 transition-all"
          role="group"
          aria-labelledby="dev-accounts-heading"
        >
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              <span
                id="dev-accounts-heading"
                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600"
              >
                Development Accounts
              </span>
            </div>
            <span className="text-[10.5px] font-medium text-neutral-500">Click to autofill</span>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3">
            {SEED_ACCOUNTS.map((acct) => {
              const isSelected = selectedSeed === acct.role;
              return (
                <button
                  key={acct.email}
                  type="button"
                  disabled={isLoading}
                  aria-pressed={isSelected}
                  onClick={() => handleFillCredentials(acct.email, acct.password, acct.role)}
                  className={`group relative flex min-w-0 flex-col rounded-lg border p-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSelected
                      ? 'border-neutral-950 bg-white shadow-xs'
                      : 'border-neutral-200/90 bg-white hover:border-neutral-400 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12px] font-semibold text-neutral-900 group-hover:text-neutral-950">
                      {acct.role}
                    </span>
                    {isSelected ? (
                      <Check className="h-3 w-3 text-neutral-900" aria-hidden="true" />
                    ) : (
                      <span className="truncate rounded bg-neutral-100 px-1 py-px text-[9px] font-medium text-neutral-500">
                        {acct.badge}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 block truncate font-mono text-[10px] text-neutral-500">
                    {acct.email}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer navigation */}
      <p className="mt-6 border-t border-neutral-100 pt-5 text-center text-[13px] text-neutral-600">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="font-semibold text-neutral-950 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
