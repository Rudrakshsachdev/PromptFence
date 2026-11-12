'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit,
  FolderKanban,
  GripVertical,
  Layers,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageActions, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useScenarios } from '@/hooks/use-scenarios';
import {
  useAddScenarioToSuite,
  useDeleteTestSuite,
  useRemoveScenarioFromSuite,
  useTestSuite,
} from '@/hooks/use-test-suites';
import { formatDate } from '@/lib/utils';
import { ScenarioCategory, ScenarioSeverity, TestCase } from '@/types/scenario';
import { toast } from 'sonner';

export default function TestSuiteDetailPage() {
  const params = useParams();
  const suiteId = params.suiteId as string;
  const router = useRouter();

  const { data: suite, isLoading } = useTestSuite(suiteId);
  const { data: allScenariosData } = useScenarios({ pageSize: 100 });
  const addMutation = useAddScenarioToSuite(suiteId);
  const removeMutation = useRemoveScenarioFromSuite(suiteId);
  const deleteMutation = useDeleteTestSuite();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scenarioSearch, setScenarioSearch] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!suite) {
    return (
      <div className="text-center py-16 space-y-4">
        <h3 className="text-base font-bold text-slate-800">Test Suite not found</h3>
        <p className="text-xs text-slate-500">The requested test suite does not exist or has been removed.</p>
        <Button asChild size="sm">
          <Link href="/test-suites">Back to Test Suites</Link>
        </Button>
      </div>
    );
  }

  const assignedCases = suite.suite_test_cases || [];
  const assignedIds = new Set(assignedCases.map((stc) => stc.test_case_id));

  // Available scenarios for modal selector
  const availableScenarios = (allScenariosData?.items || []).filter(
    (tc) =>
      !assignedIds.has(tc.id) &&
      (scenarioSearch
        ? tc.name.toLowerCase().includes(scenarioSearch.toLowerCase()) ||
          tc.category.toLowerCase().includes(scenarioSearch.toLowerCase())
        : true)
  );

  const handleAddScenario = (testCaseId: string) => {
    const nextOrder = assignedCases.length + 1;
    addMutation.mutate(
      { testCaseId, executionOrder: nextOrder },
      {
        onSuccess: () => {
          toast.success('Scenario added to suite');
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to add scenario');
        },
      }
    );
  };

  const handleRemoveScenario = (testCaseId: string) => {
    removeMutation.mutate(testCaseId, {
      onSuccess: () => {
        toast.success('Scenario removed from suite');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to remove scenario');
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href="/test-suites">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> All Test Suites
          </Link>
        </Button>
      </div>

      {/* Header */}
      <PageHeader
        title={suite.name}
        description={suite.description || 'Evaluation Test Suite for adversarial AI verification.'}
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge isActive={suite.is_active} />
            <Badge variant="outline" className="text-[10px] font-mono bg-purple-50 text-purple-700 border-purple-200">
              {assignedCases.length} Scenarios
            </Badge>
          </div>
        }
      >
        <PageActions>
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Assign Scenarios
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href={`/test-suites/${suiteId}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Edit Suite
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </PageActions>
      </PageHeader>

      {/* Suite Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Evaluation Size
            </span>
            <p className="text-xl font-bold text-slate-900">{assignedCases.length} Cases</p>
            <p className="text-[11px] text-slate-500">Ordered adversarial scenarios</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Created Timestamp
            </span>
            <p className="text-sm font-semibold font-mono text-slate-800">{formatDate(suite.created_at)}</p>
            <p className="text-[11px] text-slate-500">Stored in PostgreSQL 16</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Execution Seam
            </span>
            <p className="text-sm font-semibold text-teal-700">Phase 2 Ready</p>
            <p className="text-[11px] text-slate-500">Session-bound canary hooks</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Scenarios Table */}
      <Card className="border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-teal-600" />
            <CardTitle className="text-sm font-semibold text-slate-900">
              Assigned Attack Scenarios
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddOpen(true)}
            className="h-7 text-xs text-teal-700 border-teal-200 bg-teal-50/50 hover:bg-teal-50"
          >
            <Plus className="h-3 w-3 mr-1" /> Add More
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {assignedCases.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ShieldAlert}
                title="No scenarios assigned yet"
                description="Assign attack vectors from your scenario catalog to begin testing."
                actionText="Assign Scenarios"
                onAction={() => setIsAddOpen(true)}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/60">
                  <TableHead className="w-16 text-[11px] font-semibold uppercase text-slate-500 text-center">Order</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Scenario Name</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Vector Category</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Severity</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedCases.map((stc, index) => {
                  const tc = stc.test_case;
                  if (!tc) return null;
                  return (
                    <TableRow key={stc.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-center font-mono text-xs text-slate-400 font-semibold">
                        #{stc.execution_order || index + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-900">
                        <Link
                          href={`/scenarios/${tc.id}`}
                          className="hover:text-teal-600 transition-colors"
                        >
                          {tc.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={tc.category as ScenarioCategory} />
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={tc.severity as ScenarioSeverity} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveScenario(tc.id)}
                          disabled={removeMutation.isPending}
                          className="h-7 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Remove from suite"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Scenarios Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
          <DialogHeader className="p-4 border-b border-slate-100">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-teal-600" />
              <span>Assign Scenarios to Suite</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select adversarial scenarios from your catalog to include in this evaluation suite.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Search scenarios by name or category..."
                value={scenarioSearch}
                onChange={(e) => setScenarioSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-white"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
            {availableScenarios.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No unassigned scenarios found matching your search.
              </div>
            ) : (
              availableScenarios.map((tc) => (
                <div
                  key={tc.id}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <p className="font-semibold text-xs text-slate-800 truncate">{tc.name}</p>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={tc.category as ScenarioCategory} />
                      <SeverityBadge severity={tc.severity as ScenarioSeverity} />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddScenario(tc.id)}
                    disabled={addMutation.isPending}
                    className="h-7 text-xs shrink-0 text-teal-700 border-teal-200 bg-teal-50 hover:bg-teal-100"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
              className="h-8 text-xs"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Suite Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Test Suite?"
        description={`Are you sure you want to delete "${suite.name}"? Contained scenarios will not be deleted and remain in your scenario library.`}
        confirmText="Delete Suite"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(suiteId, {
            onSuccess: () => {
              toast.success('Test suite deleted');
              router.push('/test-suites');
            },
          });
        }}
      />
    </div>
  );
}
