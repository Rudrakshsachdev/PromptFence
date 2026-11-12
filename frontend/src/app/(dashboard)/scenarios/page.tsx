'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  Filter,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  Trash2,
  Wrench,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SearchInput } from '@/components/forms/search-input';
import { PageActions, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SeverityBadge } from '@/components/shared/severity-badge';
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
import { toast } from 'sonner';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Vectors' },
  { id: 'PROMPT_INJECTION', label: 'Prompt Injection' },
  { id: 'DATA_DISCLOSURE', label: 'Data Disclosure' },
  { id: 'TOOL_EXECUTION', label: 'Tool Execution' },
  { id: 'INSTRUCTION_CONFLICT', label: 'Instruction Conflict' },
  { id: 'REGRESSION', label: 'Regression' },
];

export default function ScenariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const { data, isLoading, refetch, isRefetching } = useScenarios({
    category: selectedCategory !== 'ALL' ? (selectedCategory as ScenarioCategory) : undefined,
    severity: selectedSeverity !== 'ALL' ? (selectedSeverity as ScenarioSeverity) : undefined,
  });

  const deleteMutation = useDeleteScenario();
  const statusMutation = useUpdateScenarioStatus();
  const [scenarioToDelete, setScenarioToDelete] = useState<TestCase | null>(null);

  const allItems = data?.items || [];
  const scenarios = allItems.filter((s) =>
    debouncedSearch
      ? s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : true
  );

  const handleToggleStatus = (scenario: TestCase) => {
    statusMutation.mutate(
      { id: scenario.id, isEnabled: !scenario.is_enabled },
      {
        onSuccess: () => {
          toast.success(`Scenario ${!scenario.is_enabled ? 'armed' : 'disabled'}`);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Scenario Library"
        description="Catalog of adversarial test scenarios targeting prompt injection, data extraction, and tool bypasses."
        badge={
          <Badge variant="outline" className="text-xs font-mono font-medium bg-slate-100 text-slate-700">
            {allItems.length} Vectors
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
            <Link href="/scenarios/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Author Scenario
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Search scenarios by name or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Severity Filter */}
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="h-8 text-xs w-[130px] bg-white border-slate-200">
              <SelectValue placeholder="Severity" />
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

      {/* Scenarios Table */}
      <Card className="border border-slate-200/80 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : scenarios.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={ShieldAlert}
                title="No attack scenarios found"
                description={
                  searchTerm || selectedCategory !== 'ALL' || selectedSeverity !== 'ALL'
                    ? 'No scenarios match your active search or filter selection.'
                    : 'Get started by creating your first adversarial prompt scenario.'
                }
                actionText={
                  searchTerm || selectedCategory !== 'ALL' || selectedSeverity !== 'ALL'
                    ? 'Reset Filters'
                    : 'Author First Scenario'
                }
                onAction={
                  searchTerm || selectedCategory !== 'ALL' || selectedSeverity !== 'ALL'
                    ? () => {
                        setSearchTerm('');
                        setSelectedCategory('ALL');
                        setSelectedSeverity('ALL');
                      }
                    : undefined
                }
                actionHref={
                  searchTerm || selectedCategory !== 'ALL' || selectedSeverity !== 'ALL'
                    ? undefined
                    : '/scenarios/new'
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Scenario Identity</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Attack Vector</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Severity</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Target Coverage</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((scenario) => {
                  const targetsList = scenario.applicable_target_types || ['ALL'];
                  return (
                    <TableRow key={scenario.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Description */}
                      <TableCell className="max-w-[280px]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-amber-50 text-amber-600 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400">
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/scenarios/${scenario.id}`}
                              className="font-semibold text-xs text-slate-900 hover:text-teal-600 transition-colors truncate block"
                            >
                              {scenario.name}
                            </Link>
                            {scenario.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                                {scenario.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <CategoryBadge category={scenario.category as ScenarioCategory} />
                      </TableCell>

                      {/* Severity */}
                      <TableCell>
                        <SeverityBadge severity={scenario.severity as ScenarioSeverity} />
                      </TableCell>

                      {/* Target coverage chips */}
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {targetsList.slice(0, 2).map((tgt) => (
                            <span
                              key={tgt}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 text-slate-600"
                            >
                              {tgt}
                            </span>
                          ))}
                          {targetsList.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              +{targetsList.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <button
                          onClick={() => handleToggleStatus(scenario)}
                          className="focus:outline-none transition-transform active:scale-95"
                          title="Click to toggle status"
                        >
                          <StatusBadge
                            isActive={scenario.is_enabled}
                            activeText="Armed"
                            inactiveText="Disabled"
                          />
                        </button>
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
                              Scenario Options
                            </DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/scenarios/${scenario.id}`} className="cursor-pointer">
                                <ExternalLink className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                <span>Inspect Vector</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/scenarios/${scenario.id}/edit`} className="cursor-pointer">
                                <Wrench className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                <span>Edit Scenario</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setScenarioToDelete(scenario)}
                              className="cursor-pointer text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5 text-red-500" />
                              <span>Delete Scenario</span>
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
        open={!!scenarioToDelete}
        onOpenChange={(open) => !open && setScenarioToDelete(null)}
        title="Delete Attack Scenario?"
        description={`Are you sure you want to delete "${scenarioToDelete?.name}"? It will be removed from all associated test suites.`}
        confirmText="Delete Scenario"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (scenarioToDelete) {
            deleteMutation.mutate(scenarioToDelete.id, {
              onSuccess: () => {
                setScenarioToDelete(null);
                toast.success('Scenario deleted successfully');
              },
            });
          }
        }}
      />
    </div>
  );
}
