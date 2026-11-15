import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export function useAnalyticsOverview(params?: { days?: number; target_id?: string; test_run_id?: string }) {
  return useQuery({
    queryKey: ['analytics-overview', params],
    queryFn: () => analyticsService.getOverview(params),
  });
}

export function useAnalyticsDistribution(params?: { days?: number; target_id?: string }) {
  return useQuery({
    queryKey: ['analytics-distribution', params],
    queryFn: () => analyticsService.getDistribution(params),
  });
}

export function useAnalyticsTrends(params?: { days?: number; target_id?: string }) {
  return useQuery({
    queryKey: ['analytics-trends', params],
    queryFn: () => analyticsService.getTrends(params),
  });
}

export function useTargetComparisons() {
  return useQuery({
    queryKey: ['target-comparisons'],
    queryFn: () => analyticsService.getTargetComparisons(),
  });
}

export function useTargetVersionComparisons(targetId: string) {
  return useQuery({
    queryKey: ['target-version-comparisons', targetId],
    queryFn: () => analyticsService.getTargetVersionComparisons(targetId),
    enabled: !!targetId,
  });
}
