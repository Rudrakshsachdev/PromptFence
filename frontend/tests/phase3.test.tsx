import { describe, expect, it } from 'vitest';
import { analyticsService } from '@/services/analytics.service';
import { regressionService } from '@/services/regression.service';
import { evaluationService } from '@/services/evaluation.service';
import { reportService } from '@/services/report.service';

describe('Phase 3 Services & Interfaces', () => {
  it('exports analyticsService methods', () => {
    expect(typeof analyticsService.getOverview).toBe('function');
    expect(typeof analyticsService.getDistribution).toBe('function');
    expect(typeof analyticsService.getTrends).toBe('function');
    expect(typeof analyticsService.getTargetComparisons).toBe('function');
    expect(typeof analyticsService.getTargetVersionComparisons).toBe('function');
  });

  it('exports regressionService methods', () => {
    expect(typeof regressionService.listBaselines).toBe('function');
    expect(typeof regressionService.getBaseline).toBe('function');
    expect(typeof regressionService.createBaseline).toBe('function');
    expect(typeof regressionService.listComparisons).toBe('function');
    expect(typeof regressionService.getComparison).toBe('function');
    expect(typeof regressionService.executeRegression).toBe('function');
  });

  it('exports evaluationService methods', () => {
    expect(typeof evaluationService.getSecurityUtilitySummary).toBe('function');
    expect(typeof evaluationService.listExperiments).toBe('function');
    expect(typeof evaluationService.getExperiment).toBe('function');
    expect(typeof evaluationService.createExperiment).toBe('function');
    expect(typeof evaluationService.runExperiment).toBe('function');
  });

  it('exports reportService methods', () => {
    expect(typeof reportService.listReports).toBe('function');
    expect(typeof reportService.getReport).toBe('function');
    expect(typeof reportService.createReport).toBe('function');
    expect(typeof reportService.getDownloadUrl).toBe('function');
    expect(reportService.getDownloadUrl('job-123')).toContain('/api/v1/reports/job-123/download');
  });
});
