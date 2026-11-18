/**
 * Overview page wiring: every KPI, chart and table still reads from the same
 * hooks after the redesign, and failed requests show errors (not empty states).
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import OverviewPage from '@/app/(dashboard)/overview/page';

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false, error: null, refetch: vi.fn() });
const failed = () => ({ data: undefined, isLoading: false, isError: true, error: new Error('Request failed'), refetch: vi.fn() });

const hooks = vi.hoisted(() => ({
  useDashboardOverview: vi.fn(),
  useDashboardActivity: vi.fn(),
  useAnalyticsOverview: vi.fn(),
  useAnalyticsTrends: vi.fn(),
  useAnalyticsDistribution: vi.fn(),
  useTargetComparisons: vi.fn(),
  useTestRuns: vi.fn(),
  useFindings: vi.fn(),
  useComparisons: vi.fn(),
}));

vi.mock('@/hooks/use-dashboard', () => ({
  useDashboardOverview: hooks.useDashboardOverview,
  useDashboardActivity: hooks.useDashboardActivity,
}));
vi.mock('@/hooks/use-analytics', () => ({
  useAnalyticsOverview: hooks.useAnalyticsOverview,
  useAnalyticsTrends: hooks.useAnalyticsTrends,
  useAnalyticsDistribution: hooks.useAnalyticsDistribution,
  useTargetComparisons: hooks.useTargetComparisons,
}));
vi.mock('@/hooks/use-test-runs', () => ({ useTestRuns: hooks.useTestRuns }));
vi.mock('@/hooks/use-findings', () => ({ useFindings: hooks.useFindings }));
vi.mock('@/hooks/use-regression', () => ({ useComparisons: hooks.useComparisons }));

const permissions = vi.hoisted(() => ({ granted: true }));
vi.mock('@/hooks/use-auth', () => ({
  usePermissions: () => ({ can: () => permissions.granted }),
}));

const rate = (numerator: number, denominator: number) => ({
  numerator,
  denominator,
  percentage: denominator ? (numerator / denominator) * 100 : 0,
  definition: 'share of canaries exposed',
});

beforeEach(() => {
  vi.clearAllMocks();
  permissions.granted = true;
  hooks.useDashboardOverview.mockReturnValue(ok({ total_targets: 3, active_targets: 2 }));
  hooks.useDashboardActivity.mockReturnValue(ok({ activities: [] }));
  hooks.useAnalyticsOverview.mockReturnValue(
    ok({
      total_test_runs: 8,
      total_cases_executed: 40,
      total_findings: 24,
      high_findings: 6,
      critical_findings: 9,
      active_canaries_monitored: 40,
      canary_exposure_rate: rate(24, 40),
      tool_violation_rate: rate(1, 10),
      benign_pass_rate: rate(9, 10),
      false_positive_rate: rate(0, 10),
      security_score: { score: 71.5, grade: 'C', total_eligible_cases: 40, coverage_pct: 80, formula_version: 'v1' },
    }),
  );
  hooks.useAnalyticsTrends.mockReturnValue(
    ok({
      granularity: 'day',
      points: [
        { date: '2026-11-15', runs_count: 3, findings_count: 10, canary_exposures: 7, tool_violations: 1, security_score: 70, benign_pass_rate: 90 },
        { date: '2026-11-16', runs_count: 5, findings_count: 14, canary_exposures: 17, tool_violations: 0, security_score: 72, benign_pass_rate: 90 },
      ],
    }),
  );
  hooks.useAnalyticsDistribution.mockReturnValue(ok({ by_severity: [], by_category: [] }));
  hooks.useTargetComparisons.mockReturnValue(ok([]));
  hooks.useTestRuns.mockReturnValue(ok({ items: [], total: 0, page: 1, page_size: 100, total_pages: 0 }));
  hooks.useFindings.mockReturnValue(ok({ items: [], total: 9, page: 1, page_size: 5, total_pages: 2 }));
  hooks.useComparisons.mockReturnValue(ok([]));
});

const kpis = () => within(screen.getByRole('region', { name: 'Key metrics' }));

describe('Overview page', () => {
  it('keeps the page outline: h1, section h2s, panel h3s', () => {
    render(<OverviewPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Security overview' })).toBeInTheDocument();
    for (const name of ['Key metrics', 'Security posture', 'Findings & exposure', 'Executions & activity', 'Targets']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { level: 3, name: 'Posture score' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Target security overview' })).toBeInTheDocument();
  });

  it('renders KPI values from the API hooks with their drill-down links', () => {
    render(<OverviewPage />);

    const links = kpis().getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/targets',
      '/test-runs',
      '/findings',
      '/findings?severity=CRITICAL&status=OPEN',
      '/provenance',
      '/regression',
    ]);
    expect(links[0]).toHaveTextContent('Targets3');
    expect(links[1]).toHaveTextContent('40 cases · 30d');
    expect(links[2]).toHaveTextContent('24');
    expect(links[3]).toHaveTextContent('9 open, untriaged');
    expect(links[4]).toHaveTextContent('60.0% of 40 canaries');
  });

  it('draws sparklines only from the real daily trend series', () => {
    render(<OverviewPage />);

    const lines = kpis().getAllByTestId('sparkline');
    expect(lines).toHaveLength(3);
    expect(lines[0].querySelector('title')).toHaveTextContent('8 test runs over the last 30 days · peak 5 in a day');
    expect(lines[1].querySelector('title')).toHaveTextContent('24 findings over the last 30 days');
    expect(lines[2].querySelector('title')).toHaveTextContent('24 canary exposures over the last 30 days');
  });

  it('omits sparklines when there is not enough history', () => {
    hooks.useAnalyticsTrends.mockReturnValue(ok({ granularity: 'day', points: [] }));
    render(<OverviewPage />);

    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
  });

  it('shows an error, not "No test runs yet", when the runs request fails', () => {
    hooks.useTestRuns.mockReturnValue(failed());
    render(<OverviewPage />);

    const statusPanel = screen.getByRole('heading', { level: 3, name: 'Execution status' }).closest('section')!;
    expect(within(statusPanel).queryByText('No test runs yet')).not.toBeInTheDocument();
    expect(within(statusPanel).getByText('Unavailable')).toBeInTheDocument();
    expect(within(statusPanel).getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows errors for failed distribution and activity requests', () => {
    hooks.useAnalyticsDistribution.mockReturnValue(failed());
    hooks.useDashboardActivity.mockReturnValue(failed());
    render(<OverviewPage />);

    for (const name of ['Findings by severity', 'Vulnerability categories', 'Recent activity']) {
      const panel = screen.getByRole('heading', { level: 3, name }).closest('section')!;
      expect(within(panel).getByRole('button', { name: /retry/i })).toBeInTheDocument();
    }
    expect(screen.queryByText('No recent activity.')).not.toBeInTheDocument();
  });

  it('shows per-target rates as the API returns them (already percentages, not ratios)', () => {
    hooks.useTargetComparisons.mockReturnValue(
      ok([
        {
          target_id: 't-1',
          target_name: 'Mock Vulnerable Target',
          target_type: 'CHAT_API',
          target_version: '1.0.0',
          runs_count: 3,
          cases_evaluated: 15,
          security_score: 0,
          critical_findings: 9,
          high_findings: 6,
          canary_exposure_rate: 160.0,
          tool_violation_rate: 20.0,
          coverage_sufficient: true,
          coverage_warning: null,
        },
      ]),
    );
    render(<OverviewPage />);

    const row = screen.getByRole('link', { name: 'Mock Vulnerable Target' }).closest('tr')!;
    expect(within(row).getByText('160.0%')).toBeInTheDocument();
    expect(within(row).getByText('20.0%')).toBeInTheDocument();
    expect(within(row).queryByText('16000.0%')).not.toBeInTheDocument();
  });

  it('hides "Register target" from users without targets:write', () => {
    permissions.granted = false;
    render(<OverviewPage />);

    expect(screen.queryByRole('link', { name: /register target/i })).not.toBeInTheDocument();
    // Read-only users still get everything they are allowed to see
    expect(screen.getByRole('heading', { level: 1, name: 'Security overview' })).toBeInTheDocument();
  });

  it('keeps the primary actions', () => {
    render(<OverviewPage />);

    expect(screen.getByRole('link', { name: /register target/i })).toHaveAttribute('href', '/targets/new');
    // Header action, plus the empty-state CTA when there are no runs yet.
    const launch = screen.getAllByRole('link', { name: /launch test run/i });
    expect(launch.length).toBeGreaterThanOrEqual(1);
    for (const link of launch) expect(link).toHaveAttribute('href', '/test-runs/new');
  });
});
