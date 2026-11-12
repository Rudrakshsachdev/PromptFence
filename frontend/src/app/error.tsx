'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
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
    <div className="flex h-screen w-full items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full p-8 border border-slate-200 rounded-xl bg-white text-card-foreground shadow-2xs text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Application Error Encountered</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {error.message || 'An unexpected runtime error occurred while loading this page.'}
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-slate-400">Digest: {error.digest}</p>
          )}
        </div>
        <div className="pt-2">
          <Button
            onClick={() => reset()}
            size="sm"
            className="w-full h-9 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reload Application State
          </Button>
        </div>
      </div>
    </div>
  );
}
