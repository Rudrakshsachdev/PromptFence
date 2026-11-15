import { apiClient } from '@/lib/api-client';
import { ReportCreate, ReportJob } from '@/types/report';

export const reportService = {
  createReport: (data: ReportCreate) =>
    apiClient<ReportJob>('/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listReports: () =>
    apiClient<ReportJob[]>('/api/v1/reports'),

  getReport: (jobId: string) =>
    apiClient<ReportJob>(`/api/v1/reports/${jobId}`),

  getDownloadUrl: (jobId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/reports/${jobId}/download`,
};
