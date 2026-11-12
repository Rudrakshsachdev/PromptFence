'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardService.getOverview(),
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardService.getActivity(),
  });
}

export function useDashboardDistributions() {
  return useQuery({
    queryKey: ['dashboard-distributions'],
    queryFn: () => dashboardService.getDistributions(),
  });
}

