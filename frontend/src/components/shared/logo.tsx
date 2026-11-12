import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  collapsed?: boolean;
}

export function Logo({ className, collapsed = false }: LogoProps) {
  return (
    <Link
      href="/overview"
      className={cn(
        'group flex items-center space-x-2.5 transition-opacity hover:opacity-90',
        className
      )}
    >
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-teal-400 shadow-sm ring-1 ring-slate-800/60 transition-transform group-hover:scale-105">
        <ShieldAlert className="h-4 w-4" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500"></span>
        </span>
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Prompt<span className="text-teal-600 dark:text-teal-400">Fence</span>
            </span>
          </div>
          <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase -mt-0.5">
            AI Security Lab
          </span>
        </div>
      )}
    </Link>
  );
}
