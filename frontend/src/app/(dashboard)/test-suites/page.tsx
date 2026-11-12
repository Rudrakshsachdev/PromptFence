'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  FolderKanban,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Wrench,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SearchInput } from '@/components/forms/search-input';
import { PageActions, PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { useDeleteTestSuite, useTestSuites } from '@/hooks/use-test-suites';
import { formatDate } from '@/lib/utils';
import { TestSuite } from '@/types/test-suite';
import { toast } from 'sonner';

export default function TestSuitesPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const { data, isLoading, refetch, isRefetching } = useTestSuites(page, 50);
  const deleteMutation = useDeleteTestSuite();
  const [suiteToDelete, setSuiteToDelete] = useState<TestSuite | null>(null);

  const allItems = data?.items || [];
  const suites = allItems.filter((s) =>
    debouncedSearch
      ? s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : true
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Test Suites"
        description="Organize attack scenarios into ordered test suites for security regression evaluations and compliance checks."
        badge={
          <Badge variant="outline" className="text-xs font-mono font-medium bg-slate-100 text-slate-700">
            {allItems.length} Suites
          </Badge>
        }
      >
        <PageActions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8 text-xs text-slate-600"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild size="sm" className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs">
            <Link href="/test-suites/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Test Suite
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Search test suites by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Test Suites Table */}
      <Card className="border border-slate-200/80 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : suites.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={FolderKanban}
                title="No test suites found"
                description={
                  searchTerm
                    ? 'No test suites match your search query.'
                    : 'Group adversarial scenarios together by creating your first evaluation suite.'
                }
                actionText={searchTerm ? undefined : 'Create First Suite'}
                actionHref={searchTerm ? undefined : '/test-suites/new'}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Suite Identity</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Scenarios Included</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Created</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suites.map((suite) => {
                  const scenarioCount = suite.suite_test_cases?.length ?? 0;
                  return (
                    <TableRow key={suite.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Description */}
                      <TableCell className="max-w-[280px]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-purple-50 text-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-purple-400">
                            <FolderKanban className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/test-suites/${suite.id}`}
                              className="font-semibold text-xs text-slate-900 hover:text-teal-600 transition-colors truncate block"
                            >
                              {suite.name}
                            </Link>
                            {suite.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                                {suite.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Scenarios Count Badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono px-2 py-0.5 bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1.5 w-fit"
                        >
                          <ShieldAlert className="h-3 w-3 text-teal-600" />
                          <span>{scenarioCount} scenarios</span>
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge isActive={suite.is_active} />
                      </TableCell>

                      {/* Created */}
                      <TableCell className="text-right text-[11px] font-mono text-slate-400">
                        {formatDate(suite.created_at)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400">
                              Suite Options
                            </DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/test-suites/${suite.id}`} className="cursor-pointer">
                                <ExternalLink className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                <span>Inspect Scenarios</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/test-suites/${suite.id}/edit`} className="cursor-pointer">
                                <Wrench className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                <span>Edit Suite Info</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setSuiteToDelete(suite)}
                              className="cursor-pointer text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5 text-red-500" />
                              <span>Delete Suite</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!suiteToDelete}
        onOpenChange={(open) => !open && setSuiteToDelete(null)}
        title="Delete Test Suite?"
        description={`Are you sure you want to delete "${suiteToDelete?.name}"? The contained scenarios will remain intact in your scenario library.`}
        confirmText="Delete Suite"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (suiteToDelete) {
            deleteMutation.mutate(suiteToDelete.id, {
              onSuccess: () => {
                setSuiteToDelete(null);
                toast.success('Test suite deleted successfully');
              },
            });
          }
        }}
      />
    </div>
  );
}
