'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, ShieldCheck, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { Breadcrumb } from '@/components/layout/breadcrumb';

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-30 dark:bg-slate-900/95 dark:border-slate-800">
      <Breadcrumb />

      <div className="flex items-center space-x-4">
        {/* Phase 1 badge indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-medium border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
          <span>PromptFence Core v0.1</span>
        </div>

        {/* User profile dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 focus:outline-none ring-offset-background transition-opacity hover:opacity-80">
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold uppercase">
                {user?.full_name ? user.full_name[0] : 'U'}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600 cursor-pointer">
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

