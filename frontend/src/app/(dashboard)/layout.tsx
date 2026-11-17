'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { LogoMark } from '@/components/shared/logo';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { buildLoginUrl } from '@/lib/auth-redirect';
import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebar } from '@/providers/sidebar-provider';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar />
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out',
          isCollapsed ? 'lg:ml-[60px]' : 'lg:ml-60',
        )}
      >
        <TopBar />
        <main id="main-content" className="w-full flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Return the user to the page they were on once they sign in again.
      router.replace(buildLoginUrl(`${window.location.pathname}${window.location.search}`));
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-panel">
            <LogoMark className="h-7 animate-status-pulse" />
          </span>
          <p className="font-mono text-xs text-subtle-foreground">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={250}>
        <DashboardContent>{children}</DashboardContent>
      </TooltipProvider>
    </SidebarProvider>
  );
}
