'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

/** Footer pagination for server- or client-paginated tables. */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  itemLabel = 'results',
  className,
}: PaginationProps) {
  const pages = Math.max(totalPages, 1);
  const start = total !== undefined && pageSize ? (total === 0 ? 0 : (page - 1) * pageSize + 1) : null;
  const end = total !== undefined && pageSize ? Math.min(page * pageSize, total) : null;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="tabular-nums">
        {start !== null && end !== null && total !== undefined ? (
          <>
            <span className="text-foreground">
              {formatNumber(start)}–{formatNumber(end)}
            </span>{' '}
            of {formatNumber(total)} {itemLabel}
          </>
        ) : (
          <>
            Page <span className="text-foreground">{page}</span> of {pages}
          </>
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="xs"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        <span className="px-1.5 tabular-nums">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="xs"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/** Client-side pagination helper for endpoints that return full arrays. */
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    totalPages,
    total: items.length,
  };
}
