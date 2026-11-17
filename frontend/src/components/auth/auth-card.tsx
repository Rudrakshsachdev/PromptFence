import React from 'react';
import { cn } from '@/lib/utils';

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AuthCard({ className, children, ...props }: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full max-w-[420px] rounded-xl sm:rounded-2xl border border-neutral-200/90 bg-white p-7 sm:p-9 shadow-sm transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
