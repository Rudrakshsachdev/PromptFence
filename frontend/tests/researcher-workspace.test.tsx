import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getActiveNavHref, RESEARCHER_NAV_ITEMS } from '@/constants/navigation';
import { canAccessResearcherWorkspace, getHomeRoute, usesResearcherWorkspace } from '@/lib/roles';
import type { User } from '@/types/auth';

const base = {
  id: 'u',
  email: 'x@example.com',
  full_name: 'X',
  is_active: true,
  is_verified: true,
  created_at: '',
  updated_at: '',
  permissions: [],
};
const admin: User = { ...base, roles: ['admin'] };
const researcher: User = { ...base, roles: ['security_researcher'] };
const viewer: User = { ...base, roles: ['viewer'] };

// ── Role routing (decided from /auth/me roles only) ─────────────────────────

describe('role routing', () => {
  it.each([
    ['admin', admin, '/overview'],
    ['security_researcher', researcher, '/security/researcher'],
    ['viewer', viewer, '/overview'],
    ['signed out', null, '/overview'],
  ])('%s lands on %s', (_label, user, home) => {
    expect(getHomeRoute(user)).toBe(home);
  });

  it('an admin who also holds the researcher role keeps the admin workspace', () => {
    const both = { ...base, roles: ['admin', 'security_researcher'] };
    expect(usesResearcherWorkspace(both)).toBe(false);
    expect(getHomeRoute(both)).toBe('/overview');
  });

  it('only researchers and admins may open the researcher workspace', () => {
    expect(canAccessResearcherWorkspace(researcher)).toBe(true);
    expect(canAccessResearcherWorkspace(admin)).toBe(true);
    expect(canAccessResearcherWorkspace(viewer)).toBe(false);
    expect(canAccessResearcherWorkspace(null)).toBe(false);
  });
});

describe('researcher navigation', () => {
  it('has the nine security workspace entries and no administrative ones', () => {
    expect(RESEARCHER_NAV_ITEMS.map((i) => i.title)).toEqual([
      'Security Overview',
      'Targets',
      'Security Assessments',
      'Test Executions',
      'Findings & Vulnerabilities',
      'Attack Evidence',
      'Regression Testing',
      'Security Analytics',
      'Security Reports',
    ]);
    expect(RESEARCHER_NAV_ITEMS.map((i) => i.href)).not.toContain('/settings');
    expect(RESEARCHER_NAV_ITEMS.map((i) => i.href)).not.toContain('/audit-logs');
  });

  it.each([
    ['/security/researcher', '/security/researcher'],
    ['/security/researcher/assessments', '/security/researcher/assessments'],
    ['/test-runs/new', '/security/researcher/assessments'],
    ['/test-suites/abc', '/security/researcher/assessments'],
    ['/test-runs/abc', '/test-runs'],
    ['/findings/f1', '/findings'],
    ['/provenance', '/provenance'],
  ])('%s highlights %s', (path, active) => {
    expect(getActiveNavHref(path, RESEARCHER_NAV_ITEMS)).toBe(active);
  });
});

// ── Workspace guard ─────────────────────────────────────────────────────────

const auth = vi.hoisted(() => ({ user: null as User | null }));
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: auth.user }),
  usePermissions: () => ({
    can: (p: string) => !!auth.user && (auth.user.roles.includes('admin') || auth.user.permissions?.includes(p)),
  }),
}));

