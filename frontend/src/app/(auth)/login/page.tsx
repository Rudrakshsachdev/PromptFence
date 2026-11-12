'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Lock, LogIn, ShieldAlert } from 'lucide-react';
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
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign In to Portal
        </h2>
        <p className="text-xs text-slate-500">
          Enter your authorized credentials to access PromptFence
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email Address" id="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="admin@promptfence.internal"
            {...register('email')}
            disabled={isLoading}
            className="h-9 text-xs"
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password" id="password" error={errors.password?.message} required>
          <PasswordInput
            id="password"
            placeholder="••••••••••••"
            {...register('password')}
            disabled={isLoading}
            autoComplete="current-password"
          />
        </FormField>

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-9 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Authenticating...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </span>
          )}
        </Button>
      </form>

      {/* Quick Test Credentials Helper Box for Developer Ease */}
      <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 text-[11px] space-y-1.5">
        <div className="flex items-center justify-between text-slate-700 font-semibold">
          <span>Seed Credentials</span>
          <span className="text-[10px] font-mono text-slate-400">Click to fill</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => handleFillCredentials('admin@promptfence.internal', 'AdminSecurePass123!')}
            className="text-left p-1.5 rounded border border-slate-200/80 bg-white hover:border-teal-500 hover:bg-teal-50/30 transition-colors"
          >
            <p className="font-semibold text-slate-800">Admin</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">admin@promptfence.internal</p>
          </button>
          <button
            type="button"
            onClick={() => handleFillCredentials('researcher@promptfence.internal', 'ResearcherPass123!')}
            className="text-left p-1.5 rounded border border-slate-200/80 bg-white hover:border-teal-500 hover:bg-teal-50/30 transition-colors"
          >
            <p className="font-semibold text-slate-800">Researcher</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">researcher@promptfence.internal</p>
          </button>
        </div>
      </div>

      <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-500">
          Need a security researcher account?{' '}
          <Link href="/register" className="text-teal-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
