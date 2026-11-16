'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
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
      // Same response either way to avoid account enumeration.
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-5 py-2 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-info/30 bg-info/10 text-info">
          <Mail className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Check your email</h3>
          <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            If an account exists for that address, recovery instructions have been sent.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Return to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Reset your password</h2>
        <p className="text-[13px] text-muted-foreground">
          Enter your account email and we&apos;ll send recovery instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Account Email" id="email" error={errors.email?.message} required>
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
            </>
          ) : (
            'Send Reset Link'
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
