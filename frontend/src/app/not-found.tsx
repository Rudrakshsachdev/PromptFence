import React from 'react';
import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-panel">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground">
          <SearchX className="h-5 w-5" />
        </span>
        <p className="mt-4 font-mono text-xs text-subtle-foreground">HTTP 404</p>
        <h1 className="mt-1 text-base font-semibold text-foreground">Page not found</h1>
        <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          The page or resource you requested does not exist, or you do not have access to it.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/overview">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to overview
          </Link>
        </Button>
      </div>
    </div>
  );
}
