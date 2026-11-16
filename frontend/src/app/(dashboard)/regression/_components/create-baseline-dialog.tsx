'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateBaseline } from '@/hooks/use-regression';
import { useTestRuns } from '@/hooks/use-test-runs';
import { formatTimestamp, shortId } from '@/lib/format';

const schema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(120, 'Name is too long'),
  description: z.string().trim().max(500, 'Description is too long').optional(),
  source_run_id: z.string().min(1, 'Select a completed test run'),
});
type FormValues = z.infer<typeof schema>;

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background/60 px-3 text-[13px] text-foreground transition-colors hover:border-border-strong focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 aria-[invalid=true]:border-critical/60';

export function CreateBaselineDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createBaseline = useCreateBaseline();
  const completedRuns = useTestRuns({ status: 'COMPLETED', page: 1, page_size: 100 });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', source_run_id: '' },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createBaseline.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        source_run_id: values.source_run_id,
      });
      onOpenChange(false);
    } catch {
      // Error toast is raised by the mutation hook; keep the dialog open for correction.
    }
  });

  const runs = completedRuns.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create security baseline</DialogTitle>
          <DialogDescription>
            Snapshots the executed cases and detected findings of a completed run into an immutable
            reference. Future regression runs are compared against it by finding fingerprint.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Baseline name" id="baseline-name" required error={errors.name?.message}>
            <Input
              id="baseline-name"
              placeholder="release-2.1-pre-deploy"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
          </FormField>
          <FormField label="Description" id="baseline-description" error={errors.description?.message}>
            <Textarea
              id="baseline-description"
              rows={2}
              placeholder="What this baseline represents"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
          </FormField>
          <FormField
            label="Source run"
            id="baseline-run"
            required
            error={errors.source_run_id?.message}
            description={
              completedRuns.isLoading
                ? 'Loading completed runs…'
                : completedRuns.isError
                  ? 'Could not load completed runs.'
                  : runs.length === 0
                    ? 'No completed runs available. Complete a test run first.'
                    : `${runs.length} most recent completed runs`
            }
          >
            <select
              id="baseline-run"
              className={selectClass}
              aria-invalid={!!errors.source_run_id}
              disabled={completedRuns.isLoading || runs.length === 0}
              {...register('source_run_id')}
            >
              <option value="">Select a completed run…</option>
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {shortId(r.id)} · {r.target?.name ?? r.execution_snapshot?.target?.name ?? 'Target'} ·{' '}
                  {r.test_suite?.name ?? r.execution_snapshot?.test_suite?.name ?? 'Suite'} ·{' '}
                  {formatTimestamp(r.completed_at ?? r.created_at)}
                </option>
              ))}
            </select>
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createBaseline.isPending}>
              {createBaseline.isPending ? 'Creating…' : 'Create baseline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
