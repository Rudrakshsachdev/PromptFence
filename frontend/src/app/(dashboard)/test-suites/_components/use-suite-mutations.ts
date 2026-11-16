'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { testSuiteService } from '@/services/test-suite.service';

/** Enable/disable any suite by id (list rows), via PATCH /test-suites/{id}. */
export function useToggleSuiteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      testSuiteService.updateSuite(id, { is_active: isActive }),
    onSuccess: (suite) => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] });
      queryClient.invalidateQueries({ queryKey: ['test-suite', suite.id] });
      toast.success(suite.is_active ? `${suite.name} enabled` : `${suite.name} disabled`);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update suite status'),
  });
}

/** Persists a new execution order via PATCH /test-suites/{id}/scenarios/order. */
export function useReorderSuiteScenarios(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orders: Array<{ suite_test_case_id: string; execution_order: number }>) =>
      testSuiteService.reorderScenarios(suiteId, orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suite', suiteId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to reorder scenarios'),
  });
}
