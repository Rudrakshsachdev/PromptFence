import { apiClient } from '@/lib/api-client';
import { AdapterInfo } from '@/types/test-run';

export const adapterService = {
  listAdapters: () => apiClient<AdapterInfo[]>('/api/v1/adapters'),

  checkTargetHealth: (targetId: string) =>
    apiClient<{
      target_id: string;
      is_reachable: boolean;
      status_code: number;
      latency_ms: number;
      message: string;
      timestamp: string;
    }>(`/api/v1/targets/${targetId}/health-check`, {
      method: 'POST',
    }),
};
