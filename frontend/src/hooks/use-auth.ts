'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { getRedirectFromLocation } from '@/lib/auth-redirect';

export { useAuth };

/**
 * Send an already-signed-in visitor away from guest-only pages (sign in,
 * register) to their requested destination or the dashboard.
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getRedirectFromLocation());
    }
  }, [isAuthenticated, isLoading, router]);
}
