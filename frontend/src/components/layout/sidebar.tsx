'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Crosshair,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { NAVIGATION_SECTIONS } from '@/constants/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Crosshair,
  FolderKanban,
  ShieldAlert,
  User: UserIcon,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen fixed left-0 top-0 z-40 dark:bg-slate-900 dark:border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <Logo />
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {section.title}
            </h4>
            {section.items.map((item) => {
              const Icon = iconMap[item.iconName] || LayoutDashboard;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold dark:bg-teal-950/40 dark:text-teal-400'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom User Area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs uppercase">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.full_name || 'User'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

