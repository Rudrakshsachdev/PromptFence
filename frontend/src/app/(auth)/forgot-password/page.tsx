'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';
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
      <div className="space-y-4 text-center py-6">
        <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-200">
          <Mail className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Check Your Email</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            If an account exists with that address, we have dispatched recovery instructions.
          </p>
        </div>
        <div className="pt-2">
          <Button asChild variant="outline" size="sm" className="w-full h-9 text-xs">
            <Link href="/login">Return to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Recovery
        </h2>
        <p className="text-xs text-slate-500">
          Enter your authorized email to receive recovery instructions
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Account Email" id="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="admin@promptfence.internal"
            {...register('email')}
            disabled={isLoading}
            className="h-9 text-xs"
          />
        </FormField>

        <Button
          type="submit"
          className="w-full h-9 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
          disabled={isLoading}
        >
          {isLoading ? 'Dispatching Instructions...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
        <Link
          href="/login"
          className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 hover:underline"
        >
          <ArrowLeft className="h-3 w-3 mr-1" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
