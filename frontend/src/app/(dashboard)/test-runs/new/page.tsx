'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Crosshair,
  Flame,
  FlaskConical,
  FolderKanban,
  Info,
  Layers,
  Play,
  Shield,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTargets } from '@/hooks/use-targets';
import { useTestSuites } from '@/hooks/use-test-suites';
import { useCreateTestRun } from '@/hooks/use-test-runs';
import { toast } from 'sonner';

export default function NewTestRunPage() {
  const router = useRouter();
  const { data: targetsData, isLoading: targetsLoading } = useTargets(1, 50);
  const { data: suitesData, isLoading: suitesLoading } = useTestSuites(1, 50);
  const createMutation = useCreateTestRun();

  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [canaryEnabled, setCanaryEnabled] = useState<boolean>(true);
  const [concurrency, setConcurrency] = useState<number>(1);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(30);

  const targets = (targetsData?.items || []).filter((t) => t.is_active);
  const suites = (suitesData?.items || []).filter((s) => s.is_active);

  const selectedTarget = targets.find((t) => t.id === selectedTargetId);
  const selectedSuite = suites.find((s) => s.id === selectedSuiteId);

  const handleLaunch = () => {
    if (!selectedTargetId) {
      toast.error('Please select a target application to test');
      return;
    }
    if (!selectedSuiteId) {
      toast.error('Please select an adversarial test suite');
      return;
    }

    createMutation.mutate(
      {
        target_id: selectedTargetId,
        test_suite_id: selectedSuiteId,
        canary_tainting_enabled: canaryEnabled,
        concurrency,
        timeout_seconds: timeoutSeconds,
      },
      {
        onSuccess: (newRun) => {
          toast.success('Test run queued successfully!');
          router.push(`/test-runs/${newRun.id}`);
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href="/test-runs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Test Runs
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Launch Security Test Execution"
        description="Configure target, test suite, and dynamic canary tainting parameters for adversarial evaluation."
      />

      <div className="space-y-6">
        {/* Step 1: Select Target */}
        <Card className="border border-slate-200/80 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Select AI Target Application
                </CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-6 text-xs text-teal-700">
                <Link href="/targets/new">+ Register Target</Link>
              </Button>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Choose the configured AI application endpoint to evaluate.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {targetsLoading ? (
              <div className="text-xs text-slate-400">Loading targets...</div>
            ) : targets.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-md border-slate-200">
                <p className="text-xs text-slate-500 mb-2">No active targets configured yet.</p>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <Link href="/targets/new">Register a Target</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {targets.map((t) => {
                  const isSelected = selectedTargetId === t.id;
                  const isMock = t.base_url.includes('mock') || t.target_type === 'CUSTOM';
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTargetId(t.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Crosshair className={`h-4 w-4 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                          <h4 className="font-semibold text-xs text-slate-900 truncate max-w-[200px]">
                            {t.name}
                          </h4>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                        {t.description || 'Target endpoint'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-600">
                          {t.target_type}
                        </Badge>
                        {isMock && (
                          <Badge variant="outline" className="text-[10px] font-mono bg-amber-50 text-amber-700 border-amber-200">
                            Mock Simulator
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Select Test Suite */}
        <Card className="border border-slate-200/80 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Select Adversarial Test Suite
                </CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-6 text-xs text-teal-700">
                <Link href="/test-suites/new">+ Create Suite</Link>
              </Button>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Choose the suite of attack vectors and assertions to execute.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {suitesLoading ? (
              <div className="text-xs text-slate-400">Loading test suites...</div>
            ) : suites.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-md border-slate-200">
                <p className="text-xs text-slate-500 mb-2">No test suites available.</p>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <Link href="/test-suites/new">Create a Test Suite</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suites.map((s) => {
                  const isSelected = selectedSuiteId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSuiteId(s.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <FolderKanban className={`h-4 w-4 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                          <h4 className="font-semibold text-xs text-slate-900 truncate max-w-[200px]">
                            {s.name}
                          </h4>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                        {s.description || 'Security evaluation test suite'}
                      </p>
                      <Badge variant="outline" className="text-[10px] font-mono bg-teal-50 text-teal-700 border-teal-200">
                        {s.scenario_count} Scenarios
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Execution Engine & Canary Controls */}
        <Card className="border border-slate-200/80 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Canary Tainting & Execution Controls
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Configure session-bound canary token instrumentation and concurrency settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-teal-100 bg-teal-50/30 p-3.5">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-teal-700" />
                  <span className="text-xs font-semibold text-slate-900">
                    Dynamic Session-Bound Canary Tainting
                  </span>
                  <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-300 text-[10px]">
                    Research Core
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Generates cryptographically random canary tokens bound to this run and injects them into
                  synthetic knowledge base documents and parameters to trace indirect prompt injection.
                </p>
              </div>
              <Switch checked={canaryEnabled} onCheckedChange={setCanaryEnabled} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="concurrency" className="text-xs font-semibold text-slate-700">
                  Execution Concurrency Limit
                </Label>
                <Input
                  id="concurrency"
                  type="number"
                  min={1}
                  max={5}
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value) || 1)}
                  className="h-8 text-xs bg-white"
                />
                <p className="text-[10px] text-slate-400">Maximum parallel test cases (1 - 5).</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timeout" className="text-xs font-semibold text-slate-700">
                  Scenario Timeout (seconds)
                </Label>
                <Input
                  id="timeout"
                  type="number"
                  min={5}
                  max={120}
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 30)}
                  className="h-8 text-xs bg-white"
                />
                <p className="text-[10px] text-slate-400">Max execution window per test case.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Execution Summary & Launch CTA */}
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-teal-600" /> Ready to Execute
            </h4>
            <p className="text-[11px] text-slate-500">
              Target: <span className="font-semibold text-slate-800">{selectedTarget?.name || 'Not selected'}</span> | Suite:{' '}
              <span className="font-semibold text-slate-800">{selectedSuite?.name || 'Not selected'}</span> (
              {selectedSuite?.scenario_count || 0} scenarios)
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleLaunch}
            disabled={!selectedTargetId || !selectedSuiteId || createMutation.isPending}
            className="w-full sm:w-auto h-9 px-5 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-2xs"
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Initializing...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5 fill-current" /> Launch Test Run
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
