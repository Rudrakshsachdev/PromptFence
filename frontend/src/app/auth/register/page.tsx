'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthHeader,
  AuthInput,
  AuthPasswordInput,
  authButtonClasses,
} from '@/components/auth';
import { useAuth, useRedirectIfAuthenticated } from '@/hooks/use-auth';
import {
  PASSWORDS_DO_NOT_MATCH,
  PASSWORD_POLICY_HINT,
  confirmPasswordSchema,
  emailSchema,
  fullNameSchema,
  getErrorMessage,
  newPasswordSchema,
} from '@/lib/auth-schemas';

const registerSchema = z
  .object({
    full_name: fullNameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirm_password: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirm_password, {
    message: PASSWORDS_DO_NOT_MATCH,
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  useRedirectIfAuthenticated();
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      });
      setRegisteredEmail(data.email);
      toast.success('Registration completed successfully');
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <AuthCard>
        <div className="py-4 text-center flex flex-col items-center" role="status">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200/90 bg-emerald-50 text-emerald-600 mb-5 shadow-xs">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Account Created
          </h1>
          <p className="mt-2 text-[13.5px] text-neutral-500 leading-relaxed max-w-xs">
            Your PromptFence account has been provisioned. We&apos;ve sent a verification link to{' '}
            <span className="font-medium text-neutral-800 break-all">{registeredEmail}</span>. You
            can sign in to your security testing lab now.
          </p>
          <div className="mt-7 w-full">
            <Link href="/auth/login" className={authButtonClasses('primary')}>
              <span>Continue to sign in</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
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

      {formError && <AuthAlert>{formError}</AuthAlert>}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-busy={isLoading || undefined}
      >
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
          helperText={PASSWORD_POLICY_HINT}
          disabled={isLoading}
          error={errors.password?.message}
          {...register('password', { deps: ['confirm_password'] })}
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
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </AuthButton>
        </div>
      </form>

      <p className="mt-6 border-t border-neutral-100 pt-5 text-center text-[13px] text-neutral-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-neutral-950 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
