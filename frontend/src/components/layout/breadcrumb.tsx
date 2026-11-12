'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const segmentLabels: Record<string, string> = {
  overview: 'Dashboard',
  targets: 'Targets',
  'test-suites': 'Test Suites',
  scenarios: 'Scenario Library',
  profile: 'Profile',
  settings: 'Settings',
  new: 'Create New',
  edit: 'Edit',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
      <Link href="/overview" className="hover:text-slate-900 transition-colors flex items-center">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const label = segmentLabels[segment] || (segment.length > 12 ? `${segment.slice(0, 8)}...` : segment);

        return (
          <React.Fragment key={href}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            {isLast ? (
              <span className="text-slate-900 font-semibold dark:text-slate-200">{label}</span>
            ) : (
              <Link href={href} className="hover:text-slate-900 transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

