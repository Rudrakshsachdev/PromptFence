'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, MailWarning } from 'lucide-react';
import { AuthCard, authButtonClasses } from '@/components/auth';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/auth-schemas';

type VerifyState =
  | { status: 'verifying' }
  | { status: 'success' }
  | { status: 'error'; message: string };

function StatusCard({
  icon,
  tone,
  title,
  children,
}: {
  icon: React.ReactNode;
  tone: 'neutral' | 'success' | 'error';
  title: string;
  children: React.ReactNode;
}) {
  const toneClasses = {
    neutral: 'border-neutral-200/90 bg-neutral-50 text-neutral-600',
    success: 'border-emerald-200/90 bg-emerald-50 text-emerald-600',
    error: 'border-red-200/90 bg-red-50 text-red-600',
  }[tone];

  return (
    <AuthCard>
      <div className="py-4 text-center flex flex-col items-center">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl border mb-5 shadow-xs ${toneClasses}`}
        >
          {icon}
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">{title}</h1>
        {children}
      </div>
    </AuthCard>
  );
}

function VerifyEmailContent() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<VerifyState>(
    token ? { status: 'verifying' } : { status: 'error', message: 'This verification link is missing its token.' },
  );
  // Verification tokens are single-use. React Strict Mode mounts effects twice
  // in development, so guard against consuming the token with a second call.
  const requestedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token || requestedToken.current === token) return;
    requestedToken.current = token;

    authService
      .verifyEmail(token)
      .then(() => setState({ status: 'success' }))
      .catch((err: unknown) =>
        setState({
          status: 'error',
          message: getErrorMessage(err, 'We could not verify your email address.'),
        }),
      );
  }, [token]);

  if (state.status === 'verifying') {
    return (
      <StatusCard
        tone="neutral"
        title="Verifying your email"
        icon={<Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />}
      >
        <p className="mt-2 text-[13.5px] text-neutral-500" role="status">
          Confirming your verification link…
        </p>
      </StatusCard>
    );
  }

  if (state.status === 'success') {
    return (
      <StatusCard
        tone="success"
        title="Email verified"
        icon={<CheckCircle2 className="h-7 w-7" aria-hidden="true" />}
      >
        <p className="mt-2 text-[13.5px] text-neutral-500 leading-relaxed max-w-xs" role="status">
          Your email address has been confirmed. You can now sign in to your PromptFence workspace.
        </p>
        <div className="mt-7 w-full">
          <Link href="/login" className={authButtonClasses('primary')}>
            <span>Continue to sign in</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </StatusCard>
    );
  }

  return (
    <StatusCard
      tone="error"
      title="Verification failed"
      icon={<MailWarning className="h-7 w-7" aria-hidden="true" />}
    >
      <p className="mt-2 text-[13.5px] text-neutral-600 leading-relaxed max-w-xs" role="alert">
        {state.message}
      </p>
      <p className="mt-1 text-[13px] text-neutral-500 leading-relaxed max-w-xs">
        Links expire and can only be used once. If you already verified, simply sign in.
      </p>
      <div className="mt-7 w-full">
        <Link href="/login" className={authButtonClasses('outline')}>
          <span>Go to sign in</span>
        </Link>
      </div>
    </StatusCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <StatusCard
          tone="neutral"
          title="Verifying your email"
          icon={<Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />}
        >
          <p className="mt-2 text-[13.5px] text-neutral-500">Loading…</p>
        </StatusCard>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