describe('researcher workspace guard', () => {
  it('renders the workspace for a researcher', async () => {
    auth.user = researcher;
    const { default: Layout } = await import('@/app/(dashboard)/security/researcher/layout');
    render(
      <Layout>
        <p>workspace</p>
      </Layout>,
    );
    expect(screen.getByText('workspace')).toBeInTheDocument();
  });

  it('blocks a viewer opening the URL directly and points to their dashboard', async () => {
    auth.user = viewer;
    const { default: Layout } = await import('@/app/(dashboard)/security/researcher/layout');
    render(
      <Layout>
        <p>workspace</p>
      </Layout>,
    );
    expect(screen.queryByText('workspace')).not.toBeInTheDocument();
    expect(screen.getByText('This workspace is for security researchers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to your dashboard/i })).toHaveAttribute('href', '/overview');
  });
});

// ── Pages render API data only ──────────────────────────────────────────────

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false, error: null, refetch: vi.fn() });
const hooks = vi.hoisted(() => ({
  useSecurityOverview: vi.fn(),
  useFindings: vi.fn(),
  useTestRuns: vi.fn(),
  useComparisons: vi.fn(),
  useAnalyticsTrends: vi.fn(),
  useTargets: vi.fn(),
  useTestSuites: vi.fn(),
  listTestRuns: vi.fn(),
}));
vi.mock('@/hooks/use-security', () => ({ useSecurityOverview: hooks.useSecurityOverview }));
vi.mock('@/hooks/use-findings', () => ({ useFindings: hooks.useFindings }));
vi.mock('@/hooks/use-test-runs', () => ({ useTestRuns: hooks.useTestRuns }));
vi.mock('@/hooks/use-regression', () => ({ useComparisons: hooks.useComparisons }));
vi.mock('@/hooks/use-analytics', () => ({ useAnalyticsTrends: hooks.useAnalyticsTrends }));
vi.mock('@/hooks/use-targets', () => ({ useTargets: hooks.useTargets }));
vi.mock('@/hooks/use-test-suites', () => ({ useTestSuites: hooks.useTestSuites }));
vi.mock('@/services/test-run.service', () => ({ testRunService: { listTestRuns: hooks.listTestRuns } }));

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => nav, usePathname: () => '/security/researcher' }));

const OVERVIEW = {
  runs: { total: 8, assessed_targets: 3, by_status: { PENDING: 0, QUEUED: 1, RUNNING: 2, COMPLETED: 4, FAILED: 1, CANCELLED: 0 } },
  findings: {
    total: 24,
    by_status: { OPEN: 15, ACKNOWLEDGED: 2, RESOLVED: 5, FALSE_POSITIVE: 1, ACCEPTED_RISK: 1 },
    by_severity: { CRITICAL: 9, HIGH: 6, MEDIUM: 3, LOW: 6, INFO: 0 },
    open_by_severity: { CRITICAL: 7, HIGH: 4, MEDIUM: 2, LOW: 2, INFO: 0 },
  },
  top_targets: [{ target_id: 't-1', target_name: 'Vulnerable target', findings: 20, open_findings: 12, critical: 8, high: 5 }],
  categories: [{ category: 'PROMPT_INJECTION', findings: 10, open_findings: 6 }],
  recent_status_changes: [
    { finding_id: 'f-9', finding_title: 'Old leak', severity: 'HIGH', old_status: 'OPEN', new_status: 'RESOLVED', changed_at: '2026-11-16T10:00:00Z' },
  ],
};
const FINDING = {
  id: 'f-1', test_run_id: 'run-1234-aaaa', title: 'System prompt disclosed', severity: 'CRITICAL', status: 'OPEN',
  category: 'DATA_DISCLOSURE', attribution_level: 'OBSERVED_CANARY', observed_at: '2026-11-17T08:00:00Z',
};
const RUN = {
  id: 'run-1234-aaaa', status: 'RUNNING', target: { name: 'Vulnerable target' }, test_suite: { name: 'OWASP suite' },
  total_cases: 10, completed_cases: 4, passed_cases: 3, failed_cases: 1, started_at: '2026-11-17T07:00:00Z',
  created_at: '2026-11-17T07:00:00Z', completed_at: null,
};

