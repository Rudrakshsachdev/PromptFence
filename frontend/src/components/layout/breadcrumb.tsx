'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { SEGMENT_LABELS } from '@/constants/navigation';
import { humanize } from '@/lib/format';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Routes whose index page does not exist; their crumb renders as plain text. */
const NON_NAVIGABLE = new Set(['/test-runs/[id]/cases']);

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-[13px]">
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const pattern = `/${segments
            .slice(0, index + 1)
            .map((s) => (UUID_RE.test(s) ? '[id]' : s))
            .join('/')}`;
          const isLast = index === segments.length - 1;
          const isId = UUID_RE.test(segment);
          const label = isId ? segment.slice(0, 8) : SEGMENT_LABELS[segment] ?? humanize(segment);
          // Hide intermediate crumbs on small screens; keep the last two.
          const hideOnMobile = index < segments.length - 2;

          return (
            <li
              key={href}
              className={`flex min-w-0 items-center gap-1 ${hideOnMobile ? 'hidden md:flex' : 'flex'}`}
            >
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-subtle-foreground" aria-hidden />
              )}
              {isLast || NON_NAVIGABLE.has(pattern) ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`truncate ${isLast ? 'font-medium text-foreground' : 'text-muted-foreground'} ${isId ? 'font-mono text-xs' : ''}`}
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className={`truncate text-muted-foreground transition-colors hover:text-foreground ${isId ? 'font-mono text-xs' : ''}`}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
