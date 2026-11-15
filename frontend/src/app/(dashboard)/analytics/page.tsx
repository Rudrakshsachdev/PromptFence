'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  ExternalLink,
  Flame,
  Info,
  KeyRound,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAnalyticsOverview,
  useAnalyticsDistribution,
  useTargetComparisons,
} from '@/hooks/use-analytics';
import { useTargets } from '@/hooks/use-targets';
import { ScoreBreakdown, SeverityDistribution, TargetComparisonItem } from '@/types/analytics';

export default function AnalyticsPage() {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('ALL');

  const targetFilter = selectedTargetId !== 'ALL' ? selectedTargetId : undefined;

  const { data: targetsData } = useTargets(1, 100);
  const targets = targetsData?.items || [];

  const {
    data: overview,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
    isRefetching: isOverviewRefetching,
  } = useAnalyticsOverview({ target_id: targetFilter });

  const { data: distribution, isLoading: isDistLoading } = useAnalyticsDistribution({ target_id: targetFilter });
  const { data: targetComparisons, isLoading: isComparisonsLoading } = useTargetComparisons();

  const refetchAll = () => {
    refetchOverview();
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
      case 'A+':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-lg font-mono shadow-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            GRADE {grade}
          </div>
        );
      case 'B':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-300 font-bold text-lg font-mono shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-teal-600" />
            GRADE B
          </div>
        );
      case 'C':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-300 font-bold text-lg font-mono shadow-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            GRADE C
          </div>
        );
      case 'D':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-300 font-bold text-lg font-mono shadow-sm">
            <AlertOctagon className="h-5 w-5 text-orange-600" />
            GRADE D
          </div>
        );
      case 'F':
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-300 font-bold text-lg font-mono shadow-sm">
            <Flame className="h-5 w-5 text-rose-600" />
            GRADE {grade || 'F'}
          </div>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-teal-600';
    if (score >= 70) return 'text-amber-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-rose-600';
  };

  const scoreDetail = overview?.security_score;
  const currentScore = scoreDetail?.score ?? 100;
  const currentGrade = scoreDetail?.grade ?? 'A';
  const breakdownList = scoreDetail?.breakdown || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Analytics & Posture"
        description="Authoritative quantitative security scoring, attack-surface category deductions, canary taint rates, and comparative target evaluation."
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Target Scope:</span>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              aria-label="Filter analytics by target scope"
              className="text-xs font-medium bg-white border border-slate-200 rounded-md px-3 py-1.5 text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All AI Targets Combined</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.target_type})
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            disabled={isOverviewRefetching}
            className="border-slate-200 hover:bg-slate-50 text-slate-700 gap-1.5 shadow-sm"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isOverviewRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Top Banner: Authoritative Security Score & Key Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Score Card (5 Cols) */}
        <Card className="lg:col-span-5 border border-slate-200/80 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full pointer-events-none" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-teal-600" />
                PromptFence Security Score
              </span>
              <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-600 border-slate-200">
                {scoreDetail?.formula_version || 'v1.2-deterministic-weighted'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {isOverviewLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-32" />
                <Skeleton className="h-6 w-48" />
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-4">
                  <div className={`text-5xl font-black font-mono tracking-tight ${getScoreColor(currentScore)}`}>
                    {currentScore.toFixed(1)}
                  </div>
                  <div className="text-slate-400 font-mono text-xl font-medium">/ 100</div>
                  <div className="ml-auto">
                    {getGradeBadge(currentGrade)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Scope: {selectedTargetId === 'ALL' ? 'Aggregated Lab Environment' : 'Single Target'}</span>
                  <span>Evaluated Cases: {overview?.total_cases_executed ?? 0}</span>
                  <span>Total Findings: {overview?.total_findings ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4 Key Security Signals (7 Cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Canary Exposure Rate */}
          <Card className="border border-slate-200/80 shadow-sm bg-white flex flex-col justify-between p-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between mb-1">
                <span>Canary Leaks</span>
                <KeyRound className="h-3.5 w-3.5 text-teal-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {isOverviewLoading ? <Skeleton className="h-7 w-16" /> : `${(overview?.canary_exposure_rate.percentage ?? 0).toFixed(1)}%`}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Fraction of test cases with proven canary leakage</p>
          </Card>

          {/* Tool Boundary Violations */}
          <Card className="border border-slate-200/80 shadow-sm bg-white flex flex-col justify-between p-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between mb-1">
                <span>Tool Violations</span>
                <Wrench className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {isOverviewLoading ? <Skeleton className="h-7 w-16" /> : `${(overview?.tool_violation_rate.percentage ?? 0).toFixed(1)}%`}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Unauthorized tool or function execution rate</p>
          </Card>

          {/* Benign Pass Rate */}
          <Card className="border border-slate-200/80 shadow-sm bg-white flex flex-col justify-between p-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between mb-1">
                <span>Benign Utility</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
                {isOverviewLoading ? <Skeleton className="h-7 w-16" /> : `${(overview?.benign_pass_rate.percentage ?? 100).toFixed(1)}%`}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Uninterrupted legitimate task success rate</p>
          </Card>

          {/* False Positive Rate */}
          <Card className="border border-slate-200/80 shadow-sm bg-white flex flex-col justify-between p-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between mb-1">
                <span>False Positives</span>
                <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-800 mt-2">
                {isOverviewLoading ? <Skeleton className="h-7 w-16" /> : `${(overview?.false_positive_rate.percentage ?? 0).toFixed(1)}%`}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Triaged false positive finding fraction</p>
          </Card>
        </div>
      </div>

      {/* Middle Row: Category Deductions & Attribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Deductions Breakdown (7 cols) */}
        <Card className="lg:col-span-7 border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="py-4 px-5 border-b border-slate-100">
            <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-teal-600" />
              Attack Vector Deductions & Penalty Points
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Deterministic deductions subtracted from base 100.0 based on severity-weighted finding counts and category impact caps.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isOverviewLoading ? (
              <div className="p-5 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : breakdownList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">Clean Posture — No Deductions Applied</p>
                <p className="mt-1">All evaluated test runs have zero unmitigated security findings.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow className="border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-center">Weight</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-center">Findings</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-right">Deduction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdownList.map((d: ScoreBreakdown) => (
                    <TableRow key={d.category} className="hover:bg-slate-50/50">
                      <TableCell className="py-2.5 font-medium text-xs text-slate-800">
                        {d.category}
                      </TableCell>
                      <TableCell className="py-2.5 text-center text-xs font-mono text-slate-600">
                        {(d.weight_pct * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="py-2.5 text-center text-xs font-mono text-slate-700">
                        {d.findings_count}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-rose-600">
                        -{d.deductions.toFixed(1)} pts
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Severity & Attribution Distributions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Severity Distribution */}
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>Findings by Severity</span>
                <span className="font-mono text-[11px] text-slate-400">Total: {overview?.total_findings ?? 0}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {(distribution?.by_severity || []).map((sev: SeverityDistribution) => {
                const color =
                  sev.severity === 'CRITICAL'
                    ? 'bg-rose-500'
                    : sev.severity === 'HIGH'
                    ? 'bg-amber-500'
                    : sev.severity === 'MEDIUM'
                    ? 'bg-yellow-500'
                    : sev.severity === 'LOW'
                    ? 'bg-blue-500'
                    : 'bg-slate-400';

                return (
                  <div key={sev.severity} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{sev.severity}</span>
                      <span className="font-mono text-slate-500">
                        {sev.count} ({sev.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${sev.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Attribution Level Breakdown */}
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>Canary Attribution Levels</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {distribution?.by_attribution ? (
                Object.entries(distribution.by_attribution).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 text-xs">
                    <span className="font-mono font-medium text-slate-800 text-[11px]">{level}</span>
                    <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-600 border-slate-200">
                      {count}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No attribution records available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Target Comparison Ranking Table */}
      <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-100">
          <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-teal-600" />
              Comparative AI Target Posture Ranking
            </span>
            <span className="text-xs font-normal text-slate-500">
              Cross-target security comparison
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isComparisonsLoading ? (
            <div className="p-5 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !targetComparisons || targetComparisons.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No targets evaluated yet. Run test suites against AI targets to generate security metrics.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-600">Target Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Score</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Canary Leak Rate</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Tool Violation Rate</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Critical & High</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-600">Runs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targetComparisons.map((tc: TargetComparisonItem) => (
                  <TableRow key={tc.target_id} className="hover:bg-slate-50/50">
                    <TableCell className="py-3 font-semibold text-xs text-slate-900">
                      <Link href={`/targets/${tc.target_id}`} className="hover:text-teal-700 transition-colors">
                        {tc.target_name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-slate-500 font-mono">
                      {tc.target_type}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className={`font-mono font-bold text-sm ${getScoreColor(tc.security_score)}`}>
                        {tc.security_score.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs font-mono text-slate-700">
                      {(tc.canary_exposure_rate * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs font-mono text-slate-700">
                      {(tc.tool_violation_rate * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs font-mono font-medium text-rose-600">
                      {tc.critical_findings + tc.high_findings}
                    </TableCell>
                    <TableCell className="py-3 text-right text-xs font-mono text-slate-500">
                      {tc.runs_count} runs
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
