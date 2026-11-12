import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  id,
  error,
  description,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      </div>
      {children}
      {description && !error && (
        <p className="text-[12px] text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-[12px] font-medium text-red-500">{error}</p>}
    </div>
  );
}

