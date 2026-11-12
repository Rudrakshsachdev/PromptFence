'use client';

import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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
    <div className="flex h-screen w-full items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full p-8 border rounded-lg bg-card text-card-foreground shadow-sm text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Application Error</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <Button onClick={() => reset()} className="w-full">
          Try Again
        </Button>
      </div>
    </div>
  );
}

