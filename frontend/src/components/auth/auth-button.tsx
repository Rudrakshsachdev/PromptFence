import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AuthButtonVariant = 'primary' | 'outline' | 'ghost';

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: AuthButtonVariant;
  children: React.ReactNode;
}

const baseClasses =
  'inline-flex h-10.5 w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[14px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 select-none';

const variantClasses: Record<AuthButtonVariant, string> = {
  primary:
    'bg-neutral-950 text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-neutral-800 active:scale-[0.99]',
  outline:
    'border border-neutral-200 bg-white text-neutral-900 shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100',
  ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
};

/** Button styling for elements that act like an auth button (e.g. a `<Link>` CTA). */
export function authButtonClasses(variant: AuthButtonVariant = 'primary', className?: string) {
  return cn(baseClasses, variantClasses[variant], className);
}

export function AuthButton({
  isLoading = false,
  loadingText,
  variant = 'primary',
  children,
  className,
  disabled,
  type = 'submit',
  ...props
}: AuthButtonProps) {
  return (
    <button
      type={type}
      className={authButtonClasses(variant, className)}
      disabled={isLoading || disabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-current opacity-80" aria-hidden="true" />
          <span>{loadingText || 'Please wait…'}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
