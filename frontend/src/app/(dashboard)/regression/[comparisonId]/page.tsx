'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Flame,
  GitBranch,
  GitCompare,
  KeyRound,
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useComparison } from '@/hooks/use-regression';
import { formatDate } from '@/lib/utils';
import { FindingMatchDetail, RegressionClassification } from '@/types/regression';

export default function RegressionComparisonDetailPage() {
  const params = useParams<{ comparisonId: string }>();
  const comparisonId = params?.comparisonId || '';

  const { data: comparison, isLoading, error } = useComparison(comparisonId);
  const [filterClassification, setFilterClassification] = useState<string>('ALL');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="space-y-6">
        <Link href="/regression" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Regression Testing
        </Link>
        <Card className="border-rose-200 bg-rose-50/50 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <h2 className="text-base font-semibold text-rose-900">Regression Comparison Not Found</h2>
          <p className="text-xs text-rose-700 mt-1">Comparison record could not be found or you do not have permission to view it.</p>
        </Card>
      </div>
    );
  }

  const matches = (comparison.finding_matches || []).filter((m) => {
    if (filterClassification === 'ALL') return true;
    return m.classification === filterClassification;
  });

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'PASSED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> PASSED — ZERO REGRESSIONS
          </div>
        );
      case 'REGRESSION_DETECTED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-300 font-bold text-sm">
            <Flame className="h-4 w-4 text-rose-600" /> REGRESSION DETECTED
          </div>
        );
      case 'IMPROVED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-300 font-bold text-sm">
            <TrendingUp className="h-4 w-4 text-teal-600" /> SECURITY IMPROVED
          </div>
        );
      case 'INCONCLUSIVE':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300 font-bold text-sm">
            {verdict || 'INCONCLUSIVE'}
          </div>
        );
    }
  };

  const getClassificationBadge = (cls: RegressionClassification) => {
    switch (cls) {
      case 'NEW':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-bold text-[10px]">
            NEW VULNERABILITY
          </Badge>
        );
      case 'RESOLVED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-[10px]">
            RESOLVED
          </Badge>
        );
      case 'RECURRING':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-[10px]">
            RECURRING
          </Badge>
        );
      case 'UNCHANGED':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 font-medium text-[10px]">
            UNCHANGED
          </Badge>
        );
      case 'INCONCLUSIVE':
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">
            INCONCLUSIVE
          </Badge>
        );
    }
  };

  const metrics = comparison.comparison_metrics || {};

  return (
    <div className="space-y-6">
      {/* Top Nav Backlink */}
      <div className="flex items-center justify-between">
        <Link
          href="/regression"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Regression Testing
        </Link>
        <div className="flex items-center gap-2">
          {comparison.comparison_run_id && (
            <Link
              href={`/test-runs/${comparison.comparison_run_id}`}
              className="text-xs font-mono text-teal-700 hover:underline flex items-center gap-1 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded"
            >
              Test Run: {comparison.comparison_run_id.slice(0, 8)}...
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <Card className="border border-slate-200/80 shadow-sm bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getVerdictBadge(comparison.summary_verdict)}
              <span className="text-xs font-mono text-slate-400">
                Evaluated: {formatDate(comparison.created_at)}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Regression Comparison Analysis
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Baseline: <span className="font-semibold text-slate-700">{comparison.baseline_name}</span> ({comparison.target_version || 'target version'}) vs Current Execution
            </p>
          </div>
        </div>
      </Card>

      {/* Delta Metrics Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-sm bg-white p-4">
          <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>New Findings</span>
            <Flame className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-rose-600 mt-1">
            {metrics.new_findings_count ?? 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Regressions not present in baseline</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm bg-white p-4">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Resolved</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700 mt-1">
            {metrics.resolved_findings_count ?? 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Vulnerabilities successfully remediated</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm bg-white p-4">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Recurring</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-700 mt-1">
            {metrics.recurring_findings_count ?? 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Identified across baseline & current</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm bg-white p-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Inconclusive</span>
            <Shield className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-800 mt-1">
            {metrics.inconclusive_count ?? 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Ambiguous match confidence</p>
        </Card>
      </div>

      {/* Findings Diff Table */}
      <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <GitCompare className="h-4 w-4 text-teal-600" />
              Fingerprint-Matched Finding Classifications ({matches.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Matched using deterministic SHA-256 finding fingerprinting.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1">
            {['ALL', 'NEW', 'RESOLVED', 'RECURRING', 'UNCHANGED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterClassification(f)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filterClassification === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No finding matches for classification filter <strong>&quot;{filterClassification}&quot;</strong>.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="border-slate-100">
                  <TableHead className="w-[140px] text-xs font-semibold text-slate-600">Classification</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Rationale</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">SHA-256 Fingerprint</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-slate-600 text-center">Baseline Finding</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-slate-600 text-center">Comparison Finding</TableHead>
                  <TableHead className="w-[100px] text-right text-xs font-semibold text-slate-600">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m: FindingMatchDetail) => (
                  <TableRow key={m.id} className="hover:bg-slate-50/50">
                    <TableCell className="py-3">
                      {getClassificationBadge(m.classification)}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-slate-700">
                      {m.rationale || 'Matched via fingerprint'}
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {m.fingerprint.slice(0, 16)}...
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs font-mono">
                      {m.baseline_finding_id ? (
                        <Link href={`/findings/${m.baseline_finding_id}`} className="text-teal-700 hover:underline">
                          {m.baseline_finding_id.slice(0, 8)}...
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs font-mono">
                      {m.comparison_finding_id ? (
                        <Link href={`/findings/${m.comparison_finding_id}`} className="text-teal-700 hover:underline">
                          {m.comparison_finding_id.slice(0, 8)}...
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs font-medium text-slate-700">
                      {m.confidence}
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
