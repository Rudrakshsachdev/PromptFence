import { apiClient } from '@/lib/api-client';
import {
  AnalyticsOverview,
  DistributionAnalytics,
  TargetComparisonItem,
  TargetVersionComparisonItem,
  TrendAnalytics,
} from '@/types/analytics';

export const analyticsService = {
  getOverview: (params?: { days?: number; target_id?: string; test_run_id?: string }) =>
    apiClient<AnalyticsOverview>('/api/v1/analytics/overview', { params }),

  getDistribution: (params?: { days?: number; target_id?: string }) =>
    apiClient<DistributionAnalytics>('/api/v1/analytics/distribution', { params }),

  getTrends: (params?: { days?: number; target_id?: string }) =>
    apiClient<TrendAnalytics>('/api/v1/analytics/trends', { params }),

  getTargetComparisons: () =>
    apiClient<TargetComparisonItem[]>('/api/v1/analytics/targets'),

  getTargetVersionComparisons: (targetId: string) =>
    apiClient<TargetVersionComparisonItem[]>(`/api/v1/analytics/target-versions/${targetId}`),
};
