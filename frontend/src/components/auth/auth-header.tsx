import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface AuthHeaderProps {
  title: string;
  description: string;
  className?: string;
  showLogo?: boolean;
}

export function AuthHeader({
  title,
  description,
  className,
  showLogo = true,
}: AuthHeaderProps) {
  return (
    <div className={cn('flex flex-col items-center text-center mb-6 sm:mb-7', className)}>
      {showLogo && (
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 rounded-lg p-1 transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 mb-5"
          aria-label="PromptFence Home"
        >
          <div className="relative flex shrink-0 items-center justify-center">
            <Image
              src="/brand/promptfence-mark.png"
              alt="PromptFence Logo"
              width={34}
              height={44}
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              priority
            />
          </div>
          <span className="text-[19px] sm:text-[20px] font-extrabold tracking-tight text-neutral-950 select-none">
            PromptFence
          </span>
        </Link>
      )}

      <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-neutral-950 leading-tight">
        {title}
      </h1>
      <p className="mt-2 text-[13.5px] text-neutral-500 leading-relaxed max-w-[320px]">
        {description}
      </p>
    </div>
  );
}
