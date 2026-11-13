'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FlaskConical,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  StopCircle,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/empty-state';
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
import { useCancelTestRun, useTestRuns } from '@/hooks/use-test-runs';
import { formatDate } from '@/lib/utils';
import { TestRun, TestRunStatus } from '@/types/test-run';

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Executions' },
  { id: 'RUNNING', label: 'Running' },
  { id: 'QUEUED', label: 'Queued' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function TestRunsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data, isLoading, refetch, isRefetching } = useTestRuns({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    page_size: 50,
  });

  const cancelMutation = useCancelTestRun('');

  const runs = (data?.items || []).filter((run) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const targetName = run.target?.name?.toLowerCase() || '';
    const suiteName = run.test_suite?.name?.toLowerCase() || '';
    const id = run.id.toLowerCase();
    return targetName.includes(term) || suiteName.includes(term) || id.includes(term);
  });

  const getStatusBadge = (status: TestRunStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case 'RUNNING':
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 flex items-center gap-1.5 text-[11px] font-semibold animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-ping" /> Running
          </Badge>
        );
      case 'QUEUED':
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 text-[11px] font-semibold">
            <Clock className="h-3 w-3" /> Queued
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1 text-[11px] font-semibold">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1 text-[11px] font-semibold">
            <StopCircle className="h-3 w-3" /> Cancelled
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Security Test Runs"
        description="Audit trail and execution results for automated adversarial security test suites."
      >
        <Button asChild size="sm" className="h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 shadow-2xs text-xs font-semibold">
          <Link href="/test-runs/new">
            <Play className="h-3.5 w-3.5 fill-current" /> Launch Test Run
          </Link>
        </Button>
      </PageHeader>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="search"
              placeholder="Filter by target or suite..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-white"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8 px-2 text-slate-500 hover:text-slate-800"
            title="Refresh runs"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border border-slate-200/80 shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon={FlaskConical}
                title="No test runs found"
                description={
                  searchTerm || statusFilter !== 'ALL'
                    ? 'No executions matched your filter criteria.'
                    : 'Launch your first security test run to evaluate prompt injection defenses.'
                }
                actionText="Launch Test Run"
                onAction={() => (window.location.href = '/test-runs/new')}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/60">
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 w-32">Execution ID</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Target Application</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Test Suite</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-center">Results</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Started</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      <Link href={`/test-runs/${run.id}`} className="hover:text-teal-600 transition-colors flex items-center gap-1">
                        #{run.id.slice(0, 8)}
                        <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-slate-900">
                          {run.target?.name || 'Target Endpoint'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                          {run.target?.base_url}{run.target?.endpoint}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-700">
                        {run.test_suite?.name || 'Adversarial Suite'}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                        <span className="text-emerald-600 font-semibold" title="Passed Cases">
                          {run.passed_cases}P
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-600 font-semibold" title="Failed Cases">
                          {run.failed_cases}F
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-400" title="Total Cases">
                          {run.total_cases}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-slate-400">
                      {formatDate(run.started_at || run.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 px-2">
                        <Link href={`/test-runs/${run.id}`}>View</Link>
                      </Button>
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
