'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FolderKanban, MoreVertical, Plus, Trash2 } from 'lucide-react';
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

export default function TestSuitesPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const { data, isLoading } = useTestSuites(page, 20);
  const deleteMutation = useDeleteTestSuite();
  const [suiteToDelete, setSuiteToDelete] = useState<TestSuite | null>(null);

  const suites = (data?.items || []).filter((s) =>
    debouncedSearch ? s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Suites"
        description="Organize attack scenarios into ordered test suites for regression testing and evaluation runs."
      >
        <PageActions>
          <Button asChild size="sm">
            <Link href="/test-suites/new">
              <Plus className="h-4 w-4 mr-1.5" /> New Test Suite
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          placeholder="Filter test suites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : suites.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FolderKanban}
                title="No test suites found"
                description={
                  searchTerm
                    ? 'No test suites match your search.'
                    : 'Group adversarial scenarios together by creating your first test suite.'
                }
                actionText={searchTerm ? undefined : 'Create Suite'}
                actionHref={searchTerm ? undefined : '/test-suites/new'}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suite Name</TableHead>
                  <TableHead>Assigned Scenarios</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suites.map((suite) => (
                  <TableRow key={suite.id}>
                    <TableCell className="font-semibold text-sm">
                      <Link
                        href={`/test-suites/${suite.id}`}
                        className="text-slate-900 hover:text-teal-600 hover:underline dark:text-white"
                      >
                        {suite.name}
                      </Link>
                      {suite.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{suite.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium text-xs">
                        {suite.scenario_count} scenarios
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={suite.is_active} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(suite.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/test-suites/${suite.id}`}>Manage Scenarios</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/test-suites/${suite.id}/edit`}>Edit Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setSuiteToDelete(suite)}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Suite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!suiteToDelete}
        onOpenChange={(open) => !open && setSuiteToDelete(null)}
        title="Delete Test Suite"
        description={`Are you sure you want to delete "${suiteToDelete?.name}"? Scenario definitions themselves will remain preserved in the scenario library.`}
        confirmText="Delete Suite"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (suiteToDelete) {
            deleteMutation.mutate(suiteToDelete.id, {
              onSuccess: () => setSuiteToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}

