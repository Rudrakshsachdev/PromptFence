'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Crosshair, Fingerprint, Layers, Loader2, Play, Plus, SlidersHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { FormField } from '@/components/forms/form-field';
import { SearchInput } from '@/components/forms/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { DetailList } from '@/components/shared/detail-list';
import { ErrorState } from '@/components/shared/error-state';
import { Panel } from '@/components/shared/panel';
import { PageSkeleton } from '@/components/shared/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useTargets } from '@/hooks/use-targets';
import { useCreateTestRun } from '@/hooks/use-test-runs';
import { useTestSuites } from '@/hooks/use-test-suites';
import { humanize } from '@/lib/format';
import { getTargetTypeLabel } from '@/lib/status';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CONCURRENCY_RANGE = { min: 1, max: 5 };
const TIMEOUT_RANGE = { min: 5, max: 120 };

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded border border-border bg-surface font-mono text-[11px] text-muted-foreground">
        {step}
      </span>
      {title}
    </span>
  );
}

function OptionCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full min-w-0 flex-col gap-2 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        selected ? 'border-primary/60 bg-primary/[0.07]' : 'border-border bg-background/40 hover:border-border-strong hover:bg-surface/40',
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-primary' : 'text-subtle-foreground')} />
          <span className="truncate text-[13px] font-medium text-foreground">{title}</span>
        </span>
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong',
          )}
        >
          {selected && <Check className="h-2.5 w-2.5" />}
        </span>
      </div>
      {subtitle && <p className="line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>}
      {children}
    </button>
  );
}

