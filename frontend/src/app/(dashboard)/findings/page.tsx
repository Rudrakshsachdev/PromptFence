'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Filter,
  Flame,
  KeyRound,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Tag,
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
import { useFindings } from '@/hooks/use-findings';
import { formatDate } from '@/lib/utils';
import { AttributionLevel, FindingSeverity, TaintFinding } from '@/types/finding';

const SEVERITY_FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Severities' },
  { id: 'CRITICAL', label: 'Critical' },
  { id: 'HIGH', label: 'High' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'LOW', label: 'Low' },
  { id: 'INFO', label: 'Info' },
];

export default function FindingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const { data, isLoading, refetch, isRefetching } = useFindings({
    severity: severityFilter !== 'ALL' ? severityFilter : undefined,
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    page_size: 50,
  });

  const findings = (data?.items || []).filter((f: TaintFinding) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const title = f.title.toLowerCase();
    const desc = f.description.toLowerCase();
    const cat = f.category.toLowerCase();
    const token = f.evidence_reference?.provenance?.token_preview?.toLowerCase() || '';
    return title.includes(term) || desc.includes(term) || cat.includes(term) || token.includes(term);
  });

  const getSeverityBadge = (severity: FindingSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-semibold text-[11px] flex items-center gap-1">
            <Flame className="h-3 w-3 text-rose-600" /> CRITICAL
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold text-[11px] flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-600" /> HIGH
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 font-semibold text-[11px]">
            MEDIUM
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-[11px]">
            LOW
          </Badge>
        );
      case 'INFO':
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-semibold text-[11px]">
            INFO
          </Badge>
        );
    }
  };

  const getAttributionBadge = (attr: AttributionLevel) => {
    switch (attr) {
      case 'CONFIRMED_SOURCE_MATCH':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px] tracking-wide">
            CONFIRMED MATCH
          </Badge>
        );
      case 'OBSERVED_CANARY':
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-300 font-mono text-[10px] tracking-wide">
            OBSERVED CANARY
          </Badge>
        );
      case 'TRACE_CORRELATED':
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px]">
            TRACE CORRELATED
          </Badge>
        );
      case 'INFERRED':
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-mono text-[10px]">
            INFERRED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 font-mono text-[10px]">
            UNATTRIBUTED
          </Badge>
        );
    }
  };

  // Metrics
  const totalFindings = data?.total || 0;
  const criticalCount = findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;
  const canaryLeakCount = findings.filter((f) => f.canary_id != null || f.attribution_level === 'CONFIRMED_SOURCE_MATCH').length;
  const uniqueCategories = Array.from(new Set((data?.items || []).map((f) => f.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Findings"
        description="Catalog of vulnerabilities, indirect injections, and canary token exposures discovered during security test executions."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="border-slate-200 hover:bg-slate-50 text-slate-700 gap-1.5"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              Total Findings
              <ShieldAlert className="h-4 w-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalFindings}
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all target test runs</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center justify-between">
              Critical & High
              <Flame className="h-4 w-4 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tracking-tight text-rose-600 font-mono">
              {isLoading ? <Skeleton className="h-8 w-12" /> : criticalCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Requiring immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center justify-between">
              Canary Token Leaks
              <KeyRound className="h-4 w-4 text-teal-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tracking-tight text-teal-700 font-mono">
              {isLoading ? <Skeleton className="h-8 w-12" /> : canaryLeakCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Confirmed taint propagation</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              Active Categories
              <Tag className="h-4 w-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {isLoading ? <Skeleton className="h-8 w-12" /> : uniqueCategories.length || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Attack vectors detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by title, description, category, or canary token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:bg-white text-sm"
              />
            </div>
            {uniqueCategories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter findings by attack category"
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ALL">All Categories</option>
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Severity:
            </span>
            {SEVERITY_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSeverityFilter(f.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  severityFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Findings Table */}
      <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow className="border-slate-200">
                <TableHead className="w-[110px] text-xs font-semibold text-slate-600">Severity</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Finding</TableHead>
                <TableHead className="w-[180px] text-xs font-semibold text-slate-600">Category & Location</TableHead>
                <TableHead className="w-[160px] text-xs font-semibold text-slate-600">Attribution</TableHead>
                <TableHead className="w-[180px] text-xs font-semibold text-slate-600">Canary / Evidence</TableHead>
                <TableHead className="w-[130px] text-xs font-semibold text-slate-600">Observed</TableHead>
                <TableHead className="w-[80px] text-right text-xs font-semibold text-slate-600">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48 mb-1" /><Skeleton className="h-3.5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 mb-1" /><Skeleton className="h-3 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-7 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : findings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No security findings recorded"
                      description={
                        searchTerm || severityFilter !== 'ALL' || categoryFilter !== 'ALL'
                          ? 'No findings match your current filter criteria.'
                          : 'Targets evaluated so far have not exhibited detected vulnerabilities or canary exposures.'
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                findings.map((f: TaintFinding) => (
                  <TableRow key={f.id} className="hover:bg-slate-50/60 transition-colors border-slate-100">
                    <TableCell className="align-top py-3.5">
                      {getSeverityBadge(f.severity)}
                    </TableCell>
                    <TableCell className="align-top py-3.5">
                      <div className="font-semibold text-sm text-slate-900 mb-0.5">
                        <Link
                          href={`/findings/${f.id}`}
                          className="hover:text-teal-700 transition-colors"
                        >
                          {f.title}
                        </Link>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 max-w-md">
                        {f.description}
                      </p>
                      {f.test_run_id && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>Run:</span>
                          <Link
                            href={`/test-runs/${f.test_run_id}`}
                            className="font-mono text-teal-600 hover:underline flex items-center gap-0.5"
                          >
                            {f.test_run_id.slice(0, 8)}...
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-3.5">
                      <div className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 mb-1">
                        {f.category}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        loc: {f.observation_location}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-3.5">
                      {getAttributionBadge(f.attribution_level)}
                      <div className="text-[10px] text-slate-400 mt-1">
                        method: {f.detection_method}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-3.5">
                      {f.evidence_reference?.provenance?.token_preview ? (
                        <div className="font-mono text-xs bg-slate-100 text-teal-800 px-2 py-1 rounded border border-slate-200 inline-block font-semibold">
                          {f.evidence_reference.provenance.token_preview}
                        </div>
                      ) : f.canary_id ? (
                        <span className="font-mono text-[11px] text-slate-500">
                          Canary #{f.canary_id.slice(0, 8)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No canary bound</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-3.5 text-xs text-slate-500 font-mono whitespace-nowrap">
                      {formatDate(f.observed_at || f.created_at)}
                    </TableCell>
                    <TableCell className="align-top py-3.5 text-right">
                      <Link href={`/findings/${f.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-teal-700 hover:text-teal-900 hover:bg-teal-50"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
