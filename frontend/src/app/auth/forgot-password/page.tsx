'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthHeader,
  AuthInput,
  authButtonClasses,
} from '@/components/auth';
import { authService } from '@/services/auth.service';
import { emailSchema, getErrorMessage } from '@/lib/auth-schemas';

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setFormError(null);
    setIsLoading(true);
    try {
      // The API answers identically whether or not the account exists, so the
      // confirmation below never reveals account existence.
      await authService.forgotPassword(data.email);
      setSubmitted(true);
      toast.success('Reset link dispatched if account exists');
    } catch (err: unknown) {
      // Only transport/server failures (offline, rate limit, 5xx) land here.
      // Reporting them does not enumerate accounts; claiming success would
      // tell the user an email is on its way when the request never landed.
      setFormError(getErrorMessage(err, 'We could not send the reset link. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthCard>
        <div className="py-4 text-center flex flex-col items-center" role="status">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200/90 bg-blue-50 text-blue-600 mb-5 shadow-xs">
            <Mail className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Check your email
          </h1>
          <p className="mt-2 text-[13.5px] text-neutral-500 leading-relaxed max-w-xs">
            If an account exists for that address, recovery instructions have been sent. Please check your inbox and spam folder.
          </p>
          <div className="mt-7 w-full">
            <Link href="/auth/login" className={authButtonClasses('outline')}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Return to sign in</span>
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Forgot your password?"
        description="Enter your account email and we'll send you recovery instructions."
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
          label="Account Email"
          type="email"
          placeholder="you@organization.com"
          autoComplete="email"
          required
          disabled={isLoading}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="pt-2">
          <AuthButton type="submit" isLoading={isLoading} loadingText="Sending…">
            <span>Send Reset Link</span>
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
          <span>Remember your password? Sign in</span>
        </Link>
      </div>
    </AuthCard>
  );
}
