'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center py-4">
        <h3 className="text-lg font-bold text-slate-900">Check Your Email</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          If an account exists with that email address, we have sent instructions to reset your password.
        </p>
        <div className="pt-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Return to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Reset Password</h2>
        <p className="text-xs text-muted-foreground">
          Enter your email to receive recovery instructions
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Account Email" id="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="researcher@promptfence.local"
            {...register('email')}
            disabled={isLoading}
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending Request...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
        <Link href="/login" className="text-xs text-slate-500 hover:text-slate-800 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

