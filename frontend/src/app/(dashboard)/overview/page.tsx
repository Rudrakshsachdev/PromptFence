'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Crosshair,
  FolderKanban,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { DistributionChart } from '@/components/dashboard/distribution-chart';
import { EmptyState } from '@/components/dashboard/empty-state';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { StatsCard } from '@/components/dashboard/stats-card';
import { PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDashboardDistributions, useDashboardOverview } from '@/hooks/use-dashboard';
import { formatDate } from '@/lib/utils';
import { ScenarioCategory, ScenarioSeverity } from '@/types/scenario';

export default function OverviewPage() {
  const { data: overview, isLoading: isOverviewLoading } = useDashboardOverview();
  const { data: distributions, isLoading: isDistLoading } = useDashboardDistributions();

  if (isOverviewLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Security Operations Overview" description="Monitoring configured AI targets and adversarial scenarios." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>
    );
  }

  const hasTargets = overview && overview.total_targets > 0;
  const hasCases = overview && overview.total_test_cases > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security Operations Overview"
        description="Monitoring configured AI targets and adversarial test scenarios."
      >
        <Button asChild size="sm">
          <Link href="/targets/new">
            <Plus className="h-4 w-4 mr-1.5" /> New Target
          </Link>
        </Button>
      </PageHeader>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Targets"
          value={overview?.total_targets ?? 0}
          subtitle={`${overview?.active_targets ?? 0} actively reachable`}
          icon={Crosshair}
        />
        <StatsCard
          title="Active Targets"
          value={overview?.active_targets ?? 0}
          subtitle="Ready for adversarial testing"
          icon={CheckCircle2}
        />
        <StatsCard
          title="Test Suites"
          value={overview?.total_test_suites ?? 0}
          subtitle="Evaluation suites"
          icon={FolderKanban}
        />
        <StatsCard
          title="Configured Scenarios"
          value={overview?.total_test_cases ?? 0}
          subtitle={`${overview?.enabled_test_cases ?? 0} enabled in library`}
          icon={ShieldAlert}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Distribution Charts */}
      {distributions && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DistributionChart
            title="Targets by Architecture"
            data={distributions.targets_by_type}
            type="pie"
          />
          <DistributionChart
            title="Scenarios by Attack Category"
            data={distributions.test_cases_by_category}
            type="bar"
          />
          <DistributionChart
            title="Scenarios by Severity"
            data={distributions.test_cases_by_severity}
            type="pie"
          />
        </div>
      )}

      {/* Recent Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Targets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent AI Targets</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/targets">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!hasTargets ? (
              <EmptyState
                icon={Crosshair}
                title="No targets configured"
                description="Register an AI application or chat API to begin testing."
                actionText="Add Target"
                actionHref="/targets/new"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.recent_targets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-xs">
                        <Link href={`/targets/${t.id}`} className="hover:text-teal-600 hover:underline">
                          {t.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {t.target_type}
                      </TableCell>
                      <TableCell>
                        <StatusBadge isActive={t.is_active} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDate(t.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Scenarios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Scenario Library Highlights</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/scenarios">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!hasCases ? (
              <EmptyState
                icon={ShieldAlert}
                title="No scenarios created"
                description="Create attack scenarios targeting prompt injection or data leaks."
                actionText="Create Scenario"
                actionHref="/scenarios/new"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.recent_test_cases.map((tc) => (
                    <TableRow key={tc.id}>
                      <TableCell className="font-medium text-xs">
                        <Link href={`/scenarios/${tc.id}`} className="hover:text-teal-600 hover:underline">
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
                        <StatusBadge
                          isActive={tc.is_enabled}
                          activeText="Enabled"
                          inactiveText="Disabled"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

