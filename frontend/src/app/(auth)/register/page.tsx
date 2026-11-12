'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordVal = watch('password');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      });
      setIsSuccess(true);
      toast.success('Registration successful!');
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
      <div className="space-y-4 text-center py-4">
        <div className="h-12 w-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
          ✓
        </div>
        <h3 className="text-lg font-bold text-slate-900">Account Created</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          We have sent an email verification link to your inbox. Please verify your address to activate your security testing privileges.
        </p>
        <div className="pt-4">
          <Button asChild className="w-full">
            <Link href="/login">Proceed to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Create Account</h2>
        <p className="text-xs text-muted-foreground">
          Register to begin security evaluation and target testing
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Full Name" id="full_name" error={errors.full_name?.message} required>
          <Input
            id="full_name"
            placeholder="Alice Researcher"
            {...register('full_name')}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Email Address" id="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="alice@example.com"
            {...register('email')}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Password" id="password" error={errors.password?.message} required>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            showStrength
            value={passwordVal}
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
            placeholder="••••••••"
            {...register('confirm_password')}
            disabled={isLoading}
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Register'}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="text-teal-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

