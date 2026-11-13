export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  requiredRole?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        title: 'Dashboard',
        href: '/overview',
        iconName: 'LayoutDashboard',
      },
    ],
  },
  {
    title: 'APPLICATION SECURITY',
    items: [
      {
        title: 'Targets',
        href: '/targets',
        iconName: 'Crosshair',
      },
      {
        title: 'Test Suites',
        href: '/test-suites',
        iconName: 'FolderKanban',
      },
      {
        title: 'Scenario Library',
        href: '/scenarios',
        iconName: 'ShieldAlert',
      },
      {
        title: 'Test Runs',
        href: '/test-runs',
        iconName: 'FlaskConical',
      },
      {
        title: 'Security Findings',
        href: '/findings',
        iconName: 'AlertTriangle',
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      {
        title: 'Profile',
        href: '/profile',
        iconName: 'User',
      },
      {
        title: 'Settings',
        href: '/settings',
        iconName: 'Settings',
      },
    ],
  },
];

