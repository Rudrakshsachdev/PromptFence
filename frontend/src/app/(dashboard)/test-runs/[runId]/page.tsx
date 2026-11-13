'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  FlaskConical,
  Key,
  Layers,
  Radio,
  RotateCcw,
  Shield,
  ShieldAlert,
  StopCircle,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCancelTestRun,
  useRunCanaries,
  useRunFindings,
  useTestCaseDetail,
  useTestRun,
  useTestRunCases,
  useTestRunProgress,
} from '@/hooks/use-test-runs';
import { formatDate } from '@/lib/utils';
import { TestCaseExecutionStatus, TestRunStatus } from '@/types/test-run';

export default function TestRunDetailPage() {
  const params = useParams();
  const runId = params.runId as string;

  const { data: run, isLoading, refetch } = useTestRun(runId);
  const isTerminal = run?.status === 'COMPLETED' || run?.status === 'FAILED' || run?.status === 'CANCELLED';
  const { data: progress } = useTestRunProgress(runId, isTerminal);
  const { data: cases, isLoading: casesLoading } = useTestRunCases(runId);
  const { data: findings } = useRunFindings(runId);
  const { data: canaries } = useRunCanaries(runId);
  const cancelMutation = useCancelTestRun(runId);

  const [activeTab, setActiveTab] = useState('cases');

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center py-16 space-y-4">
        <h3 className="text-base font-bold text-slate-800">Test Run Not Found</h3>
        <p className="text-xs text-slate-500">The requested execution run does not exist.</p>
        <Button asChild size="sm">
          <Link href="/test-runs">Back to Test Runs</Link>
        </Button>
      </div>
    );
  }

  const currentStatus = progress?.status || run.status;
  const isRunning = currentStatus === 'RUNNING' || currentStatus === 'QUEUED';
  const pct = progress?.percent_complete ?? ((run.completed_cases / (run.total_cases || 1)) * 100);

  const getCaseBadge = (st: TestCaseExecutionStatus) => {
    switch (st) {
      case 'PASSED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
            PASSED
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">
            FAILED
          </Badge>
        );
      case 'RUNNING':
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-semibold animate-pulse">
            RUNNING
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">
            ERROR
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] font-semibold">
            {st}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href="/test-runs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Test Runs
          </Link>
        </Button>
      </div>

      {/* Header Deck */}
      <div className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight font-mono">
                Run #{run.id.slice(0, 8)}
              </h2>
              <Badge
                variant="outline"
                className={`text-xs font-semibold uppercase tracking-wider ${
                  currentStatus === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentStatus === 'RUNNING'
                    ? 'bg-teal-50 text-teal-700 border-teal-300 animate-pulse'
                    : currentStatus === 'FAILED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {currentStatus}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Target: <span className="font-semibold text-slate-800">{run.target?.name || 'Target'}</span> | Suite:{' '}
              <span className="font-semibold text-slate-800">{run.test_suite?.name || 'Suite'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <StopCircle className="h-3.5 w-3.5" /> Stop Run
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 text-xs text-slate-600 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Progress Bar & Counters */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 flex items-center gap-1.5">
              {isRunning && <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />}
              {progress?.latest_event || (isRunning ? 'Processing scenarios...' : 'Execution complete')}
            </span>
            <span className="font-mono font-semibold text-slate-800">
              {Math.min(100, Math.round(pct))}% ({progress?.completed_cases ?? run.completed_cases}/{run.total_cases} completed)
            </span>
          </div>
          <Progress value={pct} className="h-2 bg-slate-100" />
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="rounded-md bg-slate-50 p-2.5 text-center border border-slate-100">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Total Scenarios</span>
            <p className="text-base font-bold text-slate-800 font-mono">{run.total_cases}</p>
          </div>
          <div className="rounded-md bg-emerald-50/60 p-2.5 text-center border border-emerald-100">
            <span className="text-[10px] font-semibold uppercase text-emerald-700">Passed</span>
            <p className="text-base font-bold text-emerald-700 font-mono">{progress?.passed_cases ?? run.passed_cases}</p>
          </div>
          <div className="rounded-md bg-rose-50/60 p-2.5 text-center border border-rose-100">
            <span className="text-[10px] font-semibold uppercase text-rose-700">Failed</span>
            <p className="text-base font-bold text-rose-700 font-mono">{progress?.failed_cases ?? run.failed_cases}</p>
          </div>
          <div className="rounded-md bg-amber-50/60 p-2.5 text-center border border-amber-100">
            <span className="text-[10px] font-semibold uppercase text-amber-700">Errors</span>
            <p className="text-base font-bold text-amber-700 font-mono">{progress?.error_cases ?? run.error_cases}</p>
          </div>
          <div className="rounded-md bg-teal-50/60 p-2.5 text-center border border-teal-100">
            <span className="text-[10px] font-semibold uppercase text-teal-700">Findings</span>
            <p className="text-base font-bold text-teal-800 font-mono">{findings?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabbed Execution Data */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100/90 p-1 border border-slate-200/60">
          <TabsTrigger value="cases" className="text-xs gap-1.5 font-medium">
            <Layers className="h-3.5 w-3.5" /> Scenarios ({cases?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="findings" className="text-xs gap-1.5 font-medium">
            <ShieldAlert className="h-3.5 w-3.5" /> Vulnerability Findings ({findings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="canaries" className="text-xs gap-1.5 font-medium">
            <Key className="h-3.5 w-3.5" /> Dynamic Canaries ({canaries?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Cases Table */}
        <TabsContent value="cases">
          <Card className="border border-slate-200/80 shadow-2xs overflow-hidden">
            <CardContent className="p-0">
              {casesLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/60">
                      <TableHead className="w-16 text-[11px] font-semibold uppercase text-slate-500 text-center">Order</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Scenario Name</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Category</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Status</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Latency</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(cases || []).map((c) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="text-center font-mono text-xs text-slate-400 font-semibold">
                          #{c.execution_order}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-slate-900">
                            {c.scenario_snapshot?.name || 'Test Case'}
                          </div>
                          {c.error_message && (
                            <span className="text-[11px] text-rose-500 truncate max-w-sm block">
                              {c.error_message}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-600">
                            {c.scenario_snapshot?.category || 'PROMPT_INJECTION'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getCaseBadge(c.status)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-500">
                          {c.duration_ms ? `${c.duration_ms}ms` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 px-2">
                            <Link href={`/test-runs/${run.id}/cases/${c.id}`}>Inspect</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Findings */}
        <TabsContent value="findings">
          <Card className="border border-slate-200/80 shadow-2xs">
            <CardContent className="p-0">
              {(!findings || findings.length === 0) ? (
                <div className="p-10 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <h4 className="text-xs font-semibold text-slate-800">No Security Findings Detected</h4>
                  <p className="text-[11px] text-slate-400">All evaluated assertions passed and no canary leakage was observed.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {findings.map((f) => (
                    <div key={f.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold uppercase ${
                                f.severity === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : f.severity === 'HIGH'
                                  ? 'bg-orange-50 text-orange-700 border-orange-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                              }`}
                            >
                              {f.severity}
                            </Badge>
                            <h4 className="font-semibold text-xs text-slate-900">{f.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="h-7 text-xs shrink-0">
                          <Link href={`/findings/${f.id}`}>View Finding</Link>
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>Attribution: <strong className="text-slate-700">{f.attribution_level}</strong></span>
                        <span>•</span>
                        <span>Method: <strong className="text-slate-700">{f.detection_method}</strong></span>
                        <span>•</span>
                        <span>Location: <strong className="text-slate-700">{f.observation_location}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Canaries */}
        <TabsContent value="canaries">
          <Card className="border border-slate-200/80 shadow-2xs">
            <CardContent className="p-0">
              {(!canaries || canaries.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No dynamic canaries were generated for this execution.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/60">
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Canary Preview</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Synthetic Source</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Status</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {canaries.map((cn) => (
                      <TableRow key={cn.id}>
                        <TableCell className="font-mono text-xs font-semibold text-teal-700">
                          {cn.token_preview}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {cn.source_id} ({cn.source_type})
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              cn.status === 'OBSERVED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {cn.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-slate-400">
                          {formatDate(cn.expires_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
