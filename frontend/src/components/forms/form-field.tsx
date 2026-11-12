import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  description?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  id,
  error,
  description,
  helperText,
  required,
  children,
  className,
}: FormFieldProps) {
  const note = description || helperText;
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      </div>
      {children}
      {note && !error && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{note}</p>
      )}
      {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}
    </div>
  );
}
