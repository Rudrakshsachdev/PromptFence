'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthPasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  showStrength?: boolean;
  strengthValue?: string;
}

export const AuthPasswordInput = React.forwardRef<HTMLInputElement, AuthPasswordInputProps>(
  (
    {
      label,
      id,
      error,
      helperText,
      required,
      showStrength = false,
      strengthValue,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const calculateStrength = (pass: string) => {
      let score = 0;
      if (!pass) return score;
      if (pass.length >= 8) score += 25;
      if (/[A-Z]/.test(pass)) score += 25;
      if (/[0-9]/.test(pass)) score += 25;
      if (/[^A-Za-z0-9]/.test(pass)) score += 25;
      return score;
    };

    const val = typeof strengthValue === 'string' ? strengthValue : typeof props.value === 'string' ? props.value : '';
    const strength = calculateStrength(val);

    return (
      <div className="space-y-1.5 text-left">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-neutral-800 select-none"
        >
          {label} {required && <span className="text-red-500 font-normal" aria-hidden="true">*</span>}
        </label>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'flex h-10 w-full rounded-md border border-neutral-200 bg-white pl-3.5 pr-10 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:border-neutral-950 focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            {...props}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide value' : 'Show value'}
            title={showPassword ? 'Hide text' : 'Show text'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>

        {showStrength && val.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  strength <= 25 && 'bg-red-500 w-1/4',
                  strength === 50 && 'bg-amber-500 w-2/4',
                  strength === 75 && 'bg-blue-500 w-3/4',
                  strength === 100 && 'bg-emerald-500 w-full'
                )}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-neutral-500">
              <span>Password strength:</span>
              <span
                className={cn(
                  'font-medium',
                  strength <= 25 && 'text-red-600',
                  strength === 50 && 'text-amber-600',
                  strength === 75 && 'text-blue-600',
                  strength === 100 && 'text-emerald-600'
                )}
              >
                {strength <= 25 && 'Weak'}
                {strength === 50 && 'Fair'}
                {strength === 75 && 'Good'}
                {strength === 100 && 'Strong'}
              </span>
            </div>
          </div>
        )}

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

AuthPasswordInput.displayName = 'AuthPasswordInput';
