'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Terminal, Shield, Check, ShieldAlert } from 'lucide-react';
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
  {
    role: 'Admin',
    badge: 'Full Access',
    email: 'admin@promptfence.internal',
    password: 'AdminSecurePass123!',
    icon: ShieldAlert,
  },
  {
    role: 'Researcher',
    badge: 'Security Lead',
    email: 'researcher@promptfence.internal',
    password: 'ResearcherPass123!',
    icon: Shield,
  },
];
const SHOW_SEED_ACCOUNTS = process.env.NODE_ENV !== 'production';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);

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

  const handleFillCredentials = (email: string, pass: string, role: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setSelectedSeed(role);
    toast.info(`Filled ${role} test credentials`);
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
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950 focus:ring-offset-0 transition-colors cursor-pointer"
            />
            <span className="text-[13px] text-neutral-600 group-hover:text-neutral-900 transition-colors">
              Remember me
            </span>
          </label>

          <Link
            href="/forgot-password"
            className="text-[13px] font-medium text-neutral-600 hover:text-neutral-950 transition-colors underline-offset-4 hover:underline"
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

      {/* Integrated Developer Sandbox Utility Panel */}
      {SHOW_SEED_ACCOUNTS && (
        <div className="mt-6 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 transition-all">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-neutral-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                Development Accounts
              </span>
            </div>
            <span className="text-[10.5px] font-medium text-neutral-400">
              Click to autofill
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SEED_ACCOUNTS.map((acct) => {
              const isSelected = selectedSeed === acct.role;
              return (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => handleFillCredentials(acct.email, acct.password, acct.role)}
                  className={`group relative flex flex-col rounded-lg border p-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
                    isSelected
                      ? 'border-neutral-950 bg-white shadow-xs'
                      : 'border-neutral-200/90 bg-white hover:border-neutral-400 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-neutral-900 group-hover:text-neutral-950">
                      {acct.role}
                    </span>
                    {isSelected ? (
                      <Check className="h-3 w-3 text-neutral-900" />
                    ) : (
                      <span className="rounded bg-neutral-100 px-1 py-0.2 text-[9px] font-medium text-neutral-500">
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
        <Link href="/register" className="font-semibold text-neutral-950 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
