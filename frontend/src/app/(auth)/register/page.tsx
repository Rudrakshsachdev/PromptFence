'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Loader2, UserPlus } from 'lucide-react';
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
      <div className="space-y-5 py-2 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-success/30 bg-success/10 text-success">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Account Created</h3>
          <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            Your account has been registered. You can now sign in.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Create Account</h2>
        <p className="text-[13px] text-muted-foreground">Register for access to the PromptFence platform.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Full Name" id="full_name" error={errors.full_name?.message} required>
          <Input
            id="full_name"
            placeholder="Alex Rivera"
            aria-invalid={!!errors.full_name}
            {...register('full_name')}
            disabled={isLoading}
            autoComplete="name"
          />
        </FormField>

        <FormField label="Work Email Address" id="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="alex.rivera@organization.com"
            aria-invalid={!!errors.email}
            {...register('email')}
            disabled={isLoading}
            autoComplete="email"
          />
        </FormField>

        <FormField
          label="Password"
          id="password"
          error={errors.password?.message}
          required
          helperText="At least 8 characters, including an uppercase letter and a number."
        >
          <PasswordInput
            id="password"
            placeholder="••••••••••••"
            aria-invalid={!!errors.password}
            {...register('password')}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Confirm Password" id="confirm_password" error={errors.confirm_password?.message} required>
          <PasswordInput
            id="confirm_password"
            placeholder="••••••••••••"
            aria-invalid={!!errors.confirm_password}
            {...register('confirm_password')}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" /> Register Account
            </>
          )}
        </Button>
      </form>

      <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
