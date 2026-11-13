'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code,
  Copy,
  ExternalLink,
  Flame,
  GitBranch,
  Key,
  Layers,
  Radio,
  Shield,
  ShieldAlert,
  Terminal,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  useCaseAssertions,
  useCaseEvents,
  useCaseTraces,
  useTestCaseDetail,
} from '@/hooks/use-test-runs';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function TestCaseDetailPage() {
  const params = useParams();
  const runId = params.runId as string;
  const caseId = params.caseId as string;

  const { data: testCase, isLoading } = useTestCaseDetail(runId, caseId);
  const { data: assertions } = useCaseAssertions(runId, caseId);
  const { data: traces } = useCaseTraces(runId, caseId);
  const { data: events } = useCaseEvents(runId, caseId);

  const [activeTab, setActiveTab] = useState('assertions');

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!testCase) {
    return (
      <div className="text-center py-16 space-y-4">
        <h3 className="text-base font-bold text-slate-800">Test Case Not Found</h3>
        <Button asChild size="sm">
          <Link href={`/test-runs/${runId}`}>Back to Test Run</Link>
        </Button>
      </div>
    );
  }

  const scenario = testCase.scenario_snapshot || {};
  const isFailed = testCase.status === 'FAILED';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href={`/test-runs/${runId}`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Test Run #{runId.slice(0, 8)}
          </Link>
        </Button>
      </div>

      {/* Case Header Card */}
      <div className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400">
                Step #{testCase.execution_order}
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {scenario.name || 'Adversarial Test Case'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {scenario.description || 'Evaluation test scenario'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${
                testCase.status === 'PASSED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : testCase.status === 'FAILED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {testCase.status}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs bg-slate-50 text-slate-600">
              {testCase.duration_ms ? `${testCase.duration_ms}ms` : '—'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
          <span>Category: <strong className="text-slate-800">{scenario.category}</strong></span>
          <span>•</span>
          <span>Severity: <strong className="text-slate-800">{scenario.severity}</strong></span>
          <span>•</span>
          <span>Executed: {formatDate(testCase.started_at || testCase.created_at)}</span>
        </div>
      </div>

      {/* Provenance Lineage Card */}
      <Card className="border border-teal-200/80 bg-teal-50/20 shadow-2xs">
        <CardHeader className="pb-3 border-b border-teal-100">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-teal-700" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-900">
              Canary Tainting & Provenance Verification Flow
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-600">
            Cryptographic audit trail demonstrating session-bound token instrumentation and verified attribution.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-md border border-teal-100 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-bold text-teal-600 uppercase block mb-1">1. Generation</span>
              <p className="text-xs font-semibold text-slate-800">128-bit Random Token</p>
              <span className="text-[10px] text-slate-400 font-mono">HMAC-SHA256 (v1)</span>
            </div>
            <div className="rounded-md border border-teal-100 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-bold text-teal-600 uppercase block mb-1">2. Instrumentation</span>
              <p className="text-xs font-semibold text-slate-800">Synthetic Source</p>
              <span className="text-[10px] text-slate-400 font-mono">RAG Chunk Injection</span>
            </div>
            <div className="rounded-md border border-teal-100 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-bold text-teal-600 uppercase block mb-1">3. Execution</span>
              <p className="text-xs font-semibold text-slate-800">Target Dispatched</p>
              <span className="text-[10px] text-slate-400 font-mono">Trace Capture</span>
            </div>
            <div className={`rounded-md border p-3 shadow-2xs ${isFailed ? 'border-rose-200 bg-rose-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
              <span className={`text-[10px] font-bold uppercase block mb-1 ${isFailed ? 'text-rose-700' : 'text-emerald-700'}`}>
                4. Attribution
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {isFailed ? 'Canary Leakage Confirmed' : 'Zero Canary Exposure'}
              </p>
              <span className="text-[10px] font-mono text-slate-500">
                {isFailed ? 'CONFIRMED_SOURCE_MATCH' : 'PASSED'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100/90 p-1 border border-slate-200/60">
          <TabsTrigger value="assertions" className="text-xs gap-1.5 font-medium">
            <Shield className="h-3.5 w-3.5" /> Assertions ({assertions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="payload" className="text-xs gap-1.5 font-medium">
            <Terminal className="h-3.5 w-3.5" /> Payload & Response
          </TabsTrigger>
          <TabsTrigger value="traces" className="text-xs gap-1.5 font-medium">
            <Radio className="h-3.5 w-3.5" /> Target Traces ({traces?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Assertions */}
        <TabsContent value="assertions">
          <Card className="border border-slate-200/80 shadow-2xs">
            <CardContent className="p-0">
              {(!assertions || assertions.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No assertions evaluated yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/60">
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Assertion ID</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Type</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Outcome</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Evidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assertions.map((a) => (
                      <TableRow key={a.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-mono text-xs font-semibold text-slate-800">
                          {a.assertion_id}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {a.assertion_type}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              a.status === 'PASSED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {a.actual_value || 'Evaluation complete'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Payload & Response */}
        <TabsContent value="payload">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border border-slate-200/80 shadow-2xs">
              <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-900">
                  Attack Prompt Template
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded-md overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {scenario.attack_input_template || 'No input template'}
                </pre>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-2xs">
              <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-900">
                  Target Response Output
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <pre className="text-xs font-mono bg-slate-50 text-slate-800 p-3 rounded-md border border-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {String(
                    testCase.normalized_response_metadata?.response_preview ||
                      testCase.error_message ||
                      'Response received successfully.'
                  )}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Target Traces */}
        <TabsContent value="traces">
          <Card className="border border-slate-200/80 shadow-2xs">
            <CardContent className="p-0">
              {(!traces || traces.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No intermediate execution traces returned by target adapter.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {traces.map((tr) => (
                    <div key={tr.id} className="p-3 text-xs font-mono space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200">
                          {tr.trace_type}
                        </Badge>
                        <span className="text-slate-500">Source: {tr.source_id || 'unattributed'}</span>
                      </div>
                      <pre className="bg-slate-50 p-2 rounded text-[11px] text-slate-700 overflow-x-auto">
                        {JSON.stringify(tr.trace_metadata, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
