import { apiClient } from '@/lib/api-client';
import {
  BaselineCreate,
  RegressionComparison,
  RegressionLaunchRequest,
  SecurityBaseline,
} from '@/types/regression';

export const regressionService = {
  createBaseline: (data: BaselineCreate) =>
    apiClient<SecurityBaseline>('/api/v1/regression/baselines', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listBaselines: (params?: { target_id?: string }) =>
    apiClient<SecurityBaseline[]>('/api/v1/regression/baselines', { params }),

  getBaseline: (baselineId: string) =>
    apiClient<SecurityBaseline>(`/api/v1/regression/baselines/${baselineId}`),

  executeRegression: (data: RegressionLaunchRequest) =>
    apiClient<RegressionComparison>('/api/v1/regression/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getComparison: (comparisonId: string) =>
    apiClient<RegressionComparison>(`/api/v1/regression/comparisons/${comparisonId}`),

  listComparisons: (params?: { baseline_id?: string }) =>
    apiClient<RegressionComparison[]>('/api/v1/regression/comparisons', { params }),
};
