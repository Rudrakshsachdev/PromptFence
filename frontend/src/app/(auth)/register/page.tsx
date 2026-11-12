'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { PasswordInput } from '@/components/forms/password-input';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      });
      setIsSuccess(true);
      toast.success('Registration completed successfully');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Registration failed');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Account Created</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Your security researcher profile has been registered. You can now sign in to the portal.
          </p>
        </div>
        <Button asChild size="sm" className="w-full h-9 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white">
          <Link href="/login">Proceed to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create Researcher Account
        </h2>
        <p className="text-xs text-slate-500">
          Join the PromptFence adversarial security testing platform
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <FormField label="Full Name" id="full_name" error={errors.full_name?.message} required>
          <Input
            id="full_name"
            placeholder="Dr. Alex Rivera"
            {...register('full_name')}
            disabled={isLoading}
            className="h-9 text-xs"
          />
        </FormField>

        <FormField label="Work Email Address" id="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="alex.rivera@organization.com"
            {...register('email')}
            disabled={isLoading}
            className="h-9 text-xs"
          />
        </FormField>

        <FormField
          label="Password"
          id="password"
          error={errors.password?.message}
          required
          helperText="Min. 8 characters with 1 uppercase letter and 1 number."
        >
          <PasswordInput
            id="password"
            placeholder="••••••••••••"
            {...register('password')}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Confirm Password"
          id="confirm_password"
          error={errors.confirm_password?.message}
          required
        >
          <PasswordInput
            id="confirm_password"
            placeholder="••••••••••••"
            {...register('confirm_password')}
            disabled={isLoading}
          />
        </FormField>

        <Button
          type="submit"
          className="w-full h-9 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Registering Account...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Register Account
            </span>
          )}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
