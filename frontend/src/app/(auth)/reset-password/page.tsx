'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/components/forms/form-field';
import { PasswordInput } from '@/components/forms/password-input';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirm_password: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordVal = watch('new_password');

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error('Missing reset token in URL parameters');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        token,
        new_password: data.new_password,
      });
      toast.success('Password updated successfully! Please sign in.');
      router.push('/login');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to reset password');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Set a new password</h2>
        <p className="text-[13px] text-muted-foreground">Choose a strong password you haven&apos;t used before.</p>
      </div>

      {!token && (
        <div role="alert" className="flex gap-2.5 rounded-md border border-warning/25 bg-warning/5 px-3 py-2.5 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            This link has no reset token. Open the link from your recovery email, or{' '}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              request a new one
            </Link>
            .
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          label="New Password"
          id="new_password"
          error={errors.new_password?.message}
          required
          helperText="At least 8 characters, including an uppercase letter and a number."
        >
          <PasswordInput
            id="new_password"
            placeholder="••••••••••••"
            showStrength
            value={passwordVal}
            aria-invalid={!!errors.new_password}
            {...register('new_password')}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Confirm New Password" id="confirm_password" error={errors.confirm_password?.message} required>
          <PasswordInput
            id="confirm_password"
            placeholder="••••••••••••"
            aria-invalid={!!errors.confirm_password}
            {...register('confirm_password')}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
            </>
          ) : (
            <>
              <KeyRound className="h-3.5 w-3.5" /> Save new password
            </>
          )}
        </Button>
      </form>

      <div className="border-t border-border pt-4 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
