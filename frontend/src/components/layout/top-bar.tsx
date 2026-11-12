'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  HelpCircle,
  Menu,
  Search,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/providers/sidebar-provider';

export function TopBar() {
  const { user, logout } = useAuth();
  const { toggleMobileOpen } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick navigation items for search
  const quickActions = [
    { title: 'Security Dashboard', href: '/overview', category: 'Navigation' },
    { title: 'AI Application Targets', href: '/targets', category: 'Navigation' },
    { title: 'Register New Target', href: '/targets/new', category: 'Action' },
    { title: 'Test Suites', href: '/test-suites', category: 'Navigation' },
    { title: 'Create Test Suite', href: '/test-suites/new', category: 'Action' },
    { title: 'Scenario Library', href: '/scenarios', category: 'Navigation' },
    { title: 'Create Attack Scenario', href: '/scenarios/new', category: 'Action' },
    { title: 'Security Settings & Diagnostics', href: '/settings', category: 'Settings' },
  ];

  const filteredQuickActions = quickActions.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 lg:px-8 backdrop-blur transition-all dark:border-slate-800 dark:bg-slate-900/95">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileOpen}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            aria-label="Open mobile navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Breadcrumb />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-2.5 text-xs text-slate-500 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-750 dark:bg-slate-800/60 dark:text-slate-400"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search lab...</span>
            <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-slate-200 bg-white px-1 font-mono text-[9px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-900">
              ⌘K
            </kbd>
          </button>

          {/* Security Runtime Badge */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/70 px-2.5 py-1 text-[11px] font-medium text-teal-800 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-300">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span>PromptFence v0.1 Core</span>
          </div>

          {/* Notifications Center */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/70 bg-white text-slate-500 shadow-2xs transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                title="Security Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white dark:ring-slate-900" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Security Alerts</p>
                <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700">
                  Lab Active
                </Badge>
              </div>
              <div className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>SSRF Protection Guard Armed</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    All outbound target URLs are validated against private RFC 1918 and metadata endpoints.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Live Engine</span>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <span>Database Session Initialized</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Connected to PostgreSQL. Token rotation & family tracking active.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Authentication</span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/70 bg-white text-slate-500 shadow-2xs transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                title="Help & Documentation"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs font-semibold">Documentation & Guides</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer flex items-center justify-between text-xs"
                >
                  <span>Backend OpenAPI Docs</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer text-xs">
                  <span>Platform Diagnostics</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/scenarios" className="cursor-pointer text-xs">
                  <span>Attack Vectors Guide</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold uppercase text-teal-400 shadow-2xs">
                  {user?.full_name ? user.full_name[0] : 'U'}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.full_name || 'Security User'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 bg-slate-100">
                    Admin Role
                  </Badge>
                </div>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer text-xs flex items-center">
                  <UserIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer text-xs flex items-center">
                  <Settings className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  <span>Platform Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-xs text-red-600 flex items-center focus:text-red-700"
              >
                <LogOut className="mr-2 h-3.5 w-3.5 text-red-500" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          <DialogHeader className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search targets, suites, or scenarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 p-0 text-xs h-auto"
                autoFocus
              />
            </div>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {filteredQuickActions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No matching actions found</p>
            ) : (
              filteredQuickActions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-md text-xs hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <span className="font-medium">{item.title}</span>
                  <Badge variant="outline" className="text-[10px] text-slate-400 font-mono">
                    {item.category}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
