'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageActions, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  useRemoveScenarioFromSuite,
  useTestSuite,
} from '@/hooks/use-test-suites';
import { formatDate } from '@/lib/utils';
import { ScenarioCategory, ScenarioSeverity } from '@/types/scenario';

export default function TestSuiteDetailPage() {
  const params = useParams();
  const suiteId = params.suiteId as string;

  const { data: suite, isLoading } = useTestSuite(suiteId);
  const { data: allScenarios } = useScenarios({ pageSize: 100 });
  const addMutation = useAddScenarioToSuite(suiteId);
  const removeMutation = useRemoveScenarioFromSuite(suiteId);

  const [isAddOpen, setIsAddOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!suite) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold">Test Suite not found</h3>
        <Button asChild className="mt-4">
          <Link href="/test-suites">Back to Test Suites</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-7 px-2">
          <Link href="/test-suites">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> All Test Suites
          </Link>
        </Button>
      </div>

      <PageHeader
        title={suite.name}
        description={suite.description || 'Evaluation Test Suite'}
      >
        <PageActions>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Scenarios
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/test-suites/${suiteId}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Suite
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {suite.scenario_count}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge isActive={suite.is_active} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatDate(suite.created_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scenario List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Assigned Scenarios</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Attach Scenario
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {suite.scenario_count === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ShieldAlert}
                title="No scenarios attached"
                description="Attach adversarial scenarios from your library to execute in this suite."
                actionText="Add Scenario"
                onAction={() => setIsAddOpen(true)}
              />
            </div>
          ) : (
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This test suite currently contains {suite.scenario_count} configured test scenarios.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Scenario Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Scenarios to Attach</DialogTitle>
            <DialogDescription>
              Choose from your scenario library to include in &quot;{suite.name}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {allScenarios?.items.map((scenario) => (
              <div
                key={scenario.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors dark:hover:bg-slate-900"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{scenario.name}</p>
                  <div className="flex items-center space-x-2">
                    <CategoryBadge category={scenario.category} />
                    <SeverityBadge severity={scenario.severity} />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    addMutation.mutate(
                      { testCaseId: scenario.id, executionOrder: (suite.scenario_count || 0) + 1 },
                      { onSuccess: () => setIsAddOpen(false) }
                    );
                  }}
                  disabled={addMutation.isPending}
                >
                  Attach
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

