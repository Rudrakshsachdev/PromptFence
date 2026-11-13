import { apiClient } from '@/lib/api-client';
import { PaginatedResponse } from '@/types/api';
import {
  AssertionResult,
  DynamicCanary,
  ExecutionEvent,
  ExecutionLog,
  TargetTrace,
  TestRun,
  TestRunCase,
  TestRunCreate,
  TestRunProgress,
} from '@/types/test-run';
import { TaintFinding } from '@/types/finding';

export const testRunService = {
  createTestRun: (data: TestRunCreate) =>
    apiClient<TestRun>('/api/v1/test-runs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listTestRuns: (params?: {
    page?: number;
    page_size?: number;
    target_id?: string;
    test_suite_id?: string;
    status?: string;
  }) =>
    apiClient<PaginatedResponse<TestRun>>('/api/v1/test-runs', {
      params,
    }),

  getTestRun: (runId: string) =>
    apiClient<TestRun>(`/api/v1/test-runs/${runId}`),

  cancelTestRun: (runId: string) =>
    apiClient<TestRun>(`/api/v1/test-runs/${runId}/cancel`, {
      method: 'POST',
    }),

  getTestRunProgress: (runId: string) =>
    apiClient<TestRunProgress>(`/api/v1/test-runs/${runId}/progress`),

  listRunCases: (runId: string) =>
    apiClient<TestRunCase[]>(`/api/v1/test-runs/${runId}/cases`),

  getCaseDetail: (runId: string, caseId: string) =>
    apiClient<TestRunCase>(`/api/v1/test-runs/${runId}/cases/${caseId}`),

  getCaseEvents: (runId: string, caseId: string) =>
    apiClient<ExecutionEvent[]>(`/api/v1/test-runs/${runId}/cases/${caseId}/events`),

  getCaseLogs: (runId: string, caseId: string) =>
    apiClient<ExecutionLog[]>(`/api/v1/test-runs/${runId}/cases/${caseId}/logs`),

  getCaseAssertions: (runId: string, caseId: string) =>
    apiClient<AssertionResult[]>(`/api/v1/test-runs/${runId}/cases/${caseId}/assertions`),

  getCaseTraces: (runId: string, caseId: string) =>
    apiClient<TargetTrace[]>(`/api/v1/test-runs/${runId}/cases/${caseId}/traces`),

  getRunFindings: (runId: string) =>
    apiClient<TaintFinding[]>(`/api/v1/test-runs/${runId}/findings`),

  getRunCanaries: (runId: string) =>
    apiClient<DynamicCanary[]>(`/api/v1/test-runs/${runId}/canaries`),

  getRunEvents: (runId: string) =>
    apiClient<ExecutionEvent[]>(`/api/v1/test-runs/${runId}/events`),
};
