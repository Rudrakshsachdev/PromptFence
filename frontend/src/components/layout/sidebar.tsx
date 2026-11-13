'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { NAVIGATION_SECTIONS } from '@/constants/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/providers/sidebar-provider';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Crosshair,
  FolderKanban,
  ShieldAlert,
  FlaskConical,
  AlertTriangle,
  User: UserIcon,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, setMobileOpen } = useSidebar();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      {/* Brand & Collapse Header */}
      <div>
        <div
          className={cn(
            'flex h-16 items-center justify-between border-b border-slate-200/80 px-4 transition-all dark:border-slate-800',
            isCollapsed ? 'justify-center px-2' : 'px-4'
          )}
        >
          <Logo collapsed={isCollapsed} />
          <button
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden lg:flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/70 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
              isCollapsed && 'hidden'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Collapsed Toggle Button when in mini mode */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={toggleCollapse}
              aria-label="Expand sidebar"
              className="flex h-6 w-6 items-center justify-center rounded border border-slate-200/80 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="space-y-6 px-3 py-4">
          {NAVIGATION_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 dark:text-slate-500 mb-1.5">
                  {section.title}
                </h4>
              )}
              {isCollapsed && (
                <div className="my-2 border-t border-slate-200/60 dark:border-slate-800" />
              )}
              {section.items.map((item) => {
                const Icon = iconMap[item.iconName] || LayoutDashboard;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/overview' && pathname.startsWith(`${item.href}`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all',
                      isActive
                        ? 'bg-teal-50/80 font-semibold text-teal-800 shadow-sm ring-1 ring-teal-600/10 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-500/20'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200',
                      isCollapsed && 'justify-center px-2 py-2.5'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-teal-600 dark:bg-teal-400" />
                    )}
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="border-t border-slate-200/80 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
        <div
          className={cn(
            'flex items-center justify-between gap-2',
            isCollapsed && 'flex-col justify-center'
          )}
        >
          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-2.5 min-w-0 flex-1 rounded-md p-1.5 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-800',
              isCollapsed && 'justify-center p-0'
            )}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold uppercase text-teal-400 ring-2 ring-teal-500/20">
              {user?.full_name ? user.full_name[0] : 'U'}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {user?.full_name || 'Security User'}
                </p>
                <p className="truncate text-[10px] text-slate-400 font-mono">
                  {user?.email || 'admin@promptfence.internal'}
                </p>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <button
              onClick={() => logout()}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden lg:flex flex-col h-screen border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900',
          isCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl dark:bg-slate-900 dark:border-slate-800">
            <div className="absolute right-3 top-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
