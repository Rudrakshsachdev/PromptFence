'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Beaker,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  ExternalLink,
  Flame,
  Layers,
  Microscope,
  Play,
  Plus,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useExperiments,
  useCreateExperiment,
  useRunExperiment,
  useSecurityUtilitySummary,
} from '@/hooks/use-evaluation';
import { useTargets } from '@/hooks/use-targets';
import { useTestRuns } from '@/hooks/use-test-runs';
import { formatDate } from '@/lib/utils';
import { EvaluationExperiment, PairedEvaluationItem } from '@/types/evaluation';

export default function EvaluationPage() {
  const { data: targetsData } = useTargets(1, 100);
  const targets = targetsData?.items || [];
  const { data: completedRunsData } = useTestRuns({ status: 'COMPLETED', page_size: 50 });
  const completedRuns = completedRunsData?.items || [];

  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const activeRunId = selectedRunId || (completedRuns.length > 0 ? completedRuns[0].id : '');

  const { data: utilitySummary, isLoading: isUtilityLoading, refetch: refetchUtility } = useSecurityUtilitySummary(activeRunId);
  const { data: experiments, isLoading: isExperimentsLoading, refetch: refetchExperiments } = useExperiments();

  const createExperimentMutation = useCreateExperiment();
  const runExperimentMutation = useRunExperiment();

  // Create Experiment Modal State
  const [isExpOpen, setIsExpOpen] = useState(false);
  const [expName, setExpName] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expDatasetName, setExpDatasetName] = useState('promptfence-ground-truth-v1');
  const [expTargetId, setExpTargetId] = useState('');
  const [expManifest, setExpManifest] = useState(
    JSON.stringify(
      {
        expected_leakages: [
          {
            case_id: 'sample-case-1',
            should_leak_token: true,
            expected_source: 'synthetic-customer-email-001',
          },
        ],
        untrusted_sources: ['synthetic-customer-email-001'],
      },
      null,
      2
    )
  );
  const [expError, setExpError] = useState<string | null>(null);

  const handleCreateExperiment = async () => {
    setExpError(null);
    if (!expName.trim() || !expTargetId) {
      setExpError('Please provide an experiment name and target.');
      return;
    }
    let parsedManifest = {};
    try {
      parsedManifest = JSON.parse(expManifest);
    } catch {
      setExpError('Ground-truth manifest must be valid JSON.');
      return;
    }
    try {
      await createExperimentMutation.mutateAsync({
        name: expName.trim(),
        description: expDescription.trim() || undefined,
        dataset_name: expDatasetName.trim() || 'promptfence-ground-truth-v1',
        target_id: expTargetId,
        ground_truth_manifest: parsedManifest,
      });
      setIsExpOpen(false);
      setExpName('');
      setExpDescription('');
    } catch (err: unknown) {
      setExpError(err instanceof Error ? err.message : 'Failed to launch research experiment');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security-Utility & Research Evaluation"
        description="Quantify prompt defense trade-offs (security efficacy vs benign over-refusal) and run controlled scientific experiments with ground-truth manifests to evaluate the 6 research metrics."
      >
        <div className="flex items-center gap-2">
          {/* New Experiment Modal */}
          <Dialog open={isExpOpen} onOpenChange={setIsExpOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs shadow-sm">
                <Microscope className="h-3.5 w-3.5" />
                New Research Experiment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Register Research Evaluation Experiment</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Prepares an experimental run against a ground-truth manifest to calculate formal research metrics.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experiment Name</label>
                  <Input
                    placeholder="e.g., Llama-3-Canary-Provenance-Accuracy-Run-1"
                    value={expName}
                    onChange={(e) => setExpName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">AI Target</label>
                    <select
                      value={expTargetId}
                      onChange={(e) => setExpTargetId(e.target.value)}
                      aria-label="Select AI target for experiment"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">Select Target...</option>
                      {targets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dataset Name</label>
                    <Input
                      value={expDatasetName}
                      onChange={(e) => setExpDatasetName(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ground-Truth Manifest (JSON)</label>
                  <Textarea
                    rows={6}
                    value={expManifest}
                    onChange={(e) => setExpManifest(e.target.value)}
                    className="font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hypothesis / Description (Optional)</label>
                  <Input
                    placeholder="Hypothesis on indirect prompt injection defense..."
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    className="text-xs"
                  />
                </div>
                {expError && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                    {expError}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsExpOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white"
                  onClick={handleCreateExperiment}
                  disabled={createExperimentMutation.isPending}
                >
                  {createExperimentMutation.isPending ? 'Registering...' : 'Register Experiment'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchUtility();
              refetchExperiments();
            }}
            className="border-slate-200 text-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PageHeader>

      {/* Tabs: Security-Utility Trade-Offs vs Research Experiments */}
      <Tabs defaultValue="utility" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 border border-slate-200/80">
          <TabsTrigger value="utility" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-teal-800 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            Security-Utility Paired Trade-Offs
          </TabsTrigger>
          <TabsTrigger value="experiments" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-teal-800 flex items-center gap-1.5">
            <Beaker className="h-3.5 w-3.5" />
            Ground-Truth Research Experiments
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Security-Utility Paired Testing */}
        <TabsContent value="utility" className="space-y-6">
          {/* Run Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Evaluated Run:</span>
            <select
              value={activeRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              aria-label="Select test run for security-utility evaluation"
              className="text-xs font-medium bg-white border border-slate-200 rounded-md px-3 py-1.5 text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 max-w-sm"
            >
              {completedRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.test_suite?.name || 'Suite'} — {formatDate(r.created_at)} ({r.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border border-slate-200/80 shadow-sm bg-white p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Case Pairs
              </span>
              <div className="text-3xl font-bold font-mono text-slate-900 mt-1">
                {utilitySummary?.total_pairs ?? 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Paired adversarial vs benign controls</p>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm bg-white p-4">
              <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">
                Security Defense Rate
              </span>
              <div className="text-3xl font-bold font-mono text-teal-800 mt-1">
                {(utilitySummary?.security_pass_rate_pct ?? 100).toFixed(1)}%
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Attacks successfully mitigated</p>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm bg-white p-4">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Benign Completion Rate
              </span>
              <div className="text-3xl font-bold font-mono text-emerald-700 mt-1">
                {(utilitySummary?.benign_completion_rate_pct ?? 100).toFixed(1)}%
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Normal prompt completion preserved</p>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm bg-white p-4">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                Over-Refusal Rate
              </span>
              <div className="text-3xl font-bold font-mono text-amber-700 mt-1">
                {(utilitySummary?.over_refusal_rate_pct ?? 0).toFixed(1)}%
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Benign tasks erroneously rejected</p>
            </Card>
          </div>

          {/* Paired Evaluations Table */}
          <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-teal-600" />
                  Paired Case Outcomes ({utilitySummary?.pairs?.length || 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isUtilityLoading ? (
                <div className="p-5 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !utilitySummary?.pairs || utilitySummary.pairs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No paired evaluations found for the selected test run.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/75">
                    <TableRow className="border-slate-100">
                      <TableHead className="text-xs font-semibold text-slate-600">Pair ID</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-center">Security Verdict</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-center">Utility Verdict</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-center">Over-Refusal?</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-600">Evaluated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utilitySummary.pairs.map((p: PairedEvaluationItem) => (
                      <TableRow key={p.pair_id} className="hover:bg-slate-50/50">
                        <TableCell className="py-3 font-mono text-xs font-medium text-slate-800">
                          {p.pair_id}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              p.security_verdict === 'PASSED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            {p.security_verdict}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              p.utility_verdict === 'SATISFIED'
                                ? 'bg-teal-50 text-teal-700 border-teal-300'
                                : p.utility_verdict === 'OVER_REFUSAL'
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.utility_verdict}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          {p.is_over_refusal ? (
                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-bold">
                              YES
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">No</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-mono text-slate-500">
                          {formatDate(p.evaluated_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Research Experiments & Academic Metrics */}
        <TabsContent value="experiments" className="space-y-6">
          <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Beaker className="h-4 w-4 text-teal-600" />
                  Scientific Research Evaluation Experiments ({experiments?.length || 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isExperimentsLoading ? (
                <div className="p-5 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !experiments || experiments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No research experiments recorded yet. Click <strong>&quot;New Research Experiment&quot;</strong> to evaluate dynamic canary tainting with ground-truth manifests.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/75">
                    <TableRow className="border-slate-100">
                      <TableHead className="text-xs font-semibold text-slate-600">Experiment</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Dataset</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-center">Attribution Accuracy</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-center">Precision / Recall</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-center">Latency Overhead</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-600">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {experiments.map((exp: EvaluationExperiment) => {
                      const metrics = exp.results_summary?.metrics;
                      return (
                        <TableRow key={exp.id} className="hover:bg-slate-50/50">
                          <TableCell className="py-3">
                            <Link href={`/evaluation/experiments/${exp.id}`} className="font-semibold text-xs text-slate-900 hover:text-teal-700">
                              {exp.name}
                            </Link>
                            {exp.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{exp.description}</p>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-slate-700 font-medium">
                            {exp.dataset_name}
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                exp.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : exp.status === 'RUNNING'
                                  ? 'bg-teal-50 text-teal-700 border-teal-300'
                                  : 'bg-slate-50 text-slate-600'
                              }`}
                            >
                              {exp.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <span className="font-mono font-bold text-xs text-teal-800">
                              {metrics ? `${(metrics.provenance_attribution_accuracy * 100).toFixed(1)}%` : '—'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-center text-xs font-mono text-slate-700">
                            {metrics ? `${(metrics.precision * 100).toFixed(0)}% / ${(metrics.recall * 100).toFixed(0)}%` : '—'}
                          </TableCell>
                          <TableCell className="py-3 text-center font-mono text-xs text-slate-700">
                            {metrics ? `${metrics.execution_latency_overhead_ms.toFixed(0)} ms` : '—'}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            {exp.status === 'DRAFT' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-teal-700 hover:text-teal-900 gap-1 border-teal-200"
                                onClick={() => runExperimentMutation.mutate(exp.id)}
                                disabled={runExperimentMutation.isPending}
                              >
                                <Play className="h-3 w-3" /> Run
                              </Button>
                            ) : (
                              <Link href={`/evaluation/experiments/${exp.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-teal-700 hover:text-teal-900">
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
