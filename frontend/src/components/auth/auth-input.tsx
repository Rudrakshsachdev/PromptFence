import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

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
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-[13px] font-medium text-neutral-800 select-none"
          >
            {label}
            {required && (
              <span className="text-red-500 font-normal ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        </div>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-lg border border-neutral-200/90 bg-white px-3.5 py-2 text-[14px] text-neutral-900',
              'placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150',
              'hover:border-neutral-300 focus-visible:outline-none focus-visible:border-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950/10',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500',
              'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500/10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            {...props}
          />
        </div>
        {helperText && !error && (
          <p id={`${id}-helper`} className="text-[12px] text-neutral-500 leading-normal">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-[12px] font-medium text-red-600 pt-0.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
