import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** PromptFence brand mark: the same artwork as the landing page and auth screens. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/promptfence-mark.png"
      alt=""
      aria-hidden
      width={28}
      height={36}
      className={cn('h-6 w-auto object-contain', className)}
      priority
    />
  );
}

interface LogoProps {
  className?: string;
  collapsed?: boolean;
  href?: string;
}

/** Mark + wordmark lockup used in the product shell (mark only when collapsed). */
export function Logo({ className, collapsed = false, href = '/overview' }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="PromptFence overview"
      className={cn(
        'group flex min-w-0 items-center gap-2 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2',
        className,
      )}
    >
      <LogoMark className="h-7 transition-transform duration-200 group-hover:scale-105" />
      {!collapsed && (
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate text-[16px] font-extrabold tracking-tight text-foreground">
            PromptFence
          </span>
          <span className="shrink-0 rounded-full border border-border bg-surface px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
            Lab
          </span>
        </span>
      )}
    </Link>
  );
}
