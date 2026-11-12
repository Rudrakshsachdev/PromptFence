'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { testSuiteService } from '@/services/test-suite.service';
import { TestSuiteCreate, TestSuiteUpdate } from '@/types/test-suite';
import { toast } from 'sonner';

export function useTestSuites(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['test-suites', page, pageSize],
    queryFn: () => testSuiteService.getSuites(page, pageSize),
  });
}

export function useTestSuite(id: string) {
  return useQuery({
    queryKey: ['test-suite', id],
    queryFn: () => testSuiteService.getSuite(id),
    enabled: !!id,
  });
}

export function useCreateTestSuite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TestSuiteCreate) => testSuiteService.createSuite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      toast.success('Test suite created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create test suite');
    },
  });
}

export function useUpdateTestSuite(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TestSuiteUpdate) => testSuiteService.updateSuite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suite', id] });
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      toast.success('Test suite updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update test suite');
    },
  });
}

export function useDeleteTestSuite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testSuiteService.deleteSuite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      toast.success('Test suite deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete test suite');
    },
  });
}

export function useAddScenarioToSuite(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { testCaseId: string; executionOrder: number }) =>
      testSuiteService.addScenario(suiteId, data.testCaseId, data.executionOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suite', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      toast.success('Scenario added to test suite');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add scenario');
    },
  });
}

export function useRemoveScenarioFromSuite(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenarioId: string) => testSuiteService.removeScenario(suiteId, scenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suite', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      toast.success('Scenario removed from suite');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove scenario');
    },
  });
}