function NewTestRunView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetsQuery = useTargets(1, 100);
  const suitesQuery = useTestSuites(1, 100);
  const createMutation = useCreateTestRun();

  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [canaryEnabled, setCanaryEnabled] = useState<boolean>(true);
  const [concurrency, setConcurrency] = useState<string>('1');
  const [timeoutSeconds, setTimeoutSeconds] = useState<string>('30');
  const [targetSearch, setTargetSearch] = useState('');
  const [suiteSearch, setSuiteSearch] = useState('');

  const targets = useMemo(() => (targetsQuery.data?.items ?? []).filter((t) => t.is_active), [targetsQuery.data]);
  const suites = useMemo(() => (suitesQuery.data?.items ?? []).filter((s) => s.is_active), [suitesQuery.data]);
  const inactiveTargets = (targetsQuery.data?.items.length ?? 0) - targets.length;

  // Pre-select from ?target= / ?suite= (links from target and suite detail pages).
  const targetParam = searchParams.get('target');
  const suiteParam = searchParams.get('suite');
  useEffect(() => {
    if (targetParam && !selectedTargetId && targets.some((t) => t.id === targetParam)) setSelectedTargetId(targetParam);
  }, [targetParam, targets, selectedTargetId]);
  useEffect(() => {
    if (suiteParam && !selectedSuiteId && suites.some((s) => s.id === suiteParam)) setSelectedSuiteId(suiteParam);
  }, [suiteParam, suites, selectedSuiteId]);

  const selectedTarget = targets.find((t) => t.id === selectedTargetId);
  const selectedSuite = suites.find((s) => s.id === selectedSuiteId);

  const concurrencyNum = Number(concurrency);
  const timeoutNum = Number(timeoutSeconds);
  const concurrencyError =
    !Number.isInteger(concurrencyNum) || concurrencyNum < CONCURRENCY_RANGE.min || concurrencyNum > CONCURRENCY_RANGE.max
      ? `Enter a whole number between ${CONCURRENCY_RANGE.min} and ${CONCURRENCY_RANGE.max}.`
      : undefined;
  const timeoutError =
    !Number.isInteger(timeoutNum) || timeoutNum < TIMEOUT_RANGE.min || timeoutNum > TIMEOUT_RANGE.max
      ? `Enter a whole number of seconds between ${TIMEOUT_RANGE.min} and ${TIMEOUT_RANGE.max}.`
      : undefined;

  const suiteEmpty = selectedSuite ? selectedSuite.scenario_count === 0 : false;
  const canLaunch =
    !!selectedTargetId && !!selectedSuiteId && !concurrencyError && !timeoutError && !createMutation.isPending;

  const filteredTargets = targets.filter((t) =>
    `${t.name} ${t.base_url}${t.endpoint}`.toLowerCase().includes(targetSearch.trim().toLowerCase()),
  );
  const filteredSuites = suites.filter((s) =>
    `${s.name} ${s.description ?? ''}`.toLowerCase().includes(suiteSearch.trim().toLowerCase()),
  );

  const handleLaunch = () => {
    if (!selectedTargetId) {
      toast.error('Please select a target application to test');
      return;
    }
    if (!selectedSuiteId) {
      toast.error('Please select an adversarial test suite');
      return;
    }
    if (concurrencyError || timeoutError) {
      toast.error('Fix the execution parameters before launching');
      return;
    }

    createMutation.mutate(
      {
        target_id: selectedTargetId,
        test_suite_id: selectedSuiteId,
        canary_tainting_enabled: canaryEnabled,
        concurrency: concurrencyNum,
        timeout_seconds: timeoutNum,
      },
      {
        onSuccess: (newRun) => {
          router.push(`/test-runs/${newRun.id}`);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Launch test run"
        description="Select a target and a suite of attack scenarios, then configure canary tainting and execution limits."
        backHref="/test-runs"
        backLabel="Test Runs"
        icon={Play}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {/* Step 1: target */}
          <Panel
            title={<StepHeader step={1} title="Target" />}
            description="The LLM, RAG, or agent endpoint under test"
            actions={
              <Button asChild variant="ghost" size="xs">
                <Link href="/targets/new">
                  <Plus className="h-3 w-3" /> Register target
                </Link>
              </Button>
            }
          >
            {targetsQuery.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : targetsQuery.error ? (
              <ErrorState error={targetsQuery.error} onRetry={() => targetsQuery.refetch()} compact />
            ) : targets.length === 0 ? (
              <EmptyState
                compact
                icon={Crosshair}
                title="No active targets"
                description={
                  inactiveTargets > 0
                    ? `${inactiveTargets} target(s) are disabled. Enable one or register a new target.`
                    : 'Register a target endpoint before launching a run.'
                }
                actionText="Register target"
                actionHref="/targets/new"
              />
            ) : (
              <div className="space-y-3">
                {targets.length > 6 && (
                  <SearchInput
                    placeholder="Search targets"
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    onClear={() => setTargetSearch('')}
                  />
                )}
                <div role="radiogroup" aria-label="Target" className="grid max-h-[360px] gap-3 overflow-y-auto sm:grid-cols-2">
                  {filteredTargets.map((t) => (
                    <OptionCard
                      key={t.id}
                      selected={selectedTargetId === t.id}
                      onSelect={() => setSelectedTargetId(t.id)}
                      icon={Crosshair}
                      title={t.name}
                      subtitle={t.description ?? undefined}
                    >
                      <span className="truncate font-mono text-[11px] text-muted-foreground" title={`${t.base_url}${t.endpoint}`}>
                        {t.http_method} {t.base_url}
                        {t.endpoint}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        <span className="rounded border border-border bg-surface px-1.5 py-px text-[10px] text-foreground/85">
                          {getTargetTypeLabel(t.target_type)}
                        </span>
                        <span className="rounded border border-border bg-surface px-1.5 py-px text-[10px] text-muted-foreground">
                          Auth: {t.authentication_type === 'NONE' ? 'none' : humanize(t.authentication_type)}
                        </span>
                      </span>
                    </OptionCard>
                  ))}
                  {filteredTargets.length === 0 && (
                    <p className="col-span-full py-4 text-center text-xs text-muted-foreground">No targets match “{targetSearch}”.</p>
                  )}
                </div>
              </div>
            )}
          </Panel>

          {/* Step 2: suite */}
          <Panel
            title={<StepHeader step={2} title="Test suite" />}
            description="Ordered set of attack scenarios and assertions to execute"
            actions={
              <Button asChild variant="ghost" size="xs">
                <Link href="/test-suites/new">
                  <Plus className="h-3 w-3" /> Create suite
                </Link>
              </Button>
            }
          >
            {suitesQuery.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : suitesQuery.error ? (
              <ErrorState error={suitesQuery.error} onRetry={() => suitesQuery.refetch()} compact />
            ) : suites.length === 0 ? (
              <EmptyState
                compact
                icon={Layers}
                title="No active test suites"
                description="Create a suite and add scenarios to it before launching a run."
                actionText="Create suite"
                actionHref="/test-suites/new"
              />
            ) : (
              <div className="space-y-3">
                {suites.length > 6 && (
                  <SearchInput
                    placeholder="Search suites"
                    value={suiteSearch}
                    onChange={(e) => setSuiteSearch(e.target.value)}
                    onClear={() => setSuiteSearch('')}
                  />
                )}
                <div role="radiogroup" aria-label="Test suite" className="grid max-h-[320px] gap-3 overflow-y-auto sm:grid-cols-2">
                  {filteredSuites.map((s) => (
                    <OptionCard
                      key={s.id}
                      selected={selectedSuiteId === s.id}
                      onSelect={() => setSelectedSuiteId(s.id)}
                      icon={Layers}
                      title={s.name}
                      subtitle={s.description ?? undefined}
                    >
                      <span
                        className={cn(
                          'font-mono text-[11px]',
                          s.scenario_count === 0 ? 'text-warning' : 'text-muted-foreground',
                        )}
                      >
                        {s.scenario_count} {s.scenario_count === 1 ? 'scenario' : 'scenarios'}
                      </span>
                    </OptionCard>
                  ))}
                  {filteredSuites.length === 0 && (
                    <p className="col-span-full py-4 text-center text-xs text-muted-foreground">No suites match “{suiteSearch}”.</p>
                  )}
                </div>
              </div>
            )}
          </Panel>

          {/* Step 3: parameters */}
          <Panel title={<StepHeader step={3} title="Execution parameters" />} description="Canary instrumentation and runtime limits">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-background/40 p-3.5">
                <div className="min-w-0 space-y-1">
                  <p className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                    <Fingerprint className="h-4 w-4 text-primary" /> Session-bound canary tainting
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Generates HMAC-signed canary tokens bound to this run and injects them into synthetic sources so
                    exposure can be detected by exact token match and traced back to its origin.
                  </p>
                </div>
                <Switch
                  checked={canaryEnabled}
                  onCheckedChange={setCanaryEnabled}
                  aria-label="Enable canary tainting"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="concurrency"
                  label="Concurrency"
                  description={`Parallel scenarios (${CONCURRENCY_RANGE.min}–${CONCURRENCY_RANGE.max}).`}
                  error={concurrencyError}
                >
                  <Input
                    id="concurrency"
                    type="number"
                    inputMode="numeric"
                    min={CONCURRENCY_RANGE.min}
                    max={CONCURRENCY_RANGE.max}
                    value={concurrency}
                    aria-invalid={!!concurrencyError}
                    onChange={(e) => setConcurrency(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
                <FormField
                  id="timeout"
                  label="Scenario timeout (seconds)"
                  description={`Max execution window per scenario (${TIMEOUT_RANGE.min}–${TIMEOUT_RANGE.max}).`}
                  error={timeoutError}
                >
                  <Input
                    id="timeout"
                    type="number"
                    inputMode="numeric"
                    min={TIMEOUT_RANGE.min}
                    max={TIMEOUT_RANGE.max}
                    value={timeoutSeconds}
                    aria-invalid={!!timeoutError}
                    onChange={(e) => setTimeoutSeconds(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
              </div>
            </div>
          </Panel>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Panel title="Run summary" icon={SlidersHorizontal}>
            <div className="space-y-4">
              <DetailList
                columns={1}
                items={[
                  {
                    label: 'Target',
                    value: selectedTarget ? (
                      <span>
                        {selectedTarget.name}
                        <span className="block truncate font-mono text-[11px] text-muted-foreground">
                          {selectedTarget.base_url}
                          {selectedTarget.endpoint}
                        </span>
                      </span>
                    ) : (
                      <span className="text-subtle-foreground">Not selected</span>
                    ),
                  },
                  {
                    label: 'Test suite',
                    value: selectedSuite ? (
                      <span>
                        {selectedSuite.name}
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          {selectedSuite.scenario_count} scenarios
                        </span>
                      </span>
                    ) : (
                      <span className="text-subtle-foreground">Not selected</span>
                    ),
                  },
                  { label: 'Canary tainting', value: canaryEnabled ? 'Enabled' : 'Disabled' },
                  {
                    label: 'Limits',
                    mono: true,
                    value: `concurrency ${concurrencyError ? '—' : concurrencyNum} · timeout ${timeoutError ? '—' : `${timeoutNum}s`}`,
                  },
                ]}
              />
              {suiteEmpty && (
                <p className="rounded-md border border-warning/25 bg-warning/5 px-3 py-2 text-xs text-warning">
                  This suite has no scenarios. The run will complete without executing any cases.
                </p>
              )}
              <Button className="w-full" onClick={handleLaunch} disabled={!canLaunch}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Launching…
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" /> Launch test run
                  </>
                )}
              </Button>
              {!selectedTargetId || !selectedSuiteId ? (
                <p className="text-center text-[11px] text-subtle-foreground">Select a target and a suite to continue.</p>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default function NewTestRunPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewTestRunView />
    </Suspense>
  );
}
