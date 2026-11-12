'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Crosshair, MoreVertical, Plus, Trash2, Wrench } from 'lucide-react';
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
import { useDeleteTarget, useTargets, useValidateTarget } from '@/hooks/use-targets';
import { formatDate } from '@/lib/utils';
import { Target } from '@/types/target';

export default function TargetsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const { data, isLoading } = useTargets(page, 20);
  const deleteMutation = useDeleteTarget();
  const [targetToDelete, setTargetToDelete] = useState<Target | null>(null);

  const targets = (data?.items || []).filter((t) =>
    debouncedSearch ? t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Application Targets"
        description="Register and manage external AI APIs, chat systems, and agent endpoints."
      >
        <PageActions>
          <Button asChild size="sm">
            <Link href="/targets/new">
              <Plus className="h-4 w-4 mr-1.5" /> New Target
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          placeholder="Filter targets by name..."
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
          ) : targets.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Crosshair}
                title="No targets found"
                description={
                  searchTerm
                    ? 'No registered targets match your search filter.'
                    : 'Start by connecting your first AI application or API endpoint.'
                }
                actionText={searchTerm ? undefined : 'Add First Target'}
                actionHref={searchTerm ? undefined : '/targets/new'}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Name</TableHead>
                  <TableHead>Architecture</TableHead>
                  <TableHead>Endpoint URL</TableHead>
                  <TableHead>Auth Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell className="font-semibold text-sm">
                      <Link
                        href={`/targets/${target.id}`}
                        className="text-slate-900 hover:text-teal-600 hover:underline dark:text-white"
                      >
                        {target.name}
                      </Link>
                      {target.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{target.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {target.target_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {target.http_method}
                      </span>{' '}
                      {target.base_url}
                      {target.endpoint}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {target.authentication_type}
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={target.is_active} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(target.created_at)}
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
                            <Link href={`/targets/${target.id}`}>View Details & History</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/targets/${target.id}/edit`}>Edit Target</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setTargetToDelete(target)}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Target
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
        open={!!targetToDelete}
        onOpenChange={(open) => !open && setTargetToDelete(null)}
        title="Delete AI Target"
        description={`Are you sure you want to delete "${targetToDelete?.name}"? All historical version snapshots will also be permanently removed.`}
        confirmText="Delete Target"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (targetToDelete) {
            deleteMutation.mutate(targetToDelete.id, {
              onSuccess: () => setTargetToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}

