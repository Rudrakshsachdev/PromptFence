'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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

export default function ResetPasswordPage() {
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
      toast.success('Password updated successfully! Please log in.');
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
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">New Password</h2>
        <p className="text-xs text-muted-foreground">
          Enter and confirm your new secure password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="New Password" id="new_password" error={errors.new_password?.message} required>
          <PasswordInput
            id="new_password"
            placeholder="••••••••"
            showStrength
            value={passwordVal}
            {...register('new_password')}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Confirm New Password"
          id="confirm_password"
          error={errors.confirm_password?.message}
          required
        >
          <PasswordInput
            id="confirm_password"
            placeholder="••••••••"
            {...register('confirm_password')}
            disabled={isLoading}
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Resetting Password...' : 'Save New Password'}
        </Button>
      </form>
    </div>
  );
}

