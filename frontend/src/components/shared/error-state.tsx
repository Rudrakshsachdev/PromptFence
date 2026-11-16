import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Recoverable failure state for a page or panel. Shows the API message and a retry action. */
export function ErrorState({
  title = 'Unable to load data',
  error,
  onRetry,
  compact = false,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-critical/25 bg-critical/[0.04] text-center',
        compact ? 'px-4 py-6' : 'px-6 py-12',
        className,
      )}
    >
      <AlertOctagon className="mb-2 h-5 w-5 text-critical" aria-hidden />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-md font-mono text-xs text-muted-foreground">
        {errorMessage(error, 'The server returned an unexpected response.')}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}
