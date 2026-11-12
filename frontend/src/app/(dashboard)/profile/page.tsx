'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Save,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { FormField } from '@/components/forms/form-field';
import { PasswordInput } from '@/components/forms/password-input';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { formatDate } from '@/lib/utils';
import { authService } from '@/services/auth.service';
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
  const { user, refreshUser } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  useEffect(() => {
    if (user) {
      resetProfile({
        full_name: user.full_name,
        avatar_url: user.avatar_url || '',
      });
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
      toast.success('Profile details updated successfully');
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="User Profile"
        description="Manage your identity credentials, role permissions, and access password."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: User Identity Card */}
        <div className="space-y-6">
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto mb-3">
                <div className="h-20 w-20 rounded-full bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-2xl uppercase border-2 border-teal-500/20 shadow-xs">
                  {user?.full_name ? user.full_name[0] : 'U'}
                </div>
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                {user?.full_name || 'Security Researcher'}
              </CardTitle>
              <p className="text-xs font-mono text-slate-400">{user?.email}</p>
              <div className="pt-2 flex justify-center">
                <Badge variant="outline" className="text-[10px] font-mono bg-teal-50 text-teal-700 border-teal-200">
                  Active Member
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 text-xs border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Account ID:</span>
                <span className="font-mono text-[10px] text-slate-600 truncate max-w-[120px]">
                  {user?.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verified:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Confirmed
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Password Cipher:</span>
                <span className="font-mono text-slate-700 text-[11px]">Argon2id (RFC 9106)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Details */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-teal-600" />
                <span>General Profile Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                <FormField
                  label="Full Name"
                  id="full_name"
                  error={profileErrors.full_name?.message}
                  required
                >
                  <Input id="full_name" {...registerProfile('full_name')} className="h-9 text-xs" />
                </FormField>

                <FormField
                  label="Work Email Address"
                  id="email_disabled"
                  helperText="Primary email cannot be changed without re-verification."
                >
                  <Input
                    id="email_disabled"
                    value={user?.email || ''}
                    disabled
                    className="h-9 text-xs font-mono bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </FormField>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isUpdatingProfile}
                    size="sm"
                    className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    {isUpdatingProfile ? 'Saving...' : 'Save Profile Details'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-teal-600" />
                <span>Change Account Password</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
                <FormField
                  label="Current Password"
                  id="current_password"
                  error={passwordErrors.current_password?.message}
                  required
                >
                  <PasswordInput
                    id="current_password"
                    placeholder="••••••••••••"
                    {...registerPassword('current_password')}
                    disabled={isChangingPassword}
                  />
                </FormField>

                <FormField
                  label="New Secure Password"
                  id="new_password"
                  error={passwordErrors.new_password?.message}
                  required
                  helperText="Min. 8 characters with 1 uppercase letter and 1 number."
                >
                  <PasswordInput
                    id="new_password"
                    placeholder="••••••••••••"
                    showStrength
                    value={newPasswordVal}
                    {...registerPassword('new_password')}
                    disabled={isChangingPassword}
                  />
                </FormField>

                <FormField
                  label="Confirm New Password"
                  id="confirm_password"
                  error={passwordErrors.confirm_password?.message}
                  required
                >
                  <PasswordInput
                    id="confirm_password"
                    placeholder="••••••••••••"
                    {...registerPassword('confirm_password')}
                    disabled={isChangingPassword}
                  />
                </FormField>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    size="sm"
                    className="h-8 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs"
                  >
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    {isChangingPassword ? 'Changing Password...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
