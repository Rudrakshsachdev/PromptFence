import { apiClient } from '@/lib/api-client';
import { PaginatedResponse, SuccessResponse } from '@/types/api';
import { ScenarioCategory, ScenarioSeverity, TestCase, TestCaseCreate, TestCaseUpdate } from '@/types/scenario';

export const scenarioService = {
  async getScenarios(options: {
    page?: number;
    pageSize?: number;
    category?: ScenarioCategory;
    severity?: ScenarioSeverity;
  } = {}): Promise<PaginatedResponse<TestCase>> {
    const { page = 1, pageSize = 20, category, severity } = options;
    return apiClient<PaginatedResponse<TestCase>>('/api/v1/scenarios', {
      params: { page, page_size: pageSize, category, severity },
    });
  },

  async getScenario(id: string): Promise<TestCase> {
    return apiClient<TestCase>(`/api/v1/scenarios/${id}`);
  },

  async createScenario(data: TestCaseCreate): Promise<TestCase> {
    return apiClient<TestCase>('/api/v1/scenarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateScenario(id: string, data: TestCaseUpdate): Promise<TestCase> {
    return apiClient<TestCase>(`/api/v1/scenarios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteScenario(id: string): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>(`/api/v1/scenarios/${id}`, {
      method: 'DELETE',
    });
  },

  async updateScenarioStatus(id: string, isEnabled: boolean): Promise<TestCase> {
    return apiClient<TestCase>(`/api/v1/scenarios/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_enabled: isEnabled }),
    });
  },
};

