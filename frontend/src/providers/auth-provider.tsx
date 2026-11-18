'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { ApiError, onSessionExpired } from '@/lib/api-client';
import { getHomeRoute } from '@/lib/roles';
import { User } from '@/types/auth';

interface LoginOptions {
  /** Already-validated in-app path to open after sign-in (see getSafeRedirect). */
  redirectTo?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { email: string; password: string }, options?: LoginOptions) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SESSION_NOT_ESTABLISHED_MESSAGE =
  'Signed in, but your session could not be established. Make sure cookies are enabled for this site and try again.';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadUser = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // The API client reports when a 401 could not be recovered by refreshing.
  // Drop the stale user (protected layouts then redirect to sign-in) and any
  // data cached under that session.
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        queryClient.clear();
      }),
    [queryClient],
  );

  const login = async (data: { email: string; password: string }, options: LoginOptions = {}) => {
    await authService.login(data);
    // Never show another account's cached server state to the new session.
    queryClient.clear();

    const currentUser = await loadUser();
    if (!currentUser) {
      throw new ApiError(SESSION_NOT_ESTABLISHED_MESSAGE, 401, 'SESSION_NOT_ESTABLISHED');
    }
    // A requested deep link wins; otherwise land on the workspace for the user's role.
    router.replace(options.redirectTo ?? getHomeRoute(currentUser));
  };

  const register = async (data: { email: string; password: string; full_name: string }) => {
    await authService.register(data);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      queryClient.clear();
      router.replace('/auth/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
