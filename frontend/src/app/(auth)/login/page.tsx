'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { PasswordInput } from '@/components/forms/password-input';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Local seed accounts. Offered only outside production builds. */
const SEED_ACCOUNTS = [
  { label: 'Admin', email: 'admin@promptfence.internal', password: 'AdminSecurePass123!' },
  { label: 'Researcher', email: 'researcher@promptfence.internal', password: 'ResearcherPass123!' },
];
const SHOW_SEED_ACCOUNTS = process.env.NODE_ENV !== 'production';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Sign in</h2>
        <p className="text-[13px] text-muted-foreground">Use your PromptFence account credentials.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Email Address" id="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="you@organization.com"
            aria-invalid={!!errors.email}
            {...register('email')}
            disabled={isLoading}
            autoComplete="email"
          />
        </FormField>

        <div className="space-y-1.5">
          <FormField label="Password" id="password" error={errors.password?.message} required>
            <PasswordInput
              id="password"
              placeholder="••••••••••••"
              aria-invalid={!!errors.password}
              {...register('password')}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </FormField>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Authenticating…
            </>
          ) : (
            <>
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </>
          )}
        </Button>
      </form>

      {SHOW_SEED_ACCOUNTS && (
        <div className="rounded-md border border-dashed border-border bg-surface/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="eyebrow">Development seed accounts</p>
            <span className="text-[10px] text-subtle-foreground">Click to fill</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SEED_ACCOUNTS.map((acct) => (
              <button
                key={acct.email}
                type="button"
                onClick={() => handleFillCredentials(acct.email, acct.password)}
                className="min-w-0 rounded-md border border-border bg-card px-2.5 py-2 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <span className="block text-xs font-medium text-foreground">{acct.label}</span>
                <span className="block truncate font-mono text-[10px] text-subtle-foreground">{acct.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
        Need an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
