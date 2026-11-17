import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportService } from '@/services/report.service';
import { ReportCreate, ReportJob } from '@/types/report';

/** Poll the report list only while a job is still generating. */
export function reportListPollInterval(jobs: ReportJob[] | undefined): number | false {
  return jobs?.some((job) => job.status === 'QUEUED' || job.status === 'RUNNING') ? 3000 : false;
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.listReports(),
    refetchInterval: (query) => reportListPollInterval(query.state.data),
  });
}

export function useReport(jobId: string) {
  return useQuery({
    queryKey: ['report', jobId],
    queryFn: () => reportService.getReport(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'COMPLETED' || data.status === 'FAILED')) {
        return false;
      }
      return 2000;
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportCreate) => reportService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report generation job queued');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to request report generation');
    },
  });
}
