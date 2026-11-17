import React from 'react';
import { cn } from '@/lib/utils';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, id, error, helperText, required, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 text-left">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-neutral-800 select-none"
        >
          {label} {required && <span className="text-red-500 font-normal" aria-hidden="true">*</span>}
        </label>
        <input
          id={id}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:border-neutral-950 focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />
        {helperText && !error && (
          <p id={`${id}-helper`} className="text-[11px] text-neutral-500 leading-normal">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="text-[12px] font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
