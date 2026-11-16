import React from 'react';
import { CircleSlash } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Explicit "not supported / not measured" marker. Use instead of zeros or
 * placeholder numbers whenever the backend does not provide a value.
 */
export function UnavailableNotice({
  title,
  description,
  className,
}: {
  title: string;
  description: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface/30 px-4 py-3',
        className,
      )}
    >
      <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-subtle-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

/** Inline placeholder for a metric the API did not return. */
export function NotMeasured({ label = 'Not measured', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn('text-xs font-medium italic text-subtle-foreground', className)}
      title="This value is not available from the current data"
    >
      {label}
    </span>
  );
}
