import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4 transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/10 text-primary',
        secondary: 'border-border bg-surface text-muted-foreground',
        destructive: 'border-critical/30 bg-critical/10 text-critical',
        outline: 'border-border text-muted-foreground',
        success: 'border-success/30 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        info: 'border-info/30 bg-info/10 text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
