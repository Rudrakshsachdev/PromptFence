import React from 'react';
import { LogoMark } from '@/components/shared/logo';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background" aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-panel">
          <LogoMark className="h-7 animate-status-pulse" />
        </span>
        <p className="font-mono text-xs text-subtle-foreground">Loading…</p>
      </div>
    </div>
  );
}
