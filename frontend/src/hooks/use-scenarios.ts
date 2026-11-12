'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scenarioService } from '@/services/scenario.service';
import { ScenarioCategory, ScenarioSeverity, TestCaseCreate, TestCaseUpdate } from '@/types/scenario';
import { toast } from 'sonner';

export function useScenarios(options: {
  page?: number;
  pageSize?: number;
  category?: ScenarioCategory;
  severity?: ScenarioSeverity;
} = {}) {
  return useQuery({
    queryKey: ['scenarios', options],
    queryFn: () => scenarioService.getScenarios(options),
  });
}

export function useScenario(id: string) {
  return useQuery({
    queryKey: ['scenario', id],
    queryFn: () => scenarioService.getScenario(id),
    enabled: !!id,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TestCaseCreate) => scenarioService.createScenario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create scenario');
    },
  });
}

export function useUpdateScenario(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TestCaseUpdate) => scenarioService.updateScenario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenario', id] });
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update scenario');
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scenarioService.deleteScenario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete scenario');
    },
  });
}

export function useUpdateScenarioStatus(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: boolean | { id: string; isEnabled: boolean }) => {
      if (typeof variables === 'boolean') {
        if (!id) {
          throw new Error('Scenario ID is required');
        }
        return scenarioService.updateScenarioStatus(id, variables);
      }
      return scenarioService.updateScenarioStatus(variables.id, variables.isEnabled);
    },
    onSuccess: (_, variables) => {
      const targetId = typeof variables === 'boolean' ? id : variables.id;
      if (targetId) {
        queryClient.invalidateQueries({ queryKey: ['scenario', targetId] });
      }
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario status updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update status');
    },
  });
}

