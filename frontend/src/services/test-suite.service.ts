import { apiClient } from '@/lib/api-client';
import { PaginatedResponse, SuccessResponse } from '@/types/api';
import { TestSuite, TestSuiteCreate, TestSuiteUpdate } from '@/types/test-suite';

export const testSuiteService = {
  async getSuites(page = 1, pageSize = 20): Promise<PaginatedResponse<TestSuite>> {
    return apiClient<PaginatedResponse<TestSuite>>('/api/v1/test-suites', {
      params: { page, page_size: pageSize },
    });
  },

  async getSuite(id: string): Promise<TestSuite> {
    return apiClient<TestSuite>(`/api/v1/test-suites/${id}`);
  },

  async createSuite(data: TestSuiteCreate): Promise<TestSuite> {
    return apiClient<TestSuite>('/api/v1/test-suites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSuite(id: string, data: TestSuiteUpdate): Promise<TestSuite> {
    return apiClient<TestSuite>(`/api/v1/test-suites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteSuite(id: string): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>(`/api/v1/test-suites/${id}`, {
      method: 'DELETE',
    });
  },

  async addScenario(suiteId: string, testCaseId: string, executionOrder = 0): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>(`/api/v1/test-suites/${suiteId}/scenarios`, {
      method: 'POST',
      body: JSON.stringify({ test_case_id: testCaseId, execution_order: executionOrder }),
    });
  },

  async removeScenario(suiteId: string, scenarioId: string): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>(`/api/v1/test-suites/${suiteId}/scenarios/${scenarioId}`, {
      method: 'DELETE',
    });
  },

  async reorderScenarios(
    suiteId: string,
    scenarioOrders: Array<{ suite_test_case_id: string; execution_order: number }>
  ): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>(`/api/v1/test-suites/${suiteId}/scenarios/order`, {
      method: 'PATCH',
      body: JSON.stringify({ scenario_orders: scenarioOrders }),
    });
  },
};

