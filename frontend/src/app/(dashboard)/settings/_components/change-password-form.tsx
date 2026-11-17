'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { FormField } from '@/components/forms/form-field';
import { PasswordInput } from '@/components/forms/password-input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { PASSWORDS_DO_NOT_MATCH, newPasswordSchema } from '@/lib/auth-schemas';

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: newPasswordSchema,
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: PASSWORDS_DO_NOT_MATCH,
    path: ['confirm_password'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const EMPTY_VALUES: PasswordFormValues = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

/** Change password (POST /users/me/change-password). Other sessions are signed out by the server. */
export function ChangePasswordForm() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    // Defined defaults keep the watched (controlled) strength input from
    // flipping between uncontrolled and controlled on first input and reset().
    defaultValues: EMPTY_VALUES,
  });

  const newPasswordVal = watch('new_password');

  const onSubmit = async (values: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      reset(EMPTY_VALUES);
      toast.success('Password changed successfully. All other sessions have been logged out.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Current password" id="current_password" error={errors.current_password?.message} required>
        <PasswordInput
          id="current_password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          {...register('current_password')}
          disabled={isChangingPassword}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="New password"
          id="new_password"
          error={errors.new_password?.message}
          required
          helperText="Min. 8 characters with 1 uppercase letter and 1 number."
        >
          <PasswordInput
            id="new_password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            showStrength
            value={newPasswordVal}
            {...register('new_password', { deps: ['confirm_password'] })}
            disabled={isChangingPassword}
          />
        </FormField>
        <FormField label="Confirm new password" id="confirm_password" error={errors.confirm_password?.message} required>
          <PasswordInput
            id="confirm_password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            {...register('confirm_password')}
            disabled={isChangingPassword}
          />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isChangingPassword}>
          <Lock className="h-3.5 w-3.5" />
          {isChangingPassword ? 'Updating password…' : 'Update password'}
        </Button>
      </div>
    </form>
  );
}
