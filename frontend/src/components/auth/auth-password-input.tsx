import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
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

    // Destructure out any 'type' passed in props so it cannot overwrite the dynamic toggle state
    const { type: _typeProp, ...restProps } = props;

    const calculateStrength = (pass: string) => {
      let score = 0;
      if (!pass) return score;
      if (pass.length >= 8) score += 1;
      if (/[A-Z]/.test(pass)) score += 1;
      if (/[0-9]/.test(pass)) score += 1;
      if (/[^A-Za-z0-9]/.test(pass)) score += 1;
      return score;
    };

    const val =
      typeof strengthValue === 'string'
        ? strengthValue
        : typeof props.value === 'string'
        ? props.value
        : '';
    const score = calculateStrength(val);

    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score] || '';
    const strengthColor =
      ['', 'text-rose-600', 'text-amber-600', 'text-blue-600', 'text-emerald-600'][score] || '';

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setShowPassword((prev) => !prev);
    };

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
        <div className="relative flex items-center">
          <input
            id={id}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'flex h-10 w-full rounded-lg border border-neutral-200/90 bg-white pl-3.5 pr-11 py-2 text-[14px] text-neutral-900',
              'placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150',
              'hover:border-neutral-300 focus-visible:outline-none focus-visible:border-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950/10',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500',
              'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500/10',
              className
            )}
            aria-invalid={!!error}
            aria-required={required || undefined}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            {...restProps}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            onClick={handleToggle}
            onMouseDown={(e) => {
              // Keep focus (and the caret position) in the input on pointer toggles
              e.preventDefault();
            }}
            // Toggle-button pattern: a stable name, with state exposed via aria-pressed
            aria-label="Show password"
            aria-pressed={showPassword}
            aria-controls={id}
            disabled={restProps.disabled}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 pointer-events-none" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4 pointer-events-none" aria-hidden="true" />
            )}
          </button>
        </div>

        {showStrength && val.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((step) => {
                const isActive = score >= step;
                return (
                  <div
                    key={step}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      isActive
                        ? score === 1
                          ? 'bg-rose-500'
                          : score === 2
                          ? 'bg-amber-500'
                          : score === 3
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                        : 'bg-neutral-100'
                    )}
                  />
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[11px] text-neutral-500">
              <span>Security score:</span>
              <span className={cn('font-semibold', strengthColor)}>
                {strengthLabel}
              </span>
            </div>
          </div>
        )}

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

AuthPasswordInput.displayName = 'AuthPasswordInput';
