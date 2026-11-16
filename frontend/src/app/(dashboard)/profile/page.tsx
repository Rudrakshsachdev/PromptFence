'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, KeyRound, Save, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FormField } from '@/components/forms/form-field';
import { PageHeader } from '@/components/layout/page-header';
import { DetailList } from '@/components/shared/detail-list';
import { IdChip } from '@/components/shared/id-chip';
import { Panel } from '@/components/shared/panel';
import { StatusPill } from '@/components/shared/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { formatTimestamp, humanize } from '@/lib/format';
import { formatRelativeTime } from '@/lib/utils';
import { authService } from '@/services/auth.service';
import { SessionsPanel } from '../settings/_components/sessions-panel';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (user) {
      reset({ full_name: user.full_name, avatar_url: user.avatar_url || '' });
    }
  }, [user, reset]);

  const onUpdateProfile = async (values: ProfileFormValues) => {
    setIsUpdatingProfile(true);
    try {
      await authService.updateProfile({
        full_name: values.full_name,
        avatar_url: values.avatar_url || undefined,
      });
      await refreshUser();
      toast.success('Profile details updated successfully');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to update profile');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const initials =
    user?.full_name
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserIcon}
        title="Profile"
        description="Your identity, roles and active sessions."
        backHref="/settings"
        backLabel="Settings"
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/settings?section=security">
            <KeyRound className="h-3.5 w-3.5" /> Password & security
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-base font-semibold text-foreground">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-foreground">{user?.full_name || '—'}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <StatusPill
              tone={user?.is_active ? 'success' : 'neutral'}
              label={user?.is_active ? 'Active account' : 'Inactive account'}
            />
            <StatusPill
              tone={user?.is_verified ? 'success' : 'warning'}
              label={user?.is_verified ? 'Email verified' : 'Email not verified'}
            />
          </div>
          <DetailList
            className="mt-5"
            columns={1}
            items={[
              {
                label: 'Roles',
                value: user?.roles?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                      <StatusPill key={r} tone="accent" label={humanize(r)} dot={false} />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-subtle-foreground">No roles assigned</span>
                ),
              },
              {
                label: 'Last sign-in',
                value: user?.last_login_at ? (
                  <span className="font-mono text-xs" title={formatRelativeTime(user.last_login_at)}>
                    {formatTimestamp(user.last_login_at)}
                  </span>
                ) : (
                  <span className="text-xs text-subtle-foreground">Not recorded</span>
                ),
              },
              { label: 'Member since', value: formatTimestamp(user?.created_at), mono: true },
              { label: 'Account ID', value: <IdChip value={user?.id} /> },
            ]}
          />
        </Panel>

        <Panel title="Profile details" icon={UserIcon} className="lg:col-span-2">
          <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4" noValidate>
            <FormField label="Full name" id="full_name" error={errors.full_name?.message} required>
              <Input id="full_name" autoComplete="name" aria-invalid={!!errors.full_name} {...register('full_name')} />
            </FormField>
            <FormField
              label="Email address"
              id="email_disabled"
              helperText="Your primary email cannot be changed without re-verification."
            >
              <Input id="email_disabled" value={user?.email || ''} disabled className="font-mono text-xs" />
            </FormField>
            <FormField
              label="Avatar URL"
              id="avatar_url"
              error={errors.avatar_url?.message}
              helperText="Optional. Must be an absolute https:// URL."
            >
              <Input
                id="avatar_url"
                placeholder="https://"
                aria-invalid={!!errors.avatar_url}
                className="font-mono text-xs"
                {...register('avatar_url')}
              />
            </FormField>
            <div className="flex items-center justify-between gap-3 pt-1">
              <Link
                href="/settings?section=security"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Change password <ArrowRight className="h-3 w-3" />
              </Link>
              <Button type="submit" size="sm" disabled={isUpdatingProfile || !isDirty}>
                <Save className="h-3.5 w-3.5" />
                {isUpdatingProfile ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Panel>
      </div>

      <SessionsPanel />
    </div>
  );
}
