import { apiClient } from '@/lib/api-client';
import { PaginatedResponse, SuccessResponse } from '@/types/api';
import { Target, TargetCreate, TargetUpdate, TargetValidationResult, TargetVersion } from '@/types/target';

export const targetService = {
  async getTargets(page = 1, pageSize = 20): Promise<PaginatedResponse<Target>> {
    return apiClient<PaginatedResponse<Target>>('/api/v1/targets', {
      params: { page, page_size: pageSize },
    });
  },

  async getTarget(id: string): Promise<Target> {
    return apiClient<Target>(`/api/v1/targets/${id}`);
  },

  async createTarget(data: TargetCreate): Promise<Target> {
    return apiClient<Target>('/api/v1/targets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTarget(id: string, data: TargetUpdate): Promise<Target> {
    return apiClient<Target>(`/api/v1/targets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteTarget(id: string): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>(`/api/v1/targets/${id}`, {
      method: 'DELETE',
    });
  },

  async validateTarget(id: string): Promise<TargetValidationResult> {
    return apiClient<TargetValidationResult>(`/api/v1/targets/${id}/validate`, {
      method: 'POST',
    });
  },

  async getTargetVersions(id: string): Promise<TargetVersion[]> {
    return apiClient<TargetVersion[]>(`/api/v1/targets/${id}/versions`);
  },

  async updateTargetStatus(id: string, isActive: boolean): Promise<Target> {
    return apiClient<Target>(`/api/v1/targets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },
};

