'use client';

import React, { useMemo, useState } from 'react';
import { Microscope } from 'lucide-react';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreateExperiment } from '@/hooks/use-evaluation';
import { getTargetTypeLabel } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Target } from '@/types/target';

const DEFAULT_MANIFEST = JSON.stringify(
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
  2,
);

function parseManifest(text: string): { value: Record<string, unknown> | null; error: string | null } {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { value: null, error: 'Manifest must be a JSON object.' };
    }
    return { value: parsed as Record<string, unknown>, error: null };
  } catch (err) {
    return { value: null, error: err instanceof Error ? err.message : 'Invalid JSON syntax' };
  }
}

/** Registers a ground-truth research experiment (POST /evaluation/experiments). */
export function CreateExperimentDialog({
  open,
  onOpenChange,
  targets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: Target[];
}) {
  const createExperiment = useCreateExperiment();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [datasetName, setDatasetName] = useState('promptfence-ground-truth-v1');
  const [datasetVersion, setDatasetVersion] = useState('1.0.0');
  const [targetId, setTargetId] = useState('');
  const [repetitions, setRepetitions] = useState(1);
  const [traceLinkage, setTraceLinkage] = useState(true);
  const [manifest, setManifest] = useState(DEFAULT_MANIFEST);
  const [error, setError] = useState<string | null>(null);

  const manifestState = useMemo(() => parseManifest(manifest), [manifest]);

  const reset = () => {
    setName('');
    setDescription('');
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !targetId) {
      setError('Please provide an experiment name and target.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Experiment name must be at least 2 characters.');
      return;
    }
    if (!manifestState.value) {
      setError('Ground-truth manifest must be valid JSON.');
      return;
    }
    try {
      await createExperiment.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        dataset_name: datasetName.trim() || 'promptfence-ground-truth-v1',
        dataset_version: datasetVersion.trim() || undefined,
        target_id: targetId,
        repetitions,
        trace_linkage_enabled: traceLinkage,
        ground_truth_manifest: manifestState.value,
      });
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to launch research experiment');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-4 w-4 text-primary" /> New research experiment
            </DialogTitle>
            <DialogDescription>
              Registers a draft experiment against a ground-truth manifest. Running it executes the target and computes
              the six provenance research metrics.
            </DialogDescription>
          </DialogHeader>

          <FormField label="Experiment name" id="exp-name" required>
            <Input
              id="exp-name"
              placeholder="e.g. canary-provenance-accuracy-run-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
            />
          </FormField>

          <FormField label="Research objective" id="exp-description" helperText="Hypothesis or question this experiment answers.">
            <Textarea
              id="exp-description"
              rows={2}
              placeholder="Does dynamic canary tainting attribute indirect injection leaks to the correct source?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Target" id="exp-target" required>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger id="exp-target" aria-label="Target">
                  <SelectValue placeholder={targets.length ? 'Select target…' : 'No targets registered'} />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {getTargetTypeLabel(t.target_type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Repetitions" id="exp-reps" helperText="1–5 executions per case.">
              <Input
                id="exp-reps"
                type="number"
                min={1}
                max={5}
                value={repetitions}
                onChange={(e) => setRepetitions(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
              />
            </FormField>
            <FormField label="Dataset name" id="exp-dataset">
              <Input
                id="exp-dataset"
                className="font-mono text-xs"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                maxLength={100}
              />
            </FormField>
            <FormField label="Dataset version" id="exp-dataset-version">
              <Input
                id="exp-dataset-version"
                className="font-mono text-xs"
                value={datasetVersion}
                onChange={(e) => setDatasetVersion(e.target.value)}
                maxLength={50}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface/40 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">Trace linkage</p>
              <p className="text-[11px] text-muted-foreground">Correlate canary observations with target-side traces.</p>
            </div>
            <Switch checked={traceLinkage} onCheckedChange={setTraceLinkage} aria-label="Trace linkage" />
          </div>

          <FormField
            label="Ground-truth manifest (JSON)"
            id="exp-manifest"
            required
            error={manifestState.error ?? undefined}
            helperText="Expected leakages, untrusted sources and benign control IDs."
          >
            <Textarea
              id="exp-manifest"
              rows={9}
              value={manifest}
              onChange={(e) => setManifest(e.target.value)}
              spellCheck={false}
              aria-invalid={!!manifestState.error}
              className={cn('font-mono text-[11px] leading-relaxed')}
            />
          </FormField>

          {error && (
            <p role="alert" className="rounded-md border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createExperiment.isPending}>
              {createExperiment.isPending ? 'Registering…' : 'Register experiment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
