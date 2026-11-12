'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { targetService } from '@/services/target.service';
import { TargetCreate, TargetUpdate } from '@/types/target';
import { toast } from 'sonner';

export function useTargets(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['targets', page, pageSize],
    queryFn: () => targetService.getTargets(page, pageSize),
  });
}

export function useTarget(id: string) {
  return useQuery({
    queryKey: ['target', id],
    queryFn: () => targetService.getTarget(id),
    enabled: !!id,
  });
}

export function useTargetVersions(id: string) {
  return useQuery({
    queryKey: ['target-versions', id],
    queryFn: () => targetService.getTargetVersions(id),
    enabled: !!id,
  });
}

export function useCreateTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TargetCreate) => targetService.createTarget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Target created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create target');
    },
  });
}

export function useUpdateTarget(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TargetUpdate) => targetService.updateTarget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target', id] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['target-versions', id] });
      toast.success('Target updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update target');
    },
  });
}

export function useDeleteTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => targetService.deleteTarget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Target deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete target');
    },
  });
}

export function useValidateTarget(id: string) {
  return useMutation({
    mutationFn: () => targetService.validateTarget(id),
    onSuccess: (data) => {
      if (data.reachable) {
        toast.success(`Connected successfully (Status: ${data.status_code}, ${data.response_time_ms}ms)`);
      } else {
        toast.error(data.error || 'Connection failed');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Validation request failed');
    },
  });
}

