'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Beaker,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  ExternalLink,
  Flame,
  Info,
  KeyRound,
  Layers,
  Microscope,
  Play,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExperiment, useRunExperiment } from '@/hooks/use-evaluation';
import { formatDate } from '@/lib/utils';
import { ResearchMetrics } from '@/types/evaluation';

export default function ExperimentDetailPage() {
  const params = useParams<{ experimentId: string }>();
  const experimentId = params?.experimentId || '';

  const { data: experiment, isLoading, error } = useExperiment(experimentId);
  const runMutation = useRunExperiment();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !experiment) {
    return (
      <div className="space-y-6">
        <Link href="/evaluation" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Research Evaluation
        </Link>
        <Card className="border-rose-200 bg-rose-50/50 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <h2 className="text-base font-semibold text-rose-900">Research Experiment Not Found</h2>
          <p className="text-xs text-rose-700 mt-1">Experiment record could not be loaded or you do not have permission to view it.</p>
        </Card>
      </div>
    );
  }

  const metrics: ResearchMetrics = experiment.results_summary?.metrics || {
    provenance_attribution_accuracy: 0,
    precision: 0,
    recall: 0,
    false_positive_rate: 0,
    event_completeness: 0,
    execution_latency_overhead_ms: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Nav Backlink */}
      <div className="flex items-center justify-between">
        <Link
          href="/evaluation"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Research Evaluation
        </Link>
        <div className="flex items-center gap-2">
          {experiment.status === 'DRAFT' && (
            <Button
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs shadow-sm"
              onClick={() => runMutation.mutate(experiment.id)}
              disabled={runMutation.isPending}
            >
              <Play className="h-3.5 w-3.5" />
              {runMutation.isPending ? 'Executing...' : 'Run Experiment'}
            </Button>
          )}
          <Badge
            variant="outline"
            className={`text-xs font-semibold ${
              experiment.status === 'COMPLETED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-teal-50 text-teal-700 border-teal-300'
            }`}
          >
            {experiment.status}
          </Badge>
        </div>
      </div>

      {/* Hero Banner */}
      <Card className="border border-slate-200/80 shadow-sm bg-white p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Microscope className="h-5 w-5 text-teal-700" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {experiment.name}
            </h1>
          </div>
          {experiment.description && (
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {experiment.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div>
              <span className="font-medium text-slate-400">Target ID: </span>
              <span className="font-semibold text-slate-800 font-mono">{experiment.target_id.slice(0, 8)}...</span>
            </div>
            <div>
              <span className="font-medium text-slate-400">Dataset: </span>
              <span className="font-mono text-slate-700">{experiment.dataset_name} ({experiment.dataset_version})</span>
            </div>
            <div>
              <span className="font-medium text-slate-400">Registered: </span>
              <span className="font-mono text-slate-700">{formatDate(experiment.created_at)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* The 6 Formal Research Metrics */}
      <div>
        <div className="mb-3">
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-teal-600" />
            Formal Academic & Scientific Evaluation Metrics
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Metric 1: Provenance Attribution Accuracy */}
          <Card className="border border-slate-200/80 shadow-sm bg-white p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                1. Attribution Accuracy
              </span>
              <div className="text-2xl font-bold font-mono text-teal-800 mt-2">
                {(metrics.provenance_attribution_accuracy * 100).toFixed(1)}%
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Correct source taint linking</p>
          </Card>

          {/* Metric 2: Precision */}
          <Card className="border border-slate-200/80 shadow-sm bg-white p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                2. Precision
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {(metrics.precision * 100).toFixed(1)}%
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">True positives / all detections</p>
          </Card>

          {/* Metric 3: Recall */}
          <Card className="border border-slate-200/80 shadow-sm bg-white p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                3. Recall
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {(metrics.recall * 100).toFixed(1)}%
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">True positives / ground truth leaks</p>
          </Card>

          {/* Metric 4: False Positive Rate */}
          <Card className="border border-slate-200/80 shadow-sm bg-white p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                4. False Positive Rate
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
                {(metrics.false_positive_rate * 100).toFixed(1)}%
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Spurious taint flags on benign</p>
          </Card>

          {/* Metric 5: Event Completeness */}
          <Card className="border border-slate-200/80 shadow-sm bg-white p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                5. Event Completeness
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {(metrics.event_completeness * 100).toFixed(1)}%
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Execution lifecycle trace coverage</p>
          </Card>

          {/* Metric 6: Latency Overhead */}
          <Card className="border border-slate-200/80 shadow-sm bg-white p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                6. Latency Overhead
              </span>
              <div className="text-2xl font-bold font-mono text-slate-800 mt-2">
                {metrics.execution_latency_overhead_ms.toFixed(0)} <span className="text-xs font-normal">ms</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Canary generation & trace diff cost</p>
          </Card>
        </div>
      </div>

      {/* Ground-Truth Manifest Explorer */}
      <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="py-3.5 px-5 border-b border-slate-100">
          <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="h-4 w-4 text-slate-400" />
            Ground-Truth Experiment Manifest
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-4 overflow-x-auto max-h-80">
            {JSON.stringify(experiment.ground_truth_manifest, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
