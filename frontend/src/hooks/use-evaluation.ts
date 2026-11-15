import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { evaluationService } from '@/services/evaluation.service';
import { ExperimentCreate } from '@/types/evaluation';

export function useSecurityUtilitySummary(testRunId: string) {
  return useQuery({
    queryKey: ['security-utility', testRunId],
    queryFn: () => evaluationService.getSecurityUtilitySummary(testRunId),
    enabled: !!testRunId,
  });
}

export function useExperiments() {
  return useQuery({
    queryKey: ['experiments'],
    queryFn: () => evaluationService.listExperiments(),
  });
}

export function useExperiment(experimentId: string) {
  return useQuery({
    queryKey: ['experiment', experimentId],
    queryFn: () => evaluationService.getExperiment(experimentId),
    enabled: !!experimentId,
  });
}

export function useCreateExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExperimentCreate) => evaluationService.createExperiment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Research experiment registered');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create experiment');
    },
  });
}

export function useRunExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (experimentId: string) => evaluationService.runExperiment(experimentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast.success('Experiment execution and metric evaluation completed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Experiment execution failed');
    },
  });
}
