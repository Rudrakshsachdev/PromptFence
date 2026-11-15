import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { regressionService } from '@/services/regression.service';
import { BaselineCreate, RegressionLaunchRequest } from '@/types/regression';

export function useBaselines(params?: { target_id?: string }) {
  return useQuery({
    queryKey: ['baselines', params],
    queryFn: () => regressionService.listBaselines(params),
  });
}

export function useBaseline(baselineId: string) {
  return useQuery({
    queryKey: ['baseline', baselineId],
    queryFn: () => regressionService.getBaseline(baselineId),
    enabled: !!baselineId,
  });
}

export function useCreateBaseline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BaselineCreate) => regressionService.createBaseline(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines'] });
      toast.success('Security baseline created successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create baseline');
    },
  });
}

export function useExecuteRegression() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegressionLaunchRequest) => regressionService.executeRegression(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comparisons'] });
      toast.success('Regression execution completed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Regression execution failed');
    },
  });
}

export function useComparison(comparisonId: string) {
  return useQuery({
    queryKey: ['comparison', comparisonId],
    queryFn: () => regressionService.getComparison(comparisonId),
    enabled: !!comparisonId,
  });
}

export function useComparisons(params?: { baseline_id?: string }) {
  return useQuery({
    queryKey: ['comparisons', params],
    queryFn: () => regressionService.listComparisons(params),
  });
}
