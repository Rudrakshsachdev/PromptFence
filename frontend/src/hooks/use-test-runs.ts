import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { testRunService } from '@/services/test-run.service';
import { TestRunCreate } from '@/types/test-run';
import { toast } from 'sonner';

export function useTestRuns(params?: {
  page?: number;
  page_size?: number;
  target_id?: string;
  test_suite_id?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['test-runs', params],
    queryFn: () => testRunService.listTestRuns(params),
  });
}

export function useTestRun(runId: string) {
  return useQuery({
    queryKey: ['test-run', runId],
    queryFn: () => testRunService.getTestRun(runId),
    enabled: !!runId,
  });
}

export function useTestRunProgress(runId: string, isTerminalState: boolean = false) {
  return useQuery({
    queryKey: ['test-run-progress', runId],
    queryFn: () => testRunService.getTestRunProgress(runId),
    enabled: !!runId,
    // Poll every 1.5s while active, stop when in terminal state
    refetchInterval: isTerminalState ? false : 1500,
  });
}

export function useCreateTestRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TestRunCreate) => testRunService.createTestRun(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-runs'] });
      toast.success('Security test execution initiated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to launch test run');
    },
  });
}

export function useCancelTestRun(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => testRunService.cancelTestRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-run', runId] });
      queryClient.invalidateQueries({ queryKey: ['test-runs'] });
      toast.success('Test run cancellation requested');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to cancel test run');
    },
  });
}

export function useTestRunCases(runId: string) {
  return useQuery({
    queryKey: ['test-run-cases', runId],
    queryFn: () => testRunService.listRunCases(runId),
    enabled: !!runId,
  });
}

export function useTestCaseDetail(runId: string, caseId: string) {
  return useQuery({
    queryKey: ['test-case-detail', runId, caseId],
    queryFn: () => testRunService.getCaseDetail(runId, caseId),
    enabled: !!runId && !!caseId,
  });
}

export function useCaseAssertions(runId: string, caseId: string) {
  return useQuery({
    queryKey: ['test-case-assertions', runId, caseId],
    queryFn: () => testRunService.getCaseAssertions(runId, caseId),
    enabled: !!runId && !!caseId,
  });
}

export function useCaseTraces(runId: string, caseId: string) {
  return useQuery({
    queryKey: ['test-case-traces', runId, caseId],
    queryFn: () => testRunService.getCaseTraces(runId, caseId),
    enabled: !!runId && !!caseId,
  });
}

export function useCaseEvents(runId: string, caseId: string) {
  return useQuery({
    queryKey: ['test-case-events', runId, caseId],
    queryFn: () => testRunService.getCaseEvents(runId, caseId),
    enabled: !!runId && !!caseId,
  });
}

export function useRunFindings(runId: string) {
  return useQuery({
    queryKey: ['test-run-findings', runId],
    queryFn: () => testRunService.getRunFindings(runId),
    enabled: !!runId,
  });
}

export function useRunCanaries(runId: string) {
  return useQuery({
    queryKey: ['test-run-canaries', runId],
    queryFn: () => testRunService.getRunCanaries(runId),
    enabled: !!runId,
  });
}
