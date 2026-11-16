import React from 'react';
import { LogoMark } from '@/components/shared/logo';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background" aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <LogoMark className="h-5 w-5 animate-status-pulse" />
        </span>
        <p className="font-mono text-xs text-subtle-foreground">Loading…</p>
      </div>
    </div>
  );
}
