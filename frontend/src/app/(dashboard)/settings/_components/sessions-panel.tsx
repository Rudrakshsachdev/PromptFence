'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Laptop, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/dashboard/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { Panel } from '@/components/shared/panel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { formatTimestamp, shortId } from '@/lib/format';
import { formatRelativeTime } from '@/lib/utils';
import { authService } from '@/services/auth.service';
import type { Session } from '@/types/auth';

export const SESSIONS_QUERY_KEY = ['auth-sessions'] as const;

/** Active refresh-token sessions with per-session revoke and optional "terminate all". */
export function SessionsPanel({ allowTerminateAll = false }: { allowTerminateAll?: boolean }) {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => authService.getSessions(),
  });

  const revoke = useMutation({
    mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
    onSuccess: () => {
      toast.success('Session revoked successfully');
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to revoke session'),
    onSettled: () => setSessionToRevoke(null),
  });

  const logoutAll = useMutation({
    mutationFn: () => authService.logoutAll(),
    onSuccess: () => {
      toast.success('All sessions terminated');
      logout();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to terminate all sessions'),
  });

  const columns: DataTableColumn<Session>[] = [
    {
      id: 'device',
      header: 'Device',
      cell: (s) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Laptop className="h-4 w-4 shrink-0 text-subtle-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-[13px] text-foreground" title={s.device_info ?? undefined}>
              {s.device_info || 'Unidentified device'}
            </p>
            <p className="font-mono text-[11px] text-subtle-foreground">{shortId(s.id)}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'created',
      header: 'Signed in',
      hideBelow: 'sm',
      sortValue: (s) => s.created_at,
      cell: (s) => <span className="font-mono text-xs text-muted-foreground">{formatTimestamp(s.created_at)}</span>,
    },
    {
      id: 'last',
      header: 'Last used',
      hideBelow: 'md',
      sortValue: (s) => s.last_used_at ?? null,
      cell: (s) => <span className="text-xs text-muted-foreground">{formatRelativeTime(s.last_used_at)}</span>,
    },
    {
      id: 'action',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (s) => (
        <Button
          variant="ghost"
          size="xs"
          className="hover:bg-critical/10 hover:text-critical"
          onClick={() => setSessionToRevoke(s)}
          disabled={revoke.isPending}
        >
          Revoke
        </Button>
      ),
    },
  ];

  return (
    <Panel
      title="Active sessions"
      description="Refresh-token sessions for your account"
      icon={Laptop}
      flush
      actions={
        allowTerminateAll ? (
          <Button variant="destructive" size="xs" onClick={() => setLogoutAllOpen(true)}>
            <LogOut className="h-3 w-3" /> Sign out everywhere
          </Button>
        ) : undefined
      }
    >
      <DataTable
        label="Active sessions"
        columns={columns}
        data={sessionsQuery.data}
        getRowId={(s) => s.id}
        isLoading={sessionsQuery.isLoading}
        error={sessionsQuery.error}
        onRetry={() => sessionsQuery.refetch()}
        initialSort={{ id: 'created', direction: 'desc' }}
        skeletonRows={3}
        empty={
          <EmptyState
            bare
            compact
            icon={Laptop}
            title="No additional sessions"
            description="No other active refresh-token sessions are recorded for this account."
          />
        }
      />

      <ConfirmDialog
        open={!!sessionToRevoke}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
        title="Revoke session?"
        description="The device using this session will be signed out immediately and must re-authenticate."
        confirmText="Revoke session"
        variant="destructive"
        isLoading={revoke.isPending}
        onConfirm={() => sessionToRevoke && revoke.mutate(sessionToRevoke.id)}
      />
      {allowTerminateAll && (
        <ConfirmDialog
          open={logoutAllOpen}
          onOpenChange={setLogoutAllOpen}
          title="Sign out of all sessions?"
          description="This invalidates every refresh-token family on all browsers and devices, including this one. You will be returned to the sign-in page."
          confirmText="Sign out everywhere"
          variant="destructive"
          isLoading={logoutAll.isPending}
          onConfirm={() => logoutAll.mutate()}
        />
      )}
    </Panel>
  );
}
