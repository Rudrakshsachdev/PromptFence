import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full p-8 border rounded-lg bg-card text-card-foreground shadow-sm text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
        <h3 className="text-lg font-semibold text-slate-800 mt-2">Resource Not Found</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          The requested endpoint or page does not exist in PromptFence.
        </p>
        <Button asChild className="w-full">
          <Link href="/overview">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

