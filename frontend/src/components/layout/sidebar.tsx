'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { getActiveNavHref, NAVIGATION_SECTIONS } from '@/constants/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/providers/sidebar-provider';

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeHref = getActiveNavHref(pathname);

  return (
    <nav aria-label="Primary" className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
      {NAVIGATION_SECTIONS.map((section, sIdx) => (
        <div key={section.title} className={cn(sIdx > 0 && 'mt-4')}>
          {collapsed ? (
            sIdx > 0 && <div className="mx-2 mb-3 h-px bg-border/70" aria-hidden />
          ) : (
            <p className="mb-1 px-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
              {section.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeHref === item.href;
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={collapsed ? item.title : undefined}
                  className={cn(
                    'group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60',
                    isActive
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
                    />
                  )}
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-subtle-foreground group-hover:text-muted-foreground',
                    )}
                    aria-hidden
                  />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              );
              return (
                <li key={item.href}>
                  <SimpleTooltip label={item.title} side="right" disabled={!collapsed}>
                    {link}
                  </SimpleTooltip>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth();
  const initials =
    user?.full_name
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  const role = user?.roles?.[0];

  return (
    <div className="border-t border-border p-2">
      <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
        <SimpleTooltip label={user?.full_name || 'Profile'} side="right" disabled={!collapsed}>
          <Link
            href="/profile"
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1.5 outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring/60',
              collapsed && 'flex-none justify-center',
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-hover text-[11px] font-semibold text-foreground">
              {initials}
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-foreground">
                  {user?.full_name || 'Signed in'}
                </span>
                <span className="block truncate text-[11px] text-subtle-foreground">
                  {role ? role.replace(/_/g, ' ').toLowerCase() : user?.email}
                </span>
              </span>
            )}
          </Link>
        </SimpleTooltip>
        <SimpleTooltip label="Sign out" side="right">
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-critical/10 hover:text-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </SimpleTooltip>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isMobileOpen, setMobileOpen } = useSidebar();

  // Close the mobile drawer on navigation and on Escape.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileOpen, setMobileOpen]);

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-out lg:flex',
          isCollapsed ? 'w-[60px]' : 'w-60',
        )}
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-border',
            isCollapsed ? 'justify-center px-2' : 'justify-between px-3',
          )}
        >
          <Logo collapsed={isCollapsed} />
          {!isCollapsed && (
            <SimpleTooltip label="Collapse sidebar" side="right">
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label="Collapse sidebar"
                className="flex h-7 w-7 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </SimpleTooltip>
          )}
        </div>
        {isCollapsed && (
          <div className="flex justify-center border-b border-border py-2">
            <SimpleTooltip label="Expand sidebar" side="right">
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label="Expand sidebar"
                className="flex h-7 w-7 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </SimpleTooltip>
          </div>
        )}
        <NavLinks collapsed={isCollapsed} />
        <UserFooter collapsed={isCollapsed} />
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-[2px] animate-in fade-in-0"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-sidebar shadow-overlay animate-in slide-in-from-left duration-200">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <UserFooter collapsed={false} />
          </aside>
        </div>
      )}
    </>
  );
}
