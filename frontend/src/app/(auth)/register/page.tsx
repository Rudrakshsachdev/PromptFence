'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthCard, AuthHeader, AuthInput, AuthPasswordInput, AuthButton } from '@/components/auth';
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
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
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
      <AuthCard>
        <div className="py-4 text-center flex flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200/90 bg-emerald-50 text-emerald-600 mb-5 shadow-xs">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
            Account Created
          </h2>
          <p className="mt-2 text-[13.5px] text-neutral-500 leading-relaxed max-w-xs">
            Your PromptFence account has been provisioned. You can now access your security testing lab workspace.
          </p>
          <div className="mt-7 w-full">
            <Link
              href="/login"
              className="inline-flex h-10.5 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              <span>Continue to sign in</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Create your account"
        description="Start testing your AI applications against prompt injection and jailbreaks"
        showLogo
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthInput
          id="full_name"
          label="Full Name"
          type="text"
          placeholder="Alex Rivera"
          autoComplete="name"
          required
          disabled={isLoading}
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <AuthInput
          id="email"
          label="Work Email Address"
          type="email"
          placeholder="alex.rivera@organization.com"
          autoComplete="email"
          required
          disabled={isLoading}
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthPasswordInput
          id="password"
          label="Password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
          showStrength
          strengthValue={passwordVal}
          helperText="At least 8 characters, with 1 uppercase letter and 1 number."
          disabled={isLoading}
          error={errors.password?.message}
          {...register('password')}
        />

        <AuthPasswordInput
          id="confirm_password"
          label="Confirm Password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
          disabled={isLoading}
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <div className="pt-2">
          <AuthButton type="submit" isLoading={isLoading} loadingText="Creating account…">
            <span>Register Account</span>
            <ArrowRight className="h-4 w-4" />
          </AuthButton>
        </div>
      </form>

      <p className="mt-6 border-t border-neutral-100 pt-5 text-center text-[13px] text-neutral-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-neutral-950 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
