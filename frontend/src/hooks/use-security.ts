import { useQuery } from '@tanstack/react-query';
import { securityService } from '@/services/security.service';

export function useSecurityOverview() {
  return useQuery({
    queryKey: ['security', 'overview'],
    queryFn: () => securityService.getOverview(),
  });
}
