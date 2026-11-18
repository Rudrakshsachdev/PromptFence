'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthHeader,
  AuthPasswordInput,
} from '@/components/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api-client';
import {
  PASSWORDS_DO_NOT_MATCH,
  PASSWORD_POLICY_HINT,
  confirmPasswordSchema,
  getErrorMessage,
  newPasswordSchema,
} from '@/lib/auth-schemas';

const resetPasswordSchema = z
  .object({
    new_password: newPasswordSchema,
    confirm_password: confirmPasswordSchema,
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: PASSWORDS_DO_NOT_MATCH,
    path: ['confirm_password'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const requestNewLink = (
  <Link href="/auth/forgot-password" className="font-semibold text-neutral-950 underline underline-offset-2">
    request a new one
  </Link>
);

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<{ message: string; tokenRejected: boolean } | null>(
    null,
  );

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
    if (!token) return;

    setFormError(null);
    setIsLoading(true);
    try {
      await authService.resetPassword({
        token,
        new_password: data.new_password,
      });
      toast.success('Password updated successfully! Please sign in.');
      // replace(): the single-use token URL should not stay in history, and the
      // form stays locked so the consumed token cannot be submitted twice.
      router.replace('/auth/login');
    } catch (err: unknown) {
      setFormError({
        message: getErrorMessage(err, 'Failed to reset password. Please try again.'),
        // Invalid / used / expired tokens are reported as application 422s.
        tokenRejected: err instanceof ApiError && err.code === 'ValidationError',
      });
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
        <AuthAlert variant="warning">
          This link is missing a valid reset token. Open the link from your recovery email, or{' '}
          {requestNewLink}.
        </AuthAlert>
      )}

      {formError && (
        <AuthAlert>
          {formError.message}
          {formError.tokenRejected && <> You can {requestNewLink}.</>}
        </AuthAlert>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-busy={isLoading || undefined}
      >
        <AuthPasswordInput
          id="new_password"
          label="New Password"
          placeholder="••••••••••••"
          showStrength
          strengthValue={passwordVal}
          autoComplete="new-password"
          required
          helperText={PASSWORD_POLICY_HINT}
          disabled={isLoading || !token}
          error={errors.new_password?.message}
          {...register('new_password', { deps: ['confirm_password'] })}
        />

        <AuthPasswordInput
          id="confirm_password"
          label="Confirm New Password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
          disabled={isLoading || !token}
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <div className="pt-2">
          <AuthButton
            type="submit"
            isLoading={isLoading}
            loadingText="Updating…"
            disabled={!token}
          >
            <span>Save new password</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </AuthButton>
        </div>
      </form>

      <div className="mt-6 border-t border-neutral-100 pt-5 text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
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
          <div className="space-y-4 py-4 [&>*]:bg-neutral-100" aria-busy="true">
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
