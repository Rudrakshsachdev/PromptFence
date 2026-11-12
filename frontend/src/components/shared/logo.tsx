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
    <Link href="/overview" className={cn('flex items-center space-x-2.5 font-bold tracking-tight', className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
        <ShieldAlert className="h-5 w-5" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-base text-slate-900 font-extrabold tracking-tight dark:text-white">PromptFence</span>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest -mt-1">Security Lab</span>
        </div>
      )}
    </Link>
  );
}

