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
  new: 'Create',
  edit: 'Edit Configuration',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
      <Link
        href="/overview"
        className="text-slate-400 hover:text-slate-700 transition-colors flex items-center p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
        const label = isUuid
          ? `ID: ${segment.slice(0, 8)}`
          : segmentLabels[segment] ||
            (segment.length > 16 ? `${segment.slice(0, 12)}...` : segment.replace(/-/g, ' '));

        return (
          <React.Fragment key={href}>
            <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600 shrink-0" />
            {isLast ? (
              <span className="text-slate-900 font-semibold dark:text-slate-200 capitalize">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-slate-900 transition-colors capitalize text-slate-500 hover:underline underline-offset-4"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
