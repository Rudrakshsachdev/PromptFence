import { apiClient } from '@/lib/api-client';
import {
  EvaluationExperiment,
  ExperimentCreate,
  SecurityUtilitySummary,
} from '@/types/evaluation';

export const evaluationService = {
  getSecurityUtilitySummary: (testRunId: string) =>
    apiClient<SecurityUtilitySummary>(`/api/v1/evaluation/security-utility/${testRunId}`),

  createExperiment: (data: ExperimentCreate) =>
    apiClient<EvaluationExperiment>('/api/v1/evaluation/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  runExperiment: (experimentId: string) =>
    apiClient<EvaluationExperiment>(`/api/v1/evaluation/experiments/${experimentId}/run`, {
      method: 'POST',
    }),

  getExperiment: (experimentId: string) =>
    apiClient<EvaluationExperiment>(`/api/v1/evaluation/experiments/${experimentId}`),

  listExperiments: () =>
    apiClient<EvaluationExperiment[]>('/api/v1/evaluation/experiments'),
};
