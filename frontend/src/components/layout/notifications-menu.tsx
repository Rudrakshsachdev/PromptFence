'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '@/lib/utils';
import { shortId } from '@/lib/format';
import { findingService } from '@/services/finding.service';
import { testRunService } from '@/services/test-run.service';

/**
 * Notification centre backed by live data: open critical findings that need
 * triage and executions currently in progress. No synthetic alerts.
 */
export function NotificationsMenu() {
  const critical = useQuery({
    queryKey: ['notifications', 'critical-open'],
    queryFn: () =>
      findingService.listFindings({ status: 'OPEN', severity: 'CRITICAL', page: 1, page_size: 5, sort: 'newest' }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const running = useQuery({
    queryKey: ['notifications', 'running-runs'],
    queryFn: () => testRunService.listTestRuns({ status: 'RUNNING', page: 1, page_size: 5 }),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const criticalCount = critical.data?.total ?? 0;
  const runningCount = running.data?.total ?? 0;
  const count = criticalCount + runningCount;
  const failed = critical.isError || running.isError;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={count ? `Notifications: ${count} items` : 'Notifications'}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-critical px-1 font-mono text-[9px] font-semibold leading-none text-background">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <p className="text-[13px] font-semibold text-foreground">Notifications</p>
          <span className="text-[11px] text-subtle-foreground">Auto-refreshing</span>
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {failed && (
            <p className="px-3.5 py-3 text-xs text-critical">Could not load notification sources.</p>
          )}

          {runningCount > 0 && (
            <Section title={`Running executions · ${runningCount}`}>
              {running.data?.items.map((r) => (
                <NotificationLink
                  key={r.id}
                  href={`/test-runs/${r.id}`}
                  icon={<Activity className="h-3.5 w-3.5 animate-status-pulse text-info" />}
                  title={r.target?.name ?? r.execution_snapshot?.target?.name ?? 'Test run'}
                  detail={`${r.completed_cases}/${r.total_cases} cases · ${shortId(r.id)}`}
                  time={r.started_at ?? r.created_at}
                />
              ))}
            </Section>
          )}

          {criticalCount > 0 && (
            <Section title={`Open critical findings · ${criticalCount}`}>
              {critical.data?.items.map((f) => (
                <NotificationLink
                  key={f.id}
                  href={`/findings/${f.id}`}
                  icon={<ShieldAlert className="h-3.5 w-3.5 text-critical" />}
                  title={f.title}
                  detail={`Needs triage · ${shortId(f.id)}`}
                  time={f.observed_at}
                />
              ))}
              {criticalCount > (critical.data?.items.length ?? 0) && (
                <Link
                  href="/findings?severity=CRITICAL&status=OPEN"
                  className="block px-3.5 py-2 text-xs font-medium text-primary hover:underline"
                >
                  View all {criticalCount} critical findings
                </Link>
              )}
            </Section>
          )}

          {!failed && count === 0 && !critical.isLoading && !running.isLoading && (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <CheckCircle2 className="mb-2 h-5 w-5 text-success" />
              <p className="text-[13px] font-medium text-foreground">All clear</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                No running executions and no open critical findings.
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border last:border-0">
      <p className="px-3.5 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function NotificationLink({
  href,
  icon,
  title,
  detail,
  time,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  time: string | null;
}) {
  return (
    <Link href={href} className="flex items-start gap-2.5 px-3.5 py-2 transition-colors hover:bg-surface">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-foreground">{title}</span>
        <span className="block truncate font-mono text-[11px] text-subtle-foreground">{detail}</span>
      </span>
      <span className="shrink-0 text-[11px] text-subtle-foreground">{formatRelativeTime(time)}</span>
    </Link>
  );
}
