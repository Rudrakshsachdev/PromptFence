'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { targetService } from '@/services/target.service';

/** Enables/disables a target via PATCH /targets/{id}/status. */
export function useToggleTargetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      targetService.updateTargetStatus(id, isActive),
    onSuccess: (target) => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['target', target.id] });
      toast.success(target.is_active ? `${target.name} enabled` : `${target.name} disabled`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update target status');
    },
  });
}
