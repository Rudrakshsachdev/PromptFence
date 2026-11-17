import { describe, expect, it } from 'vitest';
import { reportListPollInterval } from '@/hooks/use-reports';
import type { ReportJob, ReportStatus } from '@/types/report';

const job = (status: ReportStatus) => ({ id: status, status }) as unknown as ReportJob;

describe('reportListPollInterval', () => {
  it('does not poll an idle report list', () => {
    expect(reportListPollInterval(undefined)).toBe(false);
    expect(reportListPollInterval([])).toBe(false);
    expect(reportListPollInterval([job('COMPLETED'), job('FAILED')])).toBe(false);
  });

  it.each<ReportStatus>(['QUEUED', 'RUNNING'])('polls while a job is %s', (status) => {
    expect(reportListPollInterval([job('COMPLETED'), job(status)])).toBe(3000);
  });
});
