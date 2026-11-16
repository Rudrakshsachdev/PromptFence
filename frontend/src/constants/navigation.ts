import {
  Activity,
  BarChart3,
  Crosshair,
  FileText,
  Fingerprint,
  FlaskConical,
  GitCompareArrows,
  LayoutDashboard,
  Layers,
  LibraryBig,
  Scale,
  ScrollText,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** One-line description used by the command palette. */
  description: string;
  /** Additional path prefixes that should activate this item. */
  match?: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'Monitor',
    items: [
      {
        title: 'Overview',
        href: '/overview',
        icon: LayoutDashboard,
        description: 'Security posture, recent executions and critical findings',
      },
    ],
  },
  {
    title: 'Testing',
    items: [
      {
        title: 'Targets',
        href: '/targets',
        icon: Crosshair,
        description: 'LLM, agent and HTTP endpoints under test',
      },
      {
        title: 'Test Suites',
        href: '/test-suites',
        icon: Layers,
        description: 'Ordered collections of attack scenarios',
      },
      {
        title: 'Scenarios',
        href: '/scenarios',
        icon: LibraryBig,
        description: 'Adversarial scenario library',
      },
      {
        title: 'Test Runs',
        href: '/test-runs',
        icon: Activity,
        description: 'Execution monitoring and case-level evidence',
      },
    ],
  },
  {
    title: 'Security',
    items: [
      {
        title: 'Canary & Provenance',
        href: '/provenance',
        icon: Fingerprint,
        description: 'Canary token lifecycle and taint provenance inspector',
      },
      {
        title: 'Findings',
        href: '/findings',
        icon: ShieldAlert,
        description: 'Vulnerability triage and evidence',
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        description: 'Security score, trends and distributions',
      },
      {
        title: 'Regression Testing',
        href: '/regression',
        icon: GitCompareArrows,
        description: 'Baselines and run-to-run comparison',
      },
    ],
  },
  {
    title: 'Research',
    items: [
      {
        title: 'Security Evaluation',
        href: '/evaluation',
        icon: Scale,
        description: 'Paired security–utility evaluation and over-refusal',
      },
      {
        title: 'Research Experiments',
        href: '/evaluation/experiments',
        icon: FlaskConical,
        description: 'Ground-truth provenance experiments and metrics',
      },
    ],
  },
  {
    title: 'Governance',
    items: [
      {
        title: 'Reports',
        href: '/reports',
        icon: FileText,
        description: 'Evidence reports and exports',
      },
      {
        title: 'Audit Logs',
        href: '/audit-logs',
        icon: ScrollText,
        description: 'Workspace activity trail',
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Account, security and platform configuration',
        match: ['/profile'],
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAVIGATION_SECTIONS.flatMap((s) => s.items);

/**
 * Resolves the active nav item by longest matching prefix, so nested routes
 * (e.g. /evaluation/experiments/…) activate the most specific entry.
 */
export function getActiveNavHref(pathname: string): string | null {
  let best: { href: string; length: number } | null = null;
  for (const item of ALL_NAV_ITEMS) {
    for (const prefix of [item.href, ...(item.match ?? [])]) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        if (!best || prefix.length > best.length) best = { href: item.href, length: prefix.length };
      }
    }
  }
  return best?.href ?? null;
}

/** Human labels for URL segments, used by breadcrumbs. */
export const SEGMENT_LABELS: Record<string, string> = {
  overview: 'Overview',
  targets: 'Targets',
  'test-suites': 'Test Suites',
  scenarios: 'Scenarios',
  'test-runs': 'Test Runs',
  cases: 'Cases',
  provenance: 'Canary & Provenance',
  findings: 'Findings',
  analytics: 'Analytics',
  regression: 'Regression Testing',
  evaluation: 'Security Evaluation',
  experiments: 'Research Experiments',
  reports: 'Reports',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
  profile: 'Profile',
  new: 'New',
  edit: 'Edit',
};
