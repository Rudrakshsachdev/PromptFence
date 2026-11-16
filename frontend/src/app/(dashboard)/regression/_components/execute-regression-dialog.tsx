'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useExecuteRegression } from '@/hooks/use-regression';
import type { SecurityBaseline } from '@/types/regression';

// Bounds mirror the backend RegressionLaunchRequest schema.
const schema = z.object({
  baseline_id: z.string().min(1, 'Select a baseline'),
  target_version: z.string().trim().max(50, 'Maximum 50 characters').optional(),
  concurrency: z.coerce.number().int('Whole number').min(1, 'Minimum 1').max(10, 'Maximum 10'),
  timeout_seconds: z.coerce.number().int('Whole number').min(5, 'Minimum 5s').max(300, 'Maximum 300s'),
});
type FormValues = z.infer<typeof schema>;

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background/60 px-3 text-[13px] text-foreground transition-colors hover:border-border-strong focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 aria-[invalid=true]:border-critical/60';

export function ExecuteRegressionDialog({
  open,
  onOpenChange,
  baselines,
  defaultBaselineId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baselines: SecurityBaseline[];
  defaultBaselineId?: string;
}) {
  const router = useRouter();
  const executeRegression = useExecuteRegression();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { baseline_id: '', target_version: '', concurrency: 2, timeout_seconds: 30 },
  });

  useEffect(() => {
    if (open) {
      reset({ baseline_id: defaultBaselineId ?? '', target_version: '', concurrency: 2, timeout_seconds: 30 });
    }
  }, [open, defaultBaselineId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const comparison = await executeRegression.mutateAsync({
        baseline_id: values.baseline_id,
        target_version: values.target_version || undefined,
        concurrency: values.concurrency,
        timeout_seconds: values.timeout_seconds,
      });
      onOpenChange(false);
      if (comparison?.id) router.push(`/regression/${comparison.id}`);
    } catch {
      // Error toast is raised by the mutation hook; keep the dialog open.
    }
  });

  const pending = executeRegression.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Run regression test</DialogTitle>
          <DialogDescription>
            Re-executes the baseline&apos;s scenario snapshot against the current target and classifies every
            finding as new, resolved, recurring or inconclusive. The request completes when the run finishes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Baseline" id="reg-baseline" required error={errors.baseline_id?.message}>
            <select
              id="reg-baseline"
              className={selectClass}
              aria-invalid={!!errors.baseline_id}
              disabled={baselines.length === 0}
              {...register('baseline_id')}
            >
              <option value="">{baselines.length ? 'Select a baseline…' : 'No baselines available'}</option>
              {baselines.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {b.target_version}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Target version under test"
            id="reg-version"
            error={errors.target_version?.message}
            description="Optional label for the build being tested. The server applies its default when empty."
          >
            <Input
              id="reg-version"
              className="font-mono"
              placeholder="v2.2.0-rc1"
              aria-invalid={!!errors.target_version}
              {...register('target_version')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Concurrency" id="reg-concurrency" error={errors.concurrency?.message} description="1–10 parallel cases">
              <Input
                id="reg-concurrency"
                type="number"
                min={1}
                max={10}
                className="font-mono"
                aria-invalid={!!errors.concurrency}
                {...register('concurrency')}
              />
            </FormField>
            <FormField label="Timeout (s)" id="reg-timeout" error={errors.timeout_seconds?.message} description="Per case, 5–300">
              <Input
                id="reg-timeout"
                type="number"
                min={5}
                max={300}
                className="font-mono"
                aria-invalid={!!errors.timeout_seconds}
                {...register('timeout_seconds')}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || baselines.length === 0}>
              {pending ? 'Running regression…' : 'Run regression'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
