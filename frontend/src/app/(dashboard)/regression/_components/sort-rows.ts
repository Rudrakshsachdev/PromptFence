import type { DataTableColumn, SortState } from '@/components/shared/data-table';

/** Sorts a full list by a DataTable column's `sortValue` (used before client-side pagination). */
export function sortRows<T>(rows: T[], columns: DataTableColumn<T>[], sort: SortState): T[] {
  if (!sort) return rows;
  const getValue = columns.find((c) => c.id === sort.id)?.sortValue;
  if (!getValue) return rows;
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    if (va === vb) return 0;
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    return va > vb ? dir : -dir;
  });
}
