import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { findingService, FindingListParams } from '@/services/finding.service';
import { FindingStatus } from '@/types/finding';

export function useFindings(params?: FindingListParams) {
  return useQuery({
    queryKey: ['findings', params],
    queryFn: () => findingService.listFindings(params),
  });
}

export function useFinding(findingId: string) {
  return useQuery({
    queryKey: ['finding', findingId],
    queryFn: () => findingService.getFinding(findingId),
    enabled: !!findingId,
  });
}

export function useFindingHistory(findingId: string) {
  return useQuery({
    queryKey: ['finding-history', findingId],
    queryFn: () => findingService.getHistory(findingId),
    enabled: !!findingId,
  });
}

export function useChangeFindingStatus(findingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: FindingStatus; rationale?: string; review_date?: string }) =>
      findingService.changeStatus(findingId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finding', findingId] });
      qc.invalidateQueries({ queryKey: ['finding-history', findingId] });
      qc.invalidateQueries({ queryKey: ['findings'] });
    },
  });
}
