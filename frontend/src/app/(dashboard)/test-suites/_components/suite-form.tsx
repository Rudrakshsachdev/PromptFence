'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Loader2, Save } from 'lucide-react';
import { FormField } from '@/components/forms/form-field';
import { Panel } from '@/components/shared/panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const suiteSchema = z.object({
  name: z.string().min(1, 'Suite name is required').max(255),
  description: z.string().optional(),
});

export type SuiteFormValues = z.infer<typeof suiteSchema>;

/** Shared create/edit form. Submits `{ name, description }` exactly as before. */
export function SuiteForm({
  mode,
  defaultValues,
  isSubmitting,
  cancelHref,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  defaultValues?: SuiteFormValues;
  isSubmitting: boolean;
  cancelHref: string;
  onSubmit: (values: SuiteFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SuiteFormValues>({
    resolver: zodResolver(suiteSchema),
    defaultValues,
    mode: 'onTouched',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-3xl space-y-4">
      <Panel title="Suite details" icon={Layers}>
        <div className="space-y-4">
          <FormField
            label="Suite name"
            id="name"
            error={errors.name?.message}
            required
            helperText="e.g. OWASP LLM Top 10 core, System prompt protection"
          >
            <Input
              id="name"
              placeholder="OWASP LLM Top 10 core"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
          </FormField>
          <FormField
            label="Description"
            id="description"
            error={errors.description?.message}
            helperText="Scope and security boundaries this suite evaluates."
          >
            <Textarea
              id="description"
              placeholder="Indirect prompt injection, sensitive data disclosure and tool boundary bypasses."
              className="min-h-[96px]"
              {...register('description')}
            />
          </FormField>
        </div>
      </Panel>
      {mode === 'create' && (
        <p className="text-xs text-muted-foreground">
          After creating the suite you can assign and order scenarios from the scenario library.
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create suite' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
