import { apiClient } from '@/lib/api-client';
import { DashboardActivity, DashboardDistributions, DashboardOverview } from '@/types/dashboard';

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    return apiClient<DashboardOverview>('/api/v1/dashboard/overview');
  },

  async getActivity(): Promise<DashboardActivity> {
    return apiClient<DashboardActivity>('/api/v1/dashboard/activity');
  },

  async getDistributions(): Promise<DashboardDistributions> {
    return apiClient<DashboardDistributions>('/api/v1/dashboard/distributions');
  },
};

