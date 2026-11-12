'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Crosshair,
  ExternalLink,
  FolderKanban,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { DistributionChart } from '@/components/dashboard/distribution-chart';
import { EmptyState } from '@/components/dashboard/empty-state';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { PageActions, PageHeader } from '@/components/layout/page-header';
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
        <PageHeader
          title="Overview"
          description="Monitor your AI application security infrastructure and manage your testing configurations."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasTargets = overview && overview.total_targets > 0;
  const hasCases = overview && overview.total_test_cases > 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Overview"
        description="Monitor your AI application security infrastructure and manage your testing configurations."
      >
        <PageActions>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs font-medium">
            <Link href="/test-suites/new">
              <FolderKanban className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Create Test Suite
            </Link>
          </Button>
          <Button asChild size="sm" className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white">
            <Link href="/targets/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Target
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Targets"
          value={overview?.total_targets ?? 0}
          subtitle={`${overview?.active_targets ?? 0} actively reachable`}
          icon={Crosshair}
          trend={overview && overview.total_targets > 0 ? 'Live' : undefined}
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
          subtitle="Evaluation suites assembled"
          icon={FolderKanban}
        />
        <StatsCard
          title="Configured Scenarios"
          value={overview?.total_test_cases ?? 0}
          subtitle={`${overview?.enabled_test_cases ?? 0} enabled in library`}
          icon={ShieldAlert}
        />
      </div>

      {/* Analytics Section: Target & Scenario Distributions */}
      {distributions && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DistributionChart
            title="Targets by Architecture"
            data={distributions.targets_by_type}
            type="pie"
          />
          <DistributionChart
            title="Scenarios by Attack Vector"
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

      {/* Tables & Activity Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Targets & Suites (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Targets */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-teal-600" />
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                  Recent AI Targets
                </CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-slate-900">
                <Link href="/targets">View all targets &rarr;</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!hasTargets ? (
                <div className="p-6">
                  <EmptyState
                    icon={Crosshair}
                    title="No targets configured yet"
                    description="Register an external AI application or chat API endpoint to begin testing."
                    actionText="Add First Target"
                    actionHref="/targets/new"
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase">Target Name</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase">Architecture</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase">Status</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase text-right">Created</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview?.recent_targets.map((t) => (
                      <TableRow key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-semibold text-xs text-slate-900 dark:text-white">
                          <Link href={`/targets/${t.id}`} className="hover:text-teal-600 transition-colors flex items-center gap-1.5">
                            <span>{t.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {t.target_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge isActive={t.is_active} />
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-slate-400">
                          {formatDate(t.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                            <Link href={`/targets/${t.id}`}>
                              Inspect <ExternalLink className="h-3 w-3 ml-1 text-slate-400" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Scenarios */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-teal-600" />
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                  Scenario Catalog Highlights
                </CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-slate-900">
                <Link href="/scenarios">View full library &rarr;</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!hasCases ? (
                <div className="p-6">
                  <EmptyState
                    icon={ShieldAlert}
                    title="No scenarios configured"
                    description="Create adversarial scenarios targeting indirect prompt injection or data leakage."
                    actionText="Create Scenario"
                    actionHref="/scenarios/new"
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase">Scenario Name</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase">Vector</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase">Severity</TableHead>
                      <TableHead className="text-[11px] font-semibold text-slate-500 uppercase text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview?.recent_test_cases.map((tc) => (
                      <TableRow key={tc.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-semibold text-xs text-slate-900 dark:text-white">
                          <Link href={`/scenarios/${tc.id}`} className="hover:text-teal-600 transition-colors">
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
                            activeText="Armed"
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

        {/* Right Column: Security Activity Timeline & Quick Actions */}
        <div className="space-y-6">
          <ActivityTimeline />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
