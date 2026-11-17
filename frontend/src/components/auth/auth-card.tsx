import React from 'react';
import { cn } from '@/lib/utils';

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AuthCard({ className, children, ...props }: AuthCardProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-[440px] rounded-2xl border border-neutral-200/80 bg-white p-7 sm:p-9',
        'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
        'ring-1 ring-neutral-900/[0.03] transition-all',
        className
      )}
      {...props}
    >
      {/* Subtle top interior highlight line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] rounded-t-2xl bg-gradient-to-r from-transparent via-neutral-900/10 to-transparent"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
