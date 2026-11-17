'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';
import { AuthCard, AuthHeader, AuthPasswordInput, AuthButton } from '@/components/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: '',
      confirm_password: '',
    },
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
    <AuthCard>
      <AuthHeader
        title="Set a new password"
        description="Choose a strong password you haven't used before."
        showLogo
      />

      {!token && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/80 p-3.5 text-[12.5px] text-amber-800"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            This link is missing a valid reset token. Open the link from your recovery email, or{' '}
            <Link href="/forgot-password" className="font-semibold text-neutral-950 underline underline-offset-2">
              request a new one
            </Link>
            .
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthPasswordInput
          id="new_password"
          label="New Password"
          placeholder="••••••••••••"
          showStrength
          strengthValue={passwordVal}
          autoComplete="new-password"
          required
          helperText="At least 8 characters, including 1 uppercase letter and 1 number."
          disabled={isLoading}
          error={errors.new_password?.message}
          {...register('new_password')}
        />

        <AuthPasswordInput
          id="confirm_password"
          label="Confirm New Password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
          disabled={isLoading}
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <div className="pt-2">
          <AuthButton type="submit" isLoading={isLoading} loadingText="Updating…">
            <span>Save new password</span>
            <ArrowRight className="h-4 w-4" />
          </AuthButton>
        </div>
      </form>

      <div className="mt-6 border-t border-neutral-100 pt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to sign in</span>
        </Link>
      </div>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <div className="space-y-4 py-4" aria-busy="true">
            <Skeleton className="mx-auto h-8 w-8 rounded-full" />
            <Skeleton className="mx-auto h-6 w-48" />
            <Skeleton className="mx-auto h-4 w-64" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </AuthCard>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
