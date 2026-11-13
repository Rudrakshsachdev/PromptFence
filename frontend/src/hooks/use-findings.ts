import { useQuery } from '@tanstack/react-query';
import { findingService } from '@/services/finding.service';

export function useFindings(params?: {
  page?: number;
  page_size?: number;
  category?: string;
  severity?: string;
  test_run_id?: string;
}) {
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
