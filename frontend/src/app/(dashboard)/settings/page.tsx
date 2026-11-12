'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Database,
  Laptop,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { formatDate } from '@/lib/utils';
import { authService } from '@/services/auth.service';
import { Session } from '@/types/auth';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await authService.getSessions();
      setSessions(data);
    } catch {
      // Ignore if session fetch fails
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const onRevokeSession = async (sessionId: string) => {
    try {
      await authService.revokeSession(sessionId);
      toast.success('Session revoked successfully');
      loadSessions();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to revoke session');
      }
    } finally {
      setSessionToRevoke(null);
    }
  };

  const onLogoutAll = async () => {
    try {
      await authService.logoutAll();
      toast.success('All sessions terminated');
      logout();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to terminate all sessions');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Settings & Security Diagnostics"
        description="Environment configuration, active browser sessions, and security runtime parameters."
      />

      <div className="space-y-6">
        {/* Security Controls Status */}
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Active Security Controls</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border-emerald-200">
              Guards Active
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-xs">
            <div className="flex justify-between items-center py-1">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">Multi-Stage Outbound SSRF Validation</p>
                <p className="text-[11px] text-slate-400">
                  Blocks RFC 1918 subnets, loopback (127.0.0.1), and cloud metadata endpoints.
                </p>
              </div>
              <span className="text-emerald-600 font-semibold flex items-center gap-1 font-mono text-[11px]">
                <CheckCircle2 className="h-3 w-3" /> Enforced
              </span>
            </div>
            <Separator />

            <div className="flex justify-between items-center py-1">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">Password Hashing Cryptography</p>
                <p className="text-[11px] text-slate-400">
                  Argon2id (time_cost=3, memory_cost=64MB, parallelism=4) with bcrypt compatibility.
                </p>
              </div>
              <span className="font-mono text-slate-700 font-medium text-[11px]">RFC 9106</span>
            </div>
            <Separator />

            <div className="flex justify-between items-center py-1">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">Token Rotation & Reuse Detection</p>
                <p className="text-[11px] text-slate-400">
                  Single-use refresh token families invalidating compromised token chains immediately.
                </p>
              </div>
              <span className="text-emerald-600 font-semibold flex items-center gap-1 font-mono text-[11px]">
                <CheckCircle2 className="h-3 w-3" /> Armed
              </span>
            </div>
            <Separator />

            <div className="flex justify-between items-center py-1">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">Database Persistence Engine</p>
                <p className="text-[11px] text-slate-400">
                  PostgreSQL 16 Async Engine with JSONB parameter extension seams for Phase 2 canaries.
                </p>
              </div>
              <span className="font-mono text-slate-700 font-medium text-[11px]">Connected</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Browser Sessions Management */}
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Laptop className="h-4 w-4 text-teal-600" />
              <span>Active Authentication Sessions</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogoutAllOpen(true)}
              className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <LogOut className="h-3 w-3 mr-1" /> Terminate All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSessions ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">No additional active sessions recorded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 bg-slate-50/50">
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Device / User Agent</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Created</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((sess) => (
                    <TableRow key={sess.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-xs font-mono text-slate-700">
                        {sess.device_info || 'Current Desktop Session'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-400">
                        {formatDate(sess.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSessionToRevoke(sess)}
                          className="h-7 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Platform Architecture Information */}
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Terminal className="h-4 w-4 text-teal-600" />
              <span>Platform Tier Specifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Frontend Tier</span>
                <p className="font-semibold text-slate-800">Next.js 14 App Router</p>
                <p className="text-[10px] text-slate-400">Port 3000</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Backend Tier</span>
                <p className="font-semibold text-slate-800">FastAPI 4-Tier Layered</p>
                <p className="text-[10px] text-slate-400">Port 8000</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Database</span>
                <p className="font-semibold text-slate-800">PostgreSQL 16 Neon</p>
                <p className="text-[10px] text-slate-400">Port 5432</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Phase 2 Extension</span>
                <p className="font-semibold text-slate-800">Canary Tainting Seams</p>
                <p className="text-[10px] text-slate-400">JSONB Parameters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revoke Individual Session Dialog */}
      <ConfirmDialog
        open={!!sessionToRevoke}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
        title="Revoke Session?"
        description="The device using this token will be immediately signed out and must re-authenticate."
        confirmText="Revoke Session"
        variant="destructive"
        onConfirm={() => {
          if (sessionToRevoke) {
            onRevokeSession(sessionToRevoke.id);
          }
        }}
      />

      {/* Logout All Dialog */}
      <ConfirmDialog
        open={logoutAllOpen}
        onOpenChange={setLogoutAllOpen}
        title="Terminate All Active Sessions?"
        description="This will invalidate all refresh token families across all browsers and devices, including your current session."
        confirmText="Terminate All Sessions"
        variant="destructive"
        onConfirm={onLogoutAll}
      />
    </div>
  );
}
