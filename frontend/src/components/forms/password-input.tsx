'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends InputProps {
  showStrength?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, value, showStrength = false, onChange, ...props }, ref) => {
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

    const val = typeof value === 'string' ? value : '';
    const strength = calculateStrength(val);

    return (
      <div className="space-y-1.5">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            className={cn('pr-10', className)}
            ref={ref}
            value={value}
            onChange={onChange}
            {...props}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {showStrength && val.length > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  strength <= 25 && 'bg-red-500 w-1/4',
                  strength === 50 && 'bg-amber-500 w-2/4',
                  strength === 75 && 'bg-blue-500 w-3/4',
                  strength === 100 && 'bg-emerald-500 w-full'
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground flex justify-between">
              <span>Password strength:</span>
              <span className="font-medium">
                {strength <= 25 && 'Weak'}
                {strength === 50 && 'Fair'}
                {strength === 75 && 'Good'}
                {strength === 100 && 'Strong'}
              </span>
            </p>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

