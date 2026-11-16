import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** PromptFence mark: a shield bisected by a fence line. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-4 w-4', className)}>
      <path
        d="M12 2.5 4.5 5.25v6.1c0 4.6 3.1 8.7 7.5 10.15 4.4-1.45 7.5-5.55 7.5-10.15v-6.1L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.25 9.5v6M12 8v9.5M15.75 9.5v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 12.25h10" stroke="hsl(var(--info))" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  collapsed?: boolean;
  href?: string;
}

export function Logo({ className, collapsed = false, href = '/overview' }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="PromptFence overview"
      className={cn(
        'group flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        className,
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
        <LogoMark className="h-[18px] w-[18px]" />
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-[14px] font-semibold tracking-tight text-foreground">
            PromptFence
          </span>
          <span className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
            LLM Security Platform
          </span>
        </span>
      )}
    </Link>
  );
}
