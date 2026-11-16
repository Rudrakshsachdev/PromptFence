'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, LogOut, Menu, Search, Settings, User as UserIcon } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { CommandPalette } from '@/components/layout/command-palette';
import { NotificationsMenu } from '@/components/layout/notifications-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/providers/sidebar-provider';

const API_DOCS_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/docs`;

export function TopBar() {
  const { user, logout } = useAuth();
  const { toggleMobileOpen } = useSidebar();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const initials =
    user?.full_name
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:px-6">
        <button
          type="button"
          onClick={toggleMobileOpen}
          className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumb />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:w-56"
            aria-label="Search and run commands"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search…</span>
            <kbd className="ml-auto hidden rounded border border-border bg-surface px-1.5 py-px font-mono text-[10px] text-subtle-foreground md:inline">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          </button>

          <NotificationsMenu />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-[11px] font-semibold text-foreground transition-colors hover:ring-1 hover:ring-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="border-b border-border px-2.5 py-2">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {user?.full_name || 'Signed in'}
                </p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{user?.email}</p>
                {!!user?.roles?.length && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded border border-border bg-surface px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-1">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={API_DOCS_URL} target="_blank" rel="noreferrer">
                    <BookOpen /> API reference
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => logout()}
                  className="text-critical focus:text-critical [&_svg]:text-critical"
                >
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
