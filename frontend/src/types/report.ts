/**
 * Evidence-Based Reporting TypeScript definitions.
 */

export type ReportFormat =
  | 'PDF'
  | 'JSON'
  | 'CSV_FINDINGS'
  | 'CSV_CASES'
  | 'CSV_ASSERTIONS'
  | 'CSV_METRICS';

export type ReportStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ReportCreate {
  title: string;
  format: ReportFormat;
  scope?: Record<string, unknown>;
}

export interface ReportJob {
  id: string;
  title: string;
  format: ReportFormat;
  scope: Record<string, unknown>;
  status: ReportStatus;
  artifact_path: string | null;
  file_size_bytes: number | null;
  content_hash: string | null;
  error_message: string | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}
