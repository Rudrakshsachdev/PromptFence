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
        <Label htmlFor={id} className="text-xs font-medium text-foreground">
          {label} {required && <span className="text-critical" aria-hidden>*</span>}
        </Label>
      </div>
      {children}
      {note && !error && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{note}</p>
      )}
      {error && (
        <p role="alert" className="text-[11px] font-medium text-critical">
          {error}
        </p>
      )}
    </div>
  );
}
