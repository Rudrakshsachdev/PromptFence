'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SearchInput } from '@/components/forms/search-input';
import { PageActions, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SCENARIO_CATEGORIES, SCENARIO_SEVERITIES } from '@/constants/scenarios';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useDeleteScenario,
  useScenarios,
  useUpdateScenarioStatus,
} from '@/hooks/use-scenarios';
import { formatDate } from '@/lib/utils';
import { ScenarioCategory, ScenarioSeverity, TestCase } from '@/types/scenario';

export default function ScenariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const { data, isLoading } = useScenarios({
    category: selectedCategory !== 'ALL' ? (selectedCategory as ScenarioCategory) : undefined,
    severity: selectedSeverity !== 'ALL' ? (selectedSeverity as ScenarioSeverity) : undefined,
  });

  const deleteMutation = useDeleteScenario();
  const statusMutation = useUpdateScenarioStatus();
  const [scenarioToDelete, setScenarioToDelete] = useState<TestCase | null>(null);

  const scenarios = (data?.items || []).filter((s) =>
    debouncedSearch ? s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scenario Library"
        description="Pre-configured adversarial scenarios evaluating prompt injection, canary leakage, and tool bypasses."
      >
        <PageActions>
          <Button asChild size="sm">
            <Link href="/scenarios/new">
              <Plus className="h-4 w-4 mr-1.5" /> Author Scenario
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchInput
          placeholder="Filter scenarios by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-44 text-xs h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {SCENARIO_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="w-36 text-xs h-9">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              {SCENARIO_SEVERITIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : scenarios.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ShieldAlert}
                title="No scenarios found"
                description={
                  searchTerm || selectedCategory !== 'ALL' || selectedSeverity !== 'ALL'
                    ? 'No scenarios match the selected criteria.'
                    : 'Start by creating your first attack scenario template.'
                }
                actionText="Create Scenario"
                actionHref="/scenarios/new"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((tc) => (
                  <TableRow key={tc.id}>
                    <TableCell className="font-semibold text-sm">
                      <Link
                        href={`/scenarios/${tc.id}`}
                        className="text-slate-900 hover:text-teal-600 hover:underline dark:text-white"
                      >
                        {tc.name}
                      </Link>
                      {tc.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{tc.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={tc.category} />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={tc.severity} />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          statusMutation.mutate({
                            id: tc.id,
                            isEnabled: !tc.is_enabled,
                          })
                        }
                        title="Click to toggle status"
                      >
                        <StatusBadge
                          isActive={tc.is_enabled}
                          activeText="Enabled"
                          inactiveText="Disabled"
                        />
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(tc.created_at)}
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
                            <Link href={`/scenarios/${tc.id}`}>Inspect Template</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/scenarios/${tc.id}/edit`}>Edit Scenario</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setScenarioToDelete(tc)}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Scenario
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
        open={!!scenarioToDelete}
        onOpenChange={(open) => !open && setScenarioToDelete(null)}
        title="Delete Scenario"
        description={`Are you sure you want to delete "${scenarioToDelete?.name}"? It will also be removed from any associated test suites.`}
        confirmText="Delete Scenario"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (scenarioToDelete) {
            deleteMutation.mutate(scenarioToDelete.id, {
              onSuccess: () => setScenarioToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}

