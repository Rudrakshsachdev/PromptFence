import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthAlertProps {
  variant?: 'error' | 'warning';
  className?: string;
  children: React.ReactNode;
}

const variants = {
  error: {
    box: 'border-red-200/90 bg-red-50/80 text-red-800',
    icon: 'text-red-600',
    Icon: AlertCircle,
  },
  warning: {
    box: 'border-amber-200/90 bg-amber-50/80 text-amber-800',
    icon: 'text-amber-600',
    Icon: AlertTriangle,
  },
} as const;

/**
 * Persistent, screen-reader-announced form message for the auth pages.
 * Unlike a toast it stays visible until the user acts, so the reason a
 * submission failed cannot disappear before it is read.
 */
export function AuthAlert({ variant = 'error', className, children }: AuthAlertProps) {
  const { box, icon, Icon } = variants[variant];
  return (
    <div
      role="alert"
      className={cn(
        'mb-5 flex items-start gap-2.5 rounded-xl border p-3.5 text-[12.5px] text-left',
        box,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', icon)} aria-hidden="true" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
