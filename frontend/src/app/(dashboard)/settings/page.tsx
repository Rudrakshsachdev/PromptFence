'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Building2,
  Cable,
  ExternalLink,
  KeyRound,
  RotateCcw,
  Server,
  Settings as SettingsIcon,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DetailList } from '@/components/shared/detail-list';
import { ErrorState } from '@/components/shared/error-state';
import { CopyButton } from '@/components/shared/id-chip';
import { Panel } from '@/components/shared/panel';
import { PageSkeleton } from '@/components/shared/skeletons';
import { StatusPill } from '@/components/shared/status-pill';
import { UnavailableNotice } from '@/components/shared/unavailable';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { formatTimestamp, humanize } from '@/lib/format';
import { getTargetTypeLabel } from '@/lib/status';
import { cn } from '@/lib/utils';
import { adapterService } from '@/services/adapter.service';
import { ChangePasswordForm } from './_components/change-password-form';
import { SessionsPanel } from './_components/sessions-panel';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'authentication', label: 'Authentication', icon: KeyRound },
  { id: 'api', label: 'API configuration', icon: Cable },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'system', label: 'System', icon: Server },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

interface HealthResponse {
  status: string;
  app_name?: string;
  environment?: string;
  timestamp?: number;
}

interface ReadinessResponse {
  status: string;
  database?: string;
  db_latency_ms?: number;
}

function SettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get('section');
  const active: SectionId = SECTIONS.some((s) => s.id === requested) ? (requested as SectionId) : 'profile';

  const select = (id: SectionId) => router.replace(`${pathname}?section=${id}`, { scroll: false });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Account security, authentication model, API connectivity and platform diagnostics."
      />

      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-20 lg:self-start">
          <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === active;
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => select(s.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex h-8 w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                      isActive
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-subtle-foreground')} aria-hidden />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">
          {active === 'profile' && <ProfileSection />}
          {active === 'security' && (
            <>
              <Panel title="Password" description="Changing your password signs out all other sessions" icon={KeyRound}>
                <ChangePasswordForm />
              </Panel>
              <SessionsPanel allowTerminateAll />
            </>
          )}
          {active === 'authentication' && <AuthenticationSection />}
          {active === 'api' && <ApiSection />}
          {active === 'notifications' && (
            <UnavailableNotice
              title="Notification preferences are not supported"
              description="The backend exposes no notification settings or delivery channels (email, webhook, Slack). The in-app notification menu is derived live from open critical findings and running executions and cannot be configured."
            />
          )}
          {active === 'workspace' && (
            <UnavailableNotice
              title="Workspace management is not supported"
              description="PromptFence currently runs as a single workspace. There is no API for workspaces, members or invitations; access is governed by per-user roles (Admin, Security Researcher, Viewer)."
            />
          )}
          {active === 'system' && <SystemSection />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  return (
    <Panel
      title="Profile"
      icon={UserIcon}
      actions={
        <Button asChild variant="outline" size="xs">
          <Link href="/profile">Edit profile</Link>
        </Button>
      }
    >
      <DetailList
        columns={2}
        items={[
          { label: 'Full name', value: user?.full_name || '—' },
          { label: 'Email', value: user?.email, mono: true },
          {
            label: 'Roles',
            value: user?.roles?.length ? (
              <div className="flex flex-wrap gap-1">
                {user.roles.map((r) => (
                  <StatusPill key={r} tone="accent" label={humanize(r)} dot={false} />
                ))}
              </div>
            ) : (
              '—'
            ),
          },
          {
            label: 'Email verification',
            value: (
              <StatusPill
                tone={user?.is_verified ? 'success' : 'warning'}
                label={user?.is_verified ? 'Verified' : 'Not verified'}
              />
            ),
          },
          { label: 'Last sign-in', value: formatTimestamp(user?.last_login_at), mono: true },
          { label: 'Member since', value: formatTimestamp(user?.created_at), mono: true },
        ]}
      />
    </Panel>
  );
}

function AuthenticationSection() {
  return (
    <>
      <Panel title="Session model" icon={KeyRound} description="How this browser authenticates to the API">
        <DetailList
          columns={2}
          items={[
            {
              label: 'Credential transport',
              value: 'HttpOnly cookies, sent automatically with each API request',
            },
            {
              label: 'Token visibility',
              value: 'Tokens are never readable by this application or stored in browser storage',
            },
            {
              label: 'Access token lifetime',
              value: 'Short-lived; set by server configuration (default 15 minutes)',
            },
            {
              label: 'Refresh tokens',
              value: 'Single-use with rotation; reuse of a rotated token revokes the token family',
            },
            {
              label: 'Silent refresh',
              value: 'On a 401 response the client requests a new access token once, then retries',
            },
            {
              label: 'Cookie flags',
              value: 'SameSite and Secure attributes are set by server configuration',
            },
          ]}
        />
      </Panel>
      <UnavailableNotice
        title="Single sign-on and multi-factor authentication are not available"
        description="The backend supports email + password authentication only. There is no API for SSO providers, MFA enrolment or personal API keys."
      />
    </>
  );
}

function ApiSection() {
  const adaptersQuery = useQuery({
    queryKey: ['adapters'],
    queryFn: () => adapterService.listAdapters(),
  });

  return (
    <>
      <Panel title="API endpoint" icon={Cable} description="Read-only; configured at build time via NEXT_PUBLIC_API_URL">
        <DetailList
          columns={2}
          items={[
            {
              label: 'Base URL',
              value: (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                  {API_BASE}
                  <CopyButton value={API_BASE} label="Copy base URL" />
                </span>
              ),
            },
            { label: 'API version', value: '/api/v1', mono: true },
            {
              label: 'OpenAPI reference',
              value: (
                <a
                  href={`${API_BASE}/docs`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {`${API_BASE}/docs`} <ExternalLink className="h-3 w-3" />
                </a>
              ),
            },
            { label: 'Authentication', value: 'Cookie session (see Authentication)' },
          ]}
        />
      </Panel>

      <Panel
        title="Execution adapters"
        icon={Server}
        description="Registered adapters the engine can use to reach targets (live from /api/v1/adapters)"
      >
        {adaptersQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : adaptersQuery.isError ? (
          <ErrorState error={adaptersQuery.error} onRetry={() => adaptersQuery.refetch()} compact />
        ) : !adaptersQuery.data?.length ? (
          <p className="text-xs italic text-subtle-foreground">No adapters registered.</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {adaptersQuery.data.map((a) => (
              <li key={a.name} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">
                    {a.name}{' '}
                    <span className="font-normal text-muted-foreground">· {getTargetTypeLabel(a.target_type)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                <div className="flex flex-wrap gap-1 sm:justify-end">
                  {a.supported_capabilities.map((c) => (
                    <span
                      key={c}
                      className="rounded border border-border bg-surface px-1.5 py-px font-mono text-[10px] text-muted-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <UnavailableNotice
        title="API keys are not supported"
        description="There is no endpoint to issue or rotate API keys. Programmatic access uses the same cookie-based session as this application."
      />
    </>
  );
}

function SystemSection() {
  const health = useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiClient<HealthResponse>('/api/v1/health'),
    retry: false,
  });
  const ready = useQuery({
    queryKey: ['system-ready'],
    queryFn: () => apiClient<ReadinessResponse>('/api/v1/ready'),
    retry: false,
  });

  const probes = [
    {
      label: 'API liveness',
      path: '/api/v1/health',
      ok: health.data?.status === 'healthy',
      loading: health.isLoading,
      error: health.error,
      detail: health.data
        ? `${health.data.app_name ?? 'API'} · ${health.data.environment ?? 'unknown env'}`
        : undefined,
    },
    {
      label: 'Database readiness',
      path: '/api/v1/ready',
      ok: ready.data?.status === 'ready',
      loading: ready.isLoading,
      error: ready.error,
      detail:
        ready.data?.db_latency_ms !== undefined
          ? `${ready.data.database ?? 'database'} · ${ready.data.db_latency_ms} ms`
          : undefined,
    },
  ];

  return (
    <>
      <Panel
        title="Service health"
        icon={Server}
        description="Live probes against the backend"
        actions={
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              health.refetch();
              ready.refetch();
            }}
          >
            <RotateCcw className={cn('h-3 w-3', (health.isFetching || ready.isFetching) && 'animate-spin')} /> Re-check
          </Button>
        }
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {probes.map((p) => (
            <li key={p.path} className="rounded-md border border-border bg-background/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-foreground">{p.label}</span>
                {p.loading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <StatusPill tone={p.ok ? 'success' : 'critical'} label={p.ok ? 'Healthy' : 'Unavailable'} />
                )}
              </div>
              <p className="mt-1 font-mono text-[11px] text-subtle-foreground">GET {p.path}</p>
              {p.detail && <p className="mt-1 text-xs text-muted-foreground">{p.detail}</p>}
              {!p.loading && !p.ok && p.error instanceof Error && (
                <p className="mt-1 font-mono text-[11px] text-critical">{p.error.message}</p>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Platform security controls"
        icon={ShieldCheck}
        description="Documented server-side configuration — not a live probe"
      >
        <DetailList
          columns={2}
          items={[
            {
              label: 'Outbound SSRF validation',
              value: 'Target URLs are checked against private (RFC 1918), loopback and cloud-metadata ranges',
            },
            { label: 'Password hashing', value: 'Argon2id, with bcrypt verification for legacy hashes' },
            { label: 'Canary tokens', value: 'Session-bound tokens signed with HMAC-SHA256 and a versioned key' },
            { label: 'Report integrity', value: 'SHA-256 content hash per artifact; secrets redacted from JSON evidence' },
          ]}
        />
      </Panel>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
