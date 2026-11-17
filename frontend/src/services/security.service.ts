import { apiClient } from '@/lib/api-client';
import type { SecurityOverview } from '@/types/security';

export const securityService = {
  /** Posture summary for the researcher workspace, aggregated server-side in one request. */
  getOverview: () => apiClient<SecurityOverview>('/api/v1/security/overview'),
};