describe('Security overview page', () => {
  beforeEach(() => {
    auth.user = researcher;
    hooks.useSecurityOverview.mockReturnValue(ok(OVERVIEW));
    hooks.useFindings.mockReturnValue(ok({ items: [FINDING], total: 1, page: 1, page_size: 5, total_pages: 1 }));
    hooks.useTestRuns.mockReturnValue(ok({ items: [RUN], total: 1, page: 1, page_size: 8, total_pages: 1 }));
    hooks.useComparisons.mockReturnValue(ok([]));
    hooks.useAnalyticsTrends.mockReturnValue(ok({ granularity: 'daily', points: [] }));
  });

  it('shows posture metrics straight from the overview API', async () => {
    const { default: Page } = await import('@/app/(dashboard)/security/researcher/page');
    render(<Page />);
    const posture = within(screen.getByRole('region', { name: 'Security posture' }));

    expect(posture.getByRole('link', { name: /assessed targets/i })).toHaveTextContent('3');
    expect(posture.getByRole('link', { name: /active assessments/i })).toHaveTextContent('2 running · 1 queued');
    expect(posture.getByRole('link', { name: /open critical findings/i })).toHaveTextContent('7');
    expect(posture.getByRole('link', { name: /open critical findings/i })).toHaveAttribute(
      'href',
      '/findings?severity=CRITICAL&status=OPEN',
    );
    expect(posture.getByRole('link', { name: /resolved findings/i })).toHaveTextContent('5');
  });

  it('lists critical findings with execution reference and an investigate action', async () => {
    const { default: Page } = await import('@/app/(dashboard)/security/researcher/page');
    render(<Page />);
    const attention = within(screen.getByRole('region', { name: 'Requires attention' }));

    expect(attention.getByText('System prompt disclosed')).toBeInTheDocument();
    expect(attention.getByRole('link', { name: /execution run-1234/i })).toHaveAttribute('href', '/test-runs/run-1234-aaaa');
    expect(attention.getByRole('link', { name: /^investigate$/i })).toHaveAttribute('href', '/findings/f-1');
    expect(attention.getByText('Exact token match')).toBeInTheDocument();
  });

  it('ranks targets by findings and links to their filtered findings', async () => {
    const { default: Page } = await import('@/app/(dashboard)/security/researcher/page');
    render(<Page />);

    expect(screen.getByRole('link', { name: 'Vulnerable target' })).toHaveAttribute('href', '/findings?target=t-1');
    expect(screen.getByText(/not evidence they are secure/i)).toBeInTheDocument();
  });

  it('merges executions, findings and triage decisions into one activity feed', async () => {
    const { default: Page } = await import('@/app/(dashboard)/security/researcher/page');
    render(<Page />);
    const feed = within(screen.getByRole('region', { name: 'Recent security activity' }));

    expect(feed.getByText(/new critical finding/i).closest('a')).toHaveAttribute('href', '/findings/f-1');
    expect(feed.getByText(/assessment running on/i).closest('a')).toHaveAttribute('href', '/test-runs/run-1234-aaaa');
    expect(feed.getByText(/finding marked/i).closest('a')).toHaveAttribute('href', '/findings/f-9');
  });

  it('shows an honest empty state instead of claiming targets are secure', async () => {
    hooks.useFindings.mockReturnValue(ok({ items: [], total: 0, page: 1, page_size: 5, total_pages: 0 }));
    const { default: Page } = await import('@/app/(dashboard)/security/researcher/page');
    render(<Page />);

    expect(screen.getByText('No open critical findings')).toBeInTheDocument();
    expect(screen.getByText(/not a guarantee that targets are secure/i)).toBeInTheDocument();
  });
});

describe('Security assessments page', () => {
  beforeEach(() => {
    auth.user = researcher;
    hooks.useTargets.mockReturnValue(ok({ items: [{ id: 't-1', name: 'Vulnerable target', is_active: true }] }));
    hooks.useTestSuites.mockReturnValue(ok({ items: [{ id: 's-1', name: 'OWASP suite', is_active: true, scenario_count: 5 }] }));
    hooks.useComparisons.mockReturnValue(ok([]));
    hooks.listTestRuns.mockResolvedValue({
      items: [RUN, { ...RUN, id: 'run-done', status: 'COMPLETED', completed_at: '2026-11-17T07:30:00Z' }],
      total: 2,
      page: 1,
      page_size: 50,
      total_pages: 1,
    });
  });

  async function renderPage() {
    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
    const { default: Page } = await import('@/app/(dashboard)/security/researcher/assessments/page');
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Page />
      </QueryClientProvider>,
    );
  }

  it('hands a chosen target and suite to the existing launcher', async () => {
    const user = userEvent.setup();
    await renderPage();
    const launch = screen.getByRole('button', { name: /configure & launch/i });
    expect(launch).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Target'), 't-1');
    await user.selectOptions(screen.getByLabelText('Attack suite'), 's-1');
    await user.click(launch);

    expect(nav.push).toHaveBeenCalledWith('/test-runs/new?target=t-1&suite=s-1');
  });

  it('separates in-progress executions from finished outcomes', async () => {
    await renderPage();

    const activePanel = (await screen.findByRole('heading', { name: 'Active assessments' })).closest('section')!;
    expect(await within(activePanel).findByText('4/10 cases · 1 failed so far')).toBeInTheDocument();
    const outcomes = screen.getByRole('heading', { name: 'Assessment outcomes' }).closest('section')!;
    expect(within(outcomes).getAllByRole('row')).toHaveLength(2); // header + the completed run only
  });
});
