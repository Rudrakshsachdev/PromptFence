'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Laptop, LogOut, ShieldCheck, User } from 'lucide-react';
import { FormField } from '@/components/forms/form-field';
import { PasswordInput } from '@/components/forms/password-input';
import { PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { formatDate } from '@/lib/utils';
import { authService } from '@/services/auth.service';
import { Session } from '@/types/auth';
import { toast } from 'sonner';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const newPasswordVal = watchPassword('new_password');

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await authService.getSessions();
      setSessions(data);
    } catch {
      // Ignore if session call fails
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (user) {
      resetProfile({
        full_name: user.full_name,
        avatar_url: user.avatar_url || '',
      });
      loadSessions();
    }
  }, [user, resetProfile]);

  const onUpdateProfile = async (values: ProfileFormValues) => {
    setIsUpdatingProfile(true);
    try {
      await authService.updateProfile({
        full_name: values.full_name,
        avatar_url: values.avatar_url || undefined,
      });
      await refreshUser();
      toast.success('Profile details saved successfully');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to update profile');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onChangePassword = async (values: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      resetPassword();
      toast.success('Password changed successfully. All other sessions have been logged out.');
      loadSessions();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onRevokeSession = async (sessionId: string) => {
    try {
      await authService.revokeSession(sessionId);
      toast.success('Session revoked');
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
      toast.success('Logged out from all devices');
      logout();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to terminate all sessions');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Account Profile & Security"
        description="Manage your credentials, active browser sessions, and personal identity."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="h-20 w-20 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-2xl uppercase mx-auto mb-3">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <CardTitle className="text-lg">{user?.full_name}</CardTitle>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Email Status:</span>
              <Badge variant={user?.is_verified ? 'success' : 'warning'}>
                {user?.is_verified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Assigned Roles:</span>
              <div className="flex gap-1">
                {user?.roles?.map((r) => (
                  <Badge key={r} variant="outline" className="font-mono text-[10px]">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Member Since:</span>
              <span className="font-medium text-slate-700">{formatDate(user?.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Update Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <User className="h-4 w-4 mr-2 text-teal-600" /> Personal Identity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
              <FormField label="Full Name" id="full_name" error={profileErrors.full_name?.message} required>
                <Input id="full_name" {...registerProfile('full_name')} />
              </FormField>

              <FormField
                label="Avatar URL (Optional)"
                id="avatar_url"
                error={profileErrors.avatar_url?.message}
                description="Link to an external profile avatar image"
              >
                <Input id="avatar_url" placeholder="https://..." {...registerProfile('avatar_url')} />
              </FormField>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center">
            <KeyRound className="h-4 w-4 mr-2 text-teal-600" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4 max-w-md">
            <FormField
              label="Current Password"
              id="current_password"
              error={passwordErrors.current_password?.message}
              required
            >
              <PasswordInput id="current_password" {...registerPassword('current_password')} />
            </FormField>

            <FormField
              label="New Password"
              id="new_password"
              error={passwordErrors.new_password?.message}
              required
            >
              <PasswordInput
                id="new_password"
                showStrength
                value={newPasswordVal}
                {...registerPassword('new_password')}
              />
            </FormField>

            <FormField
              label="Confirm New Password"
              id="confirm_password"
              error={passwordErrors.confirm_password?.message}
              required
            >
              <PasswordInput id="confirm_password" {...registerPassword('confirm_password')} />
            </FormField>

            <div className="pt-2">
              <Button type="submit" size="sm" disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating Password...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Browser Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center">
              <Laptop className="h-4 w-4 mr-2 text-teal-600" /> Active Device Sessions
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Devices currently signed in with active refresh tokens
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogoutAll} className="text-red-600">
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out All Devices
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No active sessions found.</p>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    {sess.device_info || 'Browser Session'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Connected: {formatDate(sess.created_at)}
                    {sess.last_used_at && ` • Last active: ${formatDate(sess.last_used_at)}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSessionToRevoke(sess)}
                  className="text-xs text-slate-500 hover:text-red-600"
                >
                  Revoke
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!sessionToRevoke}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
        title="Revoke Session"
        description="Terminating this session will immediately disconnect the device."
        confirmText="Revoke Session"
        variant="destructive"
        onConfirm={() => {
          if (sessionToRevoke) {
            onRevokeSession(sessionToRevoke.id);
          }
        }}
      />
    </div>
  );
}

