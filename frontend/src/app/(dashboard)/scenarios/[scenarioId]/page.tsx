'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Copy,
  Edit,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  Check,
} from 'lucide-react';
import { PageActions, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteScenario, useScenario } from '@/hooks/use-scenarios';
import { formatDate } from '@/lib/utils';
import { ScenarioCategory, ScenarioSeverity } from '@/types/scenario';
import { toast } from 'sonner';

export default function ScenarioDetailPage() {
  const params = useParams();
  const scenarioId = params.scenarioId as string;
  const router = useRouter();

  const { data: scenario, isLoading } = useScenario(scenarioId);
  const deleteMutation = useDeleteScenario();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="text-center py-16 space-y-4">
        <h3 className="text-base font-bold text-slate-800">Scenario not found</h3>
        <p className="text-xs text-slate-500">The requested attack vector does not exist or has been deleted.</p>
        <Button asChild size="sm">
          <Link href="/scenarios">Back to Scenario Library</Link>
        </Button>
      </div>
    );
  }

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(scenario.attack_input_template);
    setCopiedPayload(true);
    toast.success('Attack payload copied');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const targetsList = scenario.applicable_target_types || ['ALL'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href="/scenarios">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Scenario Library
          </Link>
        </Button>
      </div>

      <PageHeader
        title={scenario.name}
        description={scenario.description || 'Adversarial Prompt Vector Definition & Assertion Bounds'}
        badge={
          <div className="flex items-center gap-2">
            <CategoryBadge category={scenario.category as ScenarioCategory} />
            <SeverityBadge severity={scenario.severity as ScenarioSeverity} />
            <StatusBadge isActive={scenario.is_enabled} activeText="Armed" inactiveText="Disabled" />
          </div>
        }
      >
        <PageActions>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href={`/scenarios/${scenarioId}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Edit Scenario
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </PageActions>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Attack Input Inspector */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-teal-600" />
                <span>Adversarial Attack Input Template</span>
              </CardTitle>
              <button
                onClick={handleCopyPayload}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                title="Copy Payload"
              >
                {copiedPayload ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
              </button>
            </CardHeader>
            <CardContent className="pt-4">
              <pre className="p-4 rounded-lg bg-slate-900 text-teal-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed whitespace-pre-wrap">
                {scenario.attack_input_template}
              </pre>
            </CardContent>
          </Card>

          {/* Expected Security Behavior */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Expected Security Baseline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-slate-700 leading-relaxed">
              {scenario.expected_behavior ? (
                <p>{scenario.expected_behavior}</p>
              ) : (
                <p className="text-slate-400 italic">No explicit behavior specification provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Assertion Configuration */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Code2 className="h-4 w-4 text-teal-600" />
                <span>Assertion Evaluation Rules</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {scenario.assertion_config ? (
                <pre className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
                  {JSON.stringify(scenario.assertion_config, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-slate-400 italic">No custom assertion rules defined.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata & Coverage */}
        <div className="space-y-6">
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Target Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs text-slate-500 mb-2">Compatible architectures:</p>
              <div className="flex flex-wrap gap-1.5">
                {targetsList.map((t) => (
                  <Badge key={t} variant="outline" className="font-mono text-[10px] bg-slate-50">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Scenario Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Vector ID:</span>
                <span className="font-mono text-[10px] text-slate-700 truncate max-w-[130px]">
                  {scenario.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="font-mono text-[11px] text-slate-700">{formatDate(scenario.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Modified:</span>
                <span className="font-mono text-[11px] text-slate-700">{formatDate(scenario.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Attack Scenario?"
        description={`Are you sure you want to delete "${scenario.name}"? This action cannot be undone.`}
        confirmText="Delete Scenario"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(scenarioId, {
            onSuccess: () => {
              toast.success('Scenario deleted');
              router.push('/scenarios');
            },
          });
        }}
      />
    </div>
  );
}
