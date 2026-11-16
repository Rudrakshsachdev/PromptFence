'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { ErrorState } from '@/components/shared/error-state';
import { TableSkeleton } from '@/components/shared/skeletons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Enables client-side sorting on this column. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
  /** Hide this column below a breakpoint to keep tables readable on small screens. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

export type SortState = { id: string; direction: 'asc' | 'desc' } | null;

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  getRowId: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Rendered when `data` is an empty array. */
  empty?: React.ReactNode;
  /** Whole-row navigation. Rows become keyboard-focusable. */
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  initialSort?: SortState;
  /** Controlled sort (server-side sorting). When provided, rows are not re-sorted locally. */
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  skeletonRows?: number;
  className?: string;
  /** Accessible table label. */
  label?: string;
}

const HIDE_CLASS = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
} as const;

const ALIGN_CLASS = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/**
 * Generic, typed data table with sortable columns, loading, error and empty
 * states. Pagination is composed separately with <Pagination />.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading = false,
  error,
  onRetry,
  empty,
  onRowClick,
  rowClassName,
  initialSort = null,
  sort: controlledSort,
  onSortChange,
  skeletonRows = 6,
  className,
  label,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<SortState>(initialSort);
  const isControlled = controlledSort !== undefined;
  const sort = isControlled ? controlledSort : localSort;

  const rows = useMemo(() => {
    if (!data) return [];
    if (isControlled || !sort) return data;
    const column = columns.find((c) => c.id === sort.id);
    if (!column?.sortValue) return data;
    const getValue = column.sortValue;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      return va > vb ? dir : -dir;
    });
  }, [data, sort, columns, isControlled]);

  const toggleSort = (id: string) => {
    const next: SortState =
      sort?.id !== id
        ? { id, direction: 'desc' }
        : sort.direction === 'desc'
          ? { id, direction: 'asc' }
          : null;
    if (!isControlled) setLocalSort(next);
    onSortChange?.(next);
  };

  if (error) {
    return (
      <div className="p-4">
        <ErrorState error={error} onRetry={onRetry} compact />
      </div>
    );
  }

  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} columns={Math.min(columns.length, 6)} />;
  }

  if (data && data.length === 0 && empty) {
    return <div className="p-4">{empty}</div>;
  }

  return (
    <Table className={className} aria-label={label}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((col) => {
            // In controlled (server-side) mode `sortValue` only flags the column as sortable.
            const sortable = !!col.sortValue;
            const active = sort?.id === col.id;
            return (
              <TableHead
                key={col.id}
                className={cn(
                  ALIGN_CLASS[col.align ?? 'left'],
                  col.hideBelow && HIDE_CLASS[col.hideBelow],
                  col.headerClassName,
                )}
                aria-sort={
                  active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : undefined
                }
              >
                {sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.id)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded uppercase tracking-[0.05em] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                      active && 'text-foreground',
                    )}
                  >
                    {col.header}
                    {active ? (
                      sort?.direction === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 opacity-50" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={getRowId(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row);
                  }
                : undefined
            }
            tabIndex={onRowClick ? 0 : undefined}
            className={cn(
              onRowClick &&
                'cursor-pointer focus-visible:bg-surface/60 focus-visible:outline-none',
              rowClassName?.(row),
            )}
          >
            {columns.map((col) => (
              <TableCell
                key={col.id}
                className={cn(
                  ALIGN_CLASS[col.align ?? 'left'],
                  col.hideBelow && HIDE_CLASS[col.hideBelow],
                  col.className,
                )}
              >
                {col.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
