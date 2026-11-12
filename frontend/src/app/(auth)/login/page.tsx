'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Sign In</h2>
        <p className="text-xs text-muted-foreground">
          Enter your credentials to access the security testing lab
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email Address" id="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="researcher@promptfence.local"
            {...register('email')}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Password" id="password" error={errors.password?.message} required>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            {...register('password')}
            disabled={isLoading}
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Authenticating...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-teal-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

