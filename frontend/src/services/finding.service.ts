import { apiClient } from '@/lib/api-client';
import { PaginatedResponse } from '@/types/api';
import { FindingStatus, FindingStatusHistory, TaintFinding } from '@/types/finding';

export interface FindingListParams extends Record<string, string | number | boolean | undefined> {
  page?: number;
  page_size?: number;
  category?: string;
  severity?: string;
  status?: string;
  search?: string;
  sort?: string;
  test_run_id?: string;
}

export const findingService = {
  listFindings: (params?: FindingListParams) =>
    apiClient<PaginatedResponse<TaintFinding>>('/api/v1/findings', { params }),

  getFinding: (findingId: string) =>
    apiClient<TaintFinding>(`/api/v1/findings/${findingId}`),

  getHistory: (findingId: string) =>
    apiClient<FindingStatusHistory[]>(`/api/v1/findings/${findingId}/history`),

  changeStatus: (
    findingId: string,
    body: { status: FindingStatus; rationale?: string; review_date?: string },
  ) =>
    apiClient<TaintFinding>(`/api/v1/findings/${findingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};
