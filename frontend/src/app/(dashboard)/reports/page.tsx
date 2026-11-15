'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FileType,
  Hash,
  Loader2,
  Plus,
  RotateCcw,
  Shield,
  ShieldAlert,
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
import { useReports, useCreateReport } from '@/hooks/use-reports';
import { useTargets } from '@/hooks/use-targets';
import { useTestRuns } from '@/hooks/use-test-runs';
import { reportService } from '@/services/report.service';
import { formatDate } from '@/lib/utils';
import { ReportFormat, ReportJob, ReportStatus } from '@/types/report';

export default function ReportsPage() {
  const { data: reports, isLoading: isReportsLoading, refetch, isRefetching } = useReports();
  const { data: targetsData } = useTargets(1, 100);
  const targets = targetsData?.items || [];
  const { data: completedRunsData } = useTestRuns({ status: 'COMPLETED', page_size: 50 });
  const completedRuns = completedRunsData?.items || [];

  const createReportMutation = useCreateReport();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('PDF');
  const [reportTargetId, setReportTargetId] = useState('');
  const [reportTestRunId, setReportTestRunId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleCreateReport = async () => {
    setFormError(null);
    if (!reportTitle.trim()) {
      setFormError('Please enter a report title.');
      return;
    }
    const scope: Record<string, unknown> = {};
    if (reportTargetId) scope.target_id = reportTargetId;
    if (reportTestRunId) scope.test_run_id = reportTestRunId;

    try {
      await createReportMutation.mutateAsync({
        title: reportTitle.trim(),
        format: reportFormat,
        scope,
      });
      setIsModalOpen(false);
      setReportTitle('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to request report generation');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatBadge = (fmt: ReportFormat) => {
    switch (fmt) {
      case 'PDF':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <FileText className="h-3 w-3 text-rose-600" /> PDF
          </Badge>
        );
      case 'JSON':
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <FileType className="h-3 w-3 text-teal-700" /> JSON v3.0
          </Badge>
        );
      case 'CSV_FINDINGS':
      case 'CSV_CASES':
      case 'CSV_ASSERTIONS':
      case 'CSV_METRICS':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <FileSpreadsheet className="h-3 w-3 text-emerald-700" /> {fmt}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-[10px]">
            {fmt}
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> READY
          </Badge>
        );
      case 'RUNNING':
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
            <Loader2 className="h-3 w-3 text-teal-600 animate-spin" /> GENERATING
          </Badge>
        );
      case 'QUEUED':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] font-semibold">
            QUEUED
          </Badge>
        );
      case 'FAILED':
      default:
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-semibold flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-rose-600" /> FAILED
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Reports & Evidence Exports"
        description="Generate formal security assessments in PDF format with executive summaries, technical tables, and remediation guidance; export machine-readable JSON v3.0 payloads with SHA-256 integrity validation."
      >
        <div className="flex items-center gap-2">
          {/* New Report Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs shadow-sm">
                <Plus className="h-3.5 w-3.5" />
                Generate Security Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Export Security Assessment Report</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select report format, target, and optional completed test run scope.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Report Title</label>
                  <Input
                    placeholder="e.g., PromptFence Security Assessment - Q4 Production Audit"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Export Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PDF', 'JSON', 'CSV_FINDINGS'] as ReportFormat[]).map((fmt) => (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => setReportFormat(fmt)}
                        className={`p-2 rounded border text-xs font-semibold text-center transition-colors ${
                          reportFormat === fmt
                            ? 'bg-teal-50 border-teal-600 text-teal-900 ring-1 ring-teal-500'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {fmt === 'CSV_FINDINGS' ? 'CSV' : fmt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">AI Target (Optional)</label>
                  <select
                    value={reportTargetId}
                    onChange={(e) => setReportTargetId(e.target.value)}
                    aria-label="Select AI target for report scope"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">All Targets Combined</option>
                    {targets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.target_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specific Test Run (Optional)</label>
                  <select
                    value={reportTestRunId}
                    onChange={(e) => setReportTestRunId(e.target.value)}
                    aria-label="Select test run for report scope"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Latest Evaluated Test Runs</option>
                    {completedRuns
                      .filter((r) => !reportTargetId || r.target_id === reportTargetId)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.test_suite?.name || 'Suite'} — {formatDate(r.created_at)} ({r.id.slice(0, 8)})
                        </option>
                      ))}
                  </select>
                </div>
                {formError && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                    {formError}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white"
                  onClick={handleCreateReport}
                  disabled={createReportMutation.isPending}
                >
                  {createReportMutation.isPending ? 'Queuing...' : 'Generate Report'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-slate-200 text-slate-700"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </PageHeader>

      {/* Reports Catalog Table */}
      <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-100">
          <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-teal-600" />
              Generated Security Assessment Artifacts ({reports?.length || 0})
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              Cryptographically validated with SHA-256 integrity hashes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isReportsLoading ? (
            <div className="p-5 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No reports generated yet. Click <strong>&quot;Generate Security Report&quot;</strong> to export PDF, JSON, or CSV artifacts.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="border-slate-100">
                  <TableHead className="w-[80px] text-xs font-semibold text-slate-600">Format</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Report Title</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold text-slate-600 text-center">Status</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold text-slate-600 text-center">Size</TableHead>
                  <TableHead className="w-[200px] text-xs font-semibold text-slate-600">SHA-256 Hash</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-slate-600">Created</TableHead>
                  <TableHead className="w-[100px] text-right text-xs font-semibold text-slate-600">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r: ReportJob) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/50">
                    <TableCell className="py-3">
                      {getFormatBadge(r.format)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="font-semibold text-xs text-slate-900">{r.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {r.id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      {getStatusBadge(r.status)}
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs font-mono text-slate-600">
                      {formatFileSize(r.file_size_bytes)}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-slate-500">
                      {r.content_hash ? (
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[140px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {r.content_hash}
                          </span>
                          <button
                            onClick={() => copyHash(r.content_hash!)}
                            title="Copy SHA-256 hash"
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-slate-500">
                      {formatDate(r.created_at)}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {r.status === 'COMPLETED' ? (
                        <a
                          href={reportService.getDownloadUrl(r.id)}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-teal-700 hover:text-teal-900 gap-1 border-teal-200">
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        </a>
                      ) : (
                        <Button size="sm" variant="ghost" disabled className="h-7 px-2 text-xs text-slate-400">
                          Unavailable
                        </Button>
                      )}
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
