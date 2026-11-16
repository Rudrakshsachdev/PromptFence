'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div role="alert" className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-panel">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-critical/30 bg-critical/10 text-critical">
          <AlertOctagon className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-base font-semibold text-foreground">Something went wrong</h1>
        <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {error.message || 'An unexpected error occurred while rendering this page.'}
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-subtle-foreground">Digest {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => reset()} className="flex-1">
            <RotateCw className="h-3.5 w-3.5" /> Try again
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/overview">Go to overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
