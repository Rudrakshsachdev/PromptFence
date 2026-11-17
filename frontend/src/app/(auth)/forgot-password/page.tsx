'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail } from 'lucide-react';
import { AuthCard, AuthHeader, AuthInput, AuthButton } from '@/components/auth';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSubmitted(true);
      toast.success('Reset link dispatched if account exists');
    } catch {
      // Uniform response to avoid account enumeration
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthCard>
        <div className="py-2 text-center flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 mb-4">
            <Mail className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed max-w-xs">
            If an account exists for that address, recovery instructions have been sent. Please check your inbox and spam folder.
          </p>
          <div className="mt-6 w-full">
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 shadow-xs transition-all hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              Return to sign in
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
            Send Reset Link
          </AuthButton>
        </div>
      </form>

      <div className="mt-6 border-t border-neutral-100 pt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to sign in</span>
        </Link>
      </div>
    </AuthCard>
  );
}
