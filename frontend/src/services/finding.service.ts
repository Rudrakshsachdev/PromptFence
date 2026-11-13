import { apiClient } from '@/lib/api-client';
import { PaginatedResponse } from '@/types/api';
import { TaintFinding } from '@/types/finding';

export const findingService = {
  listFindings: (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    severity?: string;
    test_run_id?: string;
  }) =>
    apiClient<PaginatedResponse<TaintFinding>>('/api/v1/findings', {
      params,
    }),

  getFinding: (findingId: string) =>
    apiClient<TaintFinding>(`/api/v1/findings/${findingId}`),
};
