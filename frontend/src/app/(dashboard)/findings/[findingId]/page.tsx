'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Edit3,
  ExternalLink,
  Flame,
  History,
  Info,
  KeyRound,
  Layers,
  MapPin,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useFinding, useFindingHistory, useChangeFindingStatus } from '@/hooks/use-findings';
import { formatDate } from '@/lib/utils';
import { AttributionLevel, FindingSeverity, FindingStatus, FindingStatusHistory } from '@/types/finding';

export default function FindingDetailPage() {
  const params = useParams<{ findingId: string }>();
  const findingId = params?.findingId || '';
  const { data: finding, isLoading, error } = useFinding(findingId);
  const { data: history, isLoading: isHistoryLoading } = useFindingHistory(findingId);
  const changeStatusMutation = useChangeFindingStatus(findingId);

  const [copied, setCopied] = React.useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<FindingStatus>('OPEN');
  const [rationale, setRationale] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  React.useEffect(() => {
    if (finding?.status) {
      setSelectedStatus(finding.status);
    }
  }, [finding?.status]);

  const handleUpdateStatus = async () => {
    setActionError(null);
    try {
      await changeStatusMutation.mutateAsync({
        status: selectedStatus,
        rationale: rationale.trim() || undefined,
        review_date: reviewDate ? new Date(reviewDate).toISOString() : undefined,
      });
      setIsStatusDialogOpen(false);
      setRationale('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setActionError(msg);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !finding) {
    return (
      <div className="space-y-6">
        <Link
          href="/findings"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Findings
        </Link>
        <Card className="border-rose-200 bg-rose-50/50 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <h2 className="text-base font-semibold text-rose-900">Security Finding Not Found</h2>
          <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto">
            The finding ID does not exist in the record database or you do not have permission to view it.
          </p>
        </Card>
      </div>
    );
  }

  const getSeverityBadge = (severity: FindingSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-semibold text-xs flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-rose-600" /> CRITICAL SEVERITY
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> HIGH SEVERITY
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300 font-semibold text-xs">
            MEDIUM SEVERITY
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-semibold text-xs">
            LOW SEVERITY
          </Badge>
        );
      case 'INFO':
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-semibold text-xs">
            INFORMATIONAL
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-semibold text-xs">
            OPEN
          </Badge>
        );
      case 'ACKNOWLEDGED':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs">
            ACKNOWLEDGED
          </Badge>
        );
      case 'RESOLVED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
            RESOLVED
          </Badge>
        );
      case 'FALSE_POSITIVE':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-semibold text-xs">
            FALSE POSITIVE
          </Badge>
        );
      case 'ACCEPTED_RISK':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 font-semibold text-xs">
            ACCEPTED RISK
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-semibold text-xs">
            {status}
          </Badge>
        );
    }
  };

  const getAttributionBadge = (attr: AttributionLevel) => {
    switch (attr) {
      case 'CONFIRMED_SOURCE_MATCH':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[11px] font-semibold">
            CONFIRMED_SOURCE_MATCH
          </Badge>
        );
      case 'OBSERVED_CANARY':
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-300 font-mono text-[11px] font-semibold">
            OBSERVED_CANARY
          </Badge>
        );
      case 'TRACE_CORRELATED':
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[11px]">
            TRACE_CORRELATED
          </Badge>
        );
      case 'INFERRED':
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-mono text-[11px]">
            INFERRED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 font-mono text-[11px]">
            UNATTRIBUTED
          </Badge>
        );
    }
  };

  const provenance = finding.evidence_reference?.provenance;
  const tokenPreview = provenance?.token_preview;
  const limitations = provenance?.limitations || [];

  return (
    <div className="space-y-6">
      {/* Top Nav Backlink */}
      <div className="flex items-center justify-between">
        <Link
          href="/findings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Findings Catalog
        </Link>
        {finding.test_run_id && (
          <div className="flex items-center gap-2">
            <Link
              href={`/test-runs/${finding.test_run_id}`}
              className="text-xs font-mono text-teal-700 hover:underline flex items-center gap-1 bg-teal-50/70 border border-teal-200/60 px-2.5 py-1 rounded"
            >
              Test Run: {finding.test_run_id.slice(0, 8)}...
              <ExternalLink className="h-3 w-3" />
            </Link>
            {finding.test_run_case_id && (
              <Link
                href={`/test-runs/${finding.test_run_id}/cases/${finding.test_run_case_id}`}
                className="text-xs font-mono text-slate-600 hover:underline flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded"
              >
                Inspect Case
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Hero Finding Banner */}
      <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {getSeverityBadge(finding.severity)}
              {getStatusBadge(finding.status || 'OPEN')}
              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-medium text-xs">
                {finding.category}
              </Badge>
              {getAttributionBadge(finding.attribution_level)}
            </div>

            {/* Triage Button & Dialog */}
            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs border-slate-300 hover:bg-slate-50">
                  <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                  Triage Status
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">Triage Security Finding</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as FindingStatus)}
                      aria-label="Select finding triage status"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="OPEN">OPEN — Active vulnerability / exposure</option>
                      <option value="ACKNOWLEDGED">ACKNOWLEDGED — Reviewed by security researcher</option>
                      <option value="RESOLVED">RESOLVED — Defended or patched</option>
                      <option value="FALSE_POSITIVE">FALSE_POSITIVE — Benign or misclassified</option>
                      <option value="ACCEPTED_RISK">ACCEPTED_RISK — Documented business acceptance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rationale / Justification {(selectedStatus === 'FALSE_POSITIVE' || selectedStatus === 'ACCEPTED_RISK') && <span className="text-rose-500">*</span>}
                    </label>
                    <Textarea
                      placeholder="Provide reasoning, compensating controls, or explanation for this status change..."
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Review Date (Optional)</label>
                    <Input
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  {actionError && (
                    <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                      {actionError}
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" size="sm" onClick={() => setIsStatusDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-teal-700 hover:bg-teal-800 text-white"
                    onClick={handleUpdateStatus}
                    disabled={changeStatusMutation.isPending || ((selectedStatus === 'FALSE_POSITIVE' || selectedStatus === 'ACCEPTED_RISK') && !rationale.trim())}
                  >
                    {changeStatusMutation.isPending ? 'Updating...' : 'Save Status'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {finding.title}
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {finding.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              <span className="block font-medium text-slate-400 mb-0.5">Observation Location</span>
              <span className="font-mono text-slate-800 font-semibold">{finding.observation_location}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-400 mb-0.5">Detection Method</span>
              <span className="font-mono text-slate-800">{finding.detection_method}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-400 mb-0.5">Confidence</span>
              <span className="text-slate-800 font-semibold">{finding.confidence || 'HIGH'}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-400 mb-0.5">Observed At</span>
              <span className="font-mono text-slate-800">{formatDate(finding.observed_at || finding.created_at)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Evidence & Technical Deep-Dive */}
        <div className="lg:col-span-2 space-y-6">
          {/* Canary & Taint Provenance Card */}
          {tokenPreview && (
            <Card className="border-teal-200/80 bg-teal-50/20 shadow-sm overflow-hidden">
              <CardHeader className="bg-teal-50/50 border-b border-teal-100/80 py-3.5 px-5">
                <CardTitle className="text-sm font-semibold text-teal-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-teal-700" />
                    Dynamic Canary Taint Observation
                  </span>
                  <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-300 font-mono text-[10px]">
                    SESSION-BOUND
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Detected Token Leak:</div>
                  <div className="flex items-center gap-2 bg-slate-900 text-teal-400 font-mono text-sm px-3.5 py-2.5 rounded-md border border-slate-800 shadow-inner">
                    <span className="flex-1 select-all">{tokenPreview}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(tokenPreview)}
                      className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {provenance?.explanation && (
                  <div className="text-xs text-slate-700 bg-white border border-teal-100 rounded p-3">
                    <span className="font-semibold text-slate-900 block mb-1">Trace Correlation:</span>
                    {provenance.explanation}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded border border-teal-100">
                    <span className="text-slate-400 block font-mono text-[10px]">SOURCE ID</span>
                    <span className="font-mono text-slate-800">{provenance?.source_id || finding.source_id || 'synthetic_rag_doc'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-teal-100">
                    <span className="text-slate-400 block font-mono text-[10px]">SOURCE TYPE</span>
                    <span className="font-mono text-slate-800">{provenance?.source_type || 'RAG_SYNTHETIC_DOCUMENT'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence Details */}
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Code2 className="h-4 w-4 text-slate-500" />
                Raw Evidence & Assertion Failure
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {finding.evidence_reference?.assertion_type && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <span className="font-semibold text-slate-500 block mb-1">Assertion Type:</span>
                    <span className="font-mono text-slate-800">{finding.evidence_reference.assertion_type}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <span className="font-semibold text-slate-500 block mb-1">Assertion ID:</span>
                    <span className="font-mono text-slate-800">{finding.evidence_reference.assertion_id || 'N/A'}</span>
                  </div>
                </div>
              )}

              {finding.evidence_reference?.expected_value && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Expected Condition:</span>
                  <pre className="text-xs font-mono bg-slate-50 text-slate-700 p-2.5 rounded border border-slate-200 overflow-x-auto whitespace-pre-wrap">
                    {finding.evidence_reference.expected_value}
                  </pre>
                </div>
              )}

              {finding.evidence_reference?.actual_value && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Actual Output / Violation:</span>
                  <pre className="text-xs font-mono bg-rose-50/60 text-rose-900 p-2.5 rounded border border-rose-200 overflow-x-auto whitespace-pre-wrap">
                    {finding.evidence_reference.actual_value}
                  </pre>
                </div>
              )}

              {/* Full JSON Explorer */}
              <div className="space-y-1 pt-2">
                <span className="text-xs font-semibold text-slate-600">Full Evidence Payload (JSON):</span>
                <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto border border-slate-800">
                  {JSON.stringify(finding.evidence_reference, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Scientific Disclaimer / Research Limitations */}
          <Card className="border border-amber-200/80 bg-amber-50/30 shadow-sm">
            <CardHeader className="py-3 px-5 border-b border-amber-100">
              <CardTitle className="text-xs font-semibold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Info className="h-3.5 w-3.5 text-amber-600" />
                Scientific Provenance Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-amber-900/90 leading-relaxed space-y-2">
              <p>
                Dynamic canary tainting is an active security testing instrumentation technique that detects explicit synthetic token leakage and instruction bypasses.
              </p>
              {limitations.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                  {limitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              ) : (
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                  <li>Canary tokens measure exact string leaks and direct token reproduction.</li>
                  <li>Paraphrased semantic summaries without token preservation require supplementary semantic assertions.</li>
                  <li>Absence of canary leakage indicates resistance on instrumented paths, not complete immunity to unmodeled attack vectors.</li>
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Status & Triage History Audit Trail */}
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="py-3 px-5 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-slate-400" />
                Status & Triage History Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {isHistoryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !history || history.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No triage history recorded for this finding.</p>
              ) : (
                <div className="relative pl-4 border-l border-slate-200 space-y-4 text-xs">
                  {history.map((h: FindingStatusHistory) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{h.old_status}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-semibold text-teal-700">{h.new_status}</span>
                        <span className="text-[11px] text-slate-400 font-mono ml-auto">
                          {formatDate(h.created_at)}
                        </span>
                      </div>
                      {h.rationale && (
                        <p className="text-slate-600 text-[11px] mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                          {h.rationale}
                        </p>
                      )}
                      {h.review_date && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Next review scheduled: {formatDate(h.review_date)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata & Remediation */}
        <div className="space-y-6">
          {/* Finding Identity Metadata */}
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Finding Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div>
                <span className="block font-medium text-slate-400 text-[11px]">Finding ID</span>
                <span className="font-mono text-slate-800 break-all select-all">{finding.id}</span>
              </div>
              {finding.deduplication_key && (
                <div>
                  <span className="block font-medium text-slate-400 text-[11px]">Deduplication Hash</span>
                  <span className="font-mono text-slate-600 text-[10px] break-all">{finding.deduplication_key}</span>
                </div>
              )}
              {finding.test_run_id && (
                <div>
                  <span className="block font-medium text-slate-400 text-[11px]">Test Run ID</span>
                  <Link
                    href={`/test-runs/${finding.test_run_id}`}
                    className="font-mono text-teal-700 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    {finding.test_run_id}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
              {finding.canary_id && (
                <div>
                  <span className="block font-medium text-slate-400 text-[11px]">Canary Database Record ID</span>
                  <span className="font-mono text-slate-800 break-all">{finding.canary_id}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attribution Model Guide */}
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                Attribution Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className={`p-2 rounded border ${finding.attribution_level === 'CONFIRMED_SOURCE_MATCH' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-100'}`}>
                <div className="font-semibold text-emerald-900 font-mono text-[11px]">1. CONFIRMED_SOURCE_MATCH</div>
                <p className="text-[11px] text-slate-600 mt-0.5">Exact token match with registered synthetic source instrumented during this execution.</p>
              </div>
              <div className={`p-2 rounded border ${finding.attribution_level === 'OBSERVED_CANARY' ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-100'}`}>
                <div className="font-semibold text-teal-900 font-mono text-[11px]">2. OBSERVED_CANARY</div>
                <p className="text-[11px] text-slate-600 mt-0.5">Canary token verified by HMAC signature but source mapping partially detached.</p>
              </div>
              <div className={`p-2 rounded border ${finding.attribution_level === 'TRACE_CORRELATED' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="font-semibold text-indigo-900 font-mono text-[11px]">3. TRACE_CORRELATED</div>
                <p className="text-[11px] text-slate-600 mt-0.5">Observed in intermediate tool calls or payload traces rather than final response.</p>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Remediation */}
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-teal-600" />
                Remediation Guidance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p className="font-medium text-slate-800">
                Recommended defensive hardening for {finding.category}:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Separate untrusted external context from system control instructions using explicit delimiters or structured XML/JSON envelopes.</li>
                <li>Implement output filters and taint checking at tool execution boundaries to prevent unauthorized execution.</li>
                <li>Apply the principle of least privilege to model tools and APIs, requiring user approval for state-altering operations.</li>
                <li>Conduct continuous regression testing using session-bound canaries to verify prompt fence efficacy.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
