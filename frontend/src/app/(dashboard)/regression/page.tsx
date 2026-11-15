'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  ExternalLink,
  Flame,
  GitBranch,
  GitCompare,
  Plus,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBaselines, useComparisons, useCreateBaseline, useExecuteRegression } from '@/hooks/use-regression';
import { useTargets } from '@/hooks/use-targets';
import { useTestRuns } from '@/hooks/use-test-runs';
import { formatDate } from '@/lib/utils';
import { RegressionClassification, RegressionComparison, SecurityBaseline } from '@/types/regression';

export default function RegressionPage() {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('ALL');
  const targetFilter = selectedTargetId !== 'ALL' ? { target_id: selectedTargetId } : undefined;

  const { data: baselines, isLoading: isBaselinesLoading, refetch: refetchBaselines } = useBaselines(targetFilter);
  const { data: comparisons, isLoading: isComparisonsLoading, refetch: refetchComparisons } = useComparisons();
  const { data: targetsData } = useTargets(1, 100);
  const targets = targetsData?.items || [];
  const { data: completedRunsData } = useTestRuns({ status: 'COMPLETED', page_size: 50 });
  const completedRuns = completedRunsData?.items || [];

  const createBaselineMutation = useCreateBaseline();
  const executeRegressionMutation = useExecuteRegression();

  // Create Baseline modal state
  const [isBaselineOpen, setIsBaselineOpen] = useState(false);
  const [baselineName, setBaselineName] = useState('');
  const [baselineDescription, setBaselineDescription] = useState('');
  const [baselineTestRunId, setBaselineTestRunId] = useState('');
  const [baselineError, setBaselineError] = useState<string | null>(null);

  // Execute Regression modal state
  const [isRegressionOpen, setIsRegressionOpen] = useState(false);
  const [regressionBaselineId, setRegressionBaselineId] = useState('');
  const [regressionTargetVersion, setRegressionTargetVersion] = useState('');
  const [regressionError, setRegressionError] = useState<string | null>(null);

  const handleCreateBaseline = async () => {
    setBaselineError(null);
    if (!baselineName.trim() || !baselineTestRunId) {
      setBaselineError('Please provide a baseline name and completed test run.');
      return;
    }
    try {
      await createBaselineMutation.mutateAsync({
        name: baselineName.trim(),
        description: baselineDescription.trim() || undefined,
        source_run_id: baselineTestRunId,
      });
      setIsBaselineOpen(false);
      setBaselineName('');
      setBaselineDescription('');
      setBaselineTestRunId('');
    } catch (err: unknown) {
      setBaselineError(err instanceof Error ? err.message : 'Failed to create baseline');
    }
  };

  const handleExecuteRegression = async () => {
    setRegressionError(null);
    if (!regressionBaselineId) {
      setRegressionError('Please select a security baseline.');
      return;
    }
    try {
      await executeRegressionMutation.mutateAsync({
        baseline_id: regressionBaselineId,
        target_version: regressionTargetVersion.trim() || undefined,
      });
      setIsRegressionOpen(false);
      setRegressionTargetVersion('');
    } catch (err: unknown) {
      setRegressionError(err instanceof Error ? err.message : 'Failed to trigger regression run');
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'PASSED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> PASSED
          </Badge>
        );
      case 'REGRESSION_DETECTED':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-semibold text-xs flex items-center gap-1">
            <Flame className="h-3 w-3 text-rose-600" /> REGRESSION DETECTED
          </Badge>
        );
      case 'IMPROVED':
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300 font-semibold text-xs flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-teal-600" /> IMPROVED
          </Badge>
        );
      case 'INCONCLUSIVE':
      default:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-semibold text-xs">
            {verdict || 'INCONCLUSIVE'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Regression Testing"
        description="Establish immutable security baselines from validated runs, verify defenses across releases, and track recurring canary taint exposures with SHA-256 fingerprinting."
      >
        <div className="flex items-center gap-2">
          {/* Target Filter */}
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            aria-label="Filter baselines by target"
            className="text-xs font-medium bg-white border border-slate-200 rounded-md px-3 py-1.5 text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">All AI Targets</option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Create Baseline Modal */}
          <Dialog open={isBaselineOpen} onOpenChange={setIsBaselineOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs border-slate-300 hover:bg-slate-50 shadow-sm">
                <Plus className="h-3.5 w-3.5 text-slate-600" />
                New Baseline
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Create Security Baseline</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Snapshots the test cases and detected findings from a completed test run into an immutable reference.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Baseline Name</label>
                  <Input
                    placeholder="e.g., Release-v2.1-Pre-Deployment-Gold"
                    value={baselineName}
                    onChange={(e) => setBaselineName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                  <Input
                    placeholder="Reference baseline description..."
                    value={baselineDescription}
                    onChange={(e) => setBaselineDescription(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Completed Test Run</label>
                  <select
                    value={baselineTestRunId}
                    onChange={(e) => setBaselineTestRunId(e.target.value)}
                    aria-label="Select completed test run for baseline"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Completed Run...</option>
                    {completedRuns.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.test_suite?.name || 'Suite'} — {formatDate(r.created_at)} ({r.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                </div>
                {baselineError && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                    {baselineError}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsBaselineOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white"
                  onClick={handleCreateBaseline}
                  disabled={createBaselineMutation.isPending}
                >
                  {createBaselineMutation.isPending ? 'Creating...' : 'Snapshot Baseline'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Launch Regression Modal */}
          <Dialog open={isRegressionOpen} onOpenChange={setIsRegressionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs shadow-sm">
                <GitCompare className="h-3.5 w-3.5" />
                Launch Regression
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Execute Security Regression Test</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Executes the exact test case snapshot from a baseline against the current target build and diffs findings.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Security Baseline</label>
                  <select
                    value={regressionBaselineId}
                    onChange={(e) => setRegressionBaselineId(e.target.value)}
                    aria-label="Select baseline for regression execution"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Baseline...</option>
                    {(baselines || []).map((b: SecurityBaseline) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.target_version || 'latest'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Version Under Test (Optional)</label>
                  <Input
                    placeholder="e.g., v2.2.0-rc1"
                    value={regressionTargetVersion}
                    onChange={(e) => setRegressionTargetVersion(e.target.value)}
                    className="text-xs"
                  />
                </div>
                {regressionError && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                    {regressionError}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsRegressionOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white"
                  onClick={handleExecuteRegression}
                  disabled={executeRegressionMutation.isPending}
                >
                  {executeRegressionMutation.isPending ? 'Starting...' : 'Execute Regression'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchBaselines();
              refetchComparisons();
            }}
            className="border-slate-200 text-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PageHeader>

      {/* Security Baselines Table */}
      <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-100">
          <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-teal-600" />
              Immutable Security Baselines ({baselines?.length || 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isBaselinesLoading ? (
            <div className="p-5 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !baselines || baselines.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No security baselines established yet. Click <strong>&quot;New Baseline&quot;</strong> to snapshot a completed test run.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-600">Baseline Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Target & Version</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Cases</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Findings Snapshot</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Source Run</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Created</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-600">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {baselines.map((b: SecurityBaseline) => (
                  <TableRow key={b.id} className="hover:bg-slate-50/50">
                    <TableCell className="py-3 font-semibold text-xs text-slate-900">
                      {b.name}
                      {b.description && <p className="text-[11px] text-slate-400 font-normal">{b.description}</p>}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-slate-600">
                      <div className="font-mono text-slate-800">{b.target_version || 'default'}</div>
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs font-mono font-medium text-slate-700">
                      {b.metrics_summary?.total_cases ?? '—'}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge variant="outline" className="text-[10px] bg-slate-50 font-mono">
                        {b.metrics_summary?.total_findings ?? 0} findings
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-slate-500">
                      <Link href={`/test-runs/${b.source_run_id}`} className="text-teal-700 hover:underline flex items-center gap-1">
                        {b.source_run_id.slice(0, 8)}...
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-slate-500">
                      {formatDate(b.created_at)}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-50"
                        onClick={() => {
                          setRegressionBaselineId(b.id);
                          setIsRegressionOpen(true);
                        }}
                      >
                        Run Test
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Regression Execution Comparisons Table */}
      <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-100">
          <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <GitCompare className="h-4 w-4 text-teal-600" />
              Regression Comparisons & Diff Records ({comparisons?.length || 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isComparisonsLoading ? (
            <div className="p-5 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !comparisons || comparisons.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No regression comparisons evaluated yet. Execute a regression against an established baseline to track delta findings.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-600">Verdict</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Baseline</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">New Findings</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Resolved</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Recurring</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Evaluated At</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-600">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisons.map((c: RegressionComparison) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/50">
                    <TableCell className="py-3 font-medium">
                      {getVerdictBadge(c.summary_verdict)}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-medium text-slate-800">
                      {c.baseline_name}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          (c.comparison_metrics?.new_findings_count ?? 0) > 0 ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold' : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {c.comparison_metrics?.new_findings_count ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          (c.comparison_metrics?.resolved_findings_count ?? 0) > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {c.comparison_metrics?.resolved_findings_count ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          (c.comparison_metrics?.recurring_findings_count ?? 0) > 0 ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {c.comparison_metrics?.recurring_findings_count ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-slate-500">
                      {formatDate(c.created_at)}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Link href={`/regression/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-teal-700 hover:text-teal-900">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
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
