'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { JsonEditor } from '@/components/forms/json-editor';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { SCENARIO_CATEGORIES, SCENARIO_SEVERITIES } from '@/constants/scenarios';
import { useScenario, useUpdateScenario } from '@/hooks/use-scenarios';
import { ScenarioCategory, ScenarioSeverity } from '@/types/scenario';

const scenarioEditSchema = z.object({
  name: z.string().min(1, 'Scenario name is required').max(255),
  description: z.string().optional(),
  category: z.enum([
    'PROMPT_INJECTION',
    'DATA_DISCLOSURE',
    'TOOL_EXECUTION',
    'INSTRUCTION_CONFLICT',
    'REGRESSION',
  ]),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  attack_input_template: z.string().min(1, 'Adversarial attack prompt template is required'),
  expected_behavior: z.string().optional(),
});

type ScenarioEditValues = z.infer<typeof scenarioEditSchema>;

export default function EditScenarioPage() {
  const params = useParams();
  const scenarioId = params.scenarioId as string;
  const router = useRouter();

  const { data: scenario, isLoading } = useScenario(scenarioId);
  const updateMutation = useUpdateScenario(scenarioId);

  const [assertionConfig, setAssertionConfig] = useState<Record<string, unknown> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<ScenarioEditValues>({
    resolver: zodResolver(scenarioEditSchema),
  });

  useEffect(() => {
    if (scenario) {
      reset({
        name: scenario.name,
        description: scenario.description || '',
        category: scenario.category,
        severity: scenario.severity,
        attack_input_template: scenario.attack_input_template,
        expected_behavior: scenario.expected_behavior || '',
      });
      setAssertionConfig(scenario.assertion_config || null);
    }
  }, [scenario, reset]);

  const categoryVal = watch('category');
  const severityVal = watch('severity');

  const onSubmit = (values: ScenarioEditValues) => {
    updateMutation.mutate(
      {
        ...values,
        assertion_config: assertionConfig || undefined,
      },
      {
        onSuccess: () => {
          router.push(`/scenarios/${scenarioId}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={`Edit Scenario: ${scenario?.name}`}
        description="Update prompt injection strings, classifications, and assertion rules."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Scenario Name" id="name" error={errors.name?.message} required>
              <Input id="name" {...register('name')} />
            </FormField>

            <FormField label="Description" id="description" error={errors.description?.message}>
              <Textarea id="description" {...register('description')} />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Category" id="category" error={errors.category?.message} required>
                <Select
                  value={categoryVal}
                  onValueChange={(val) => setValue('category', val as ScenarioCategory)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENARIO_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Severity" id="severity" error={errors.severity?.message} required>
                <Select
                  value={severityVal}
                  onValueChange={(val) => setValue('severity', val as ScenarioSeverity)}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENARIO_SEVERITIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Attack Payload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label="Attack Template"
              id="attack_input_template"
              error={errors.attack_input_template?.message}
              required
            >
              <Textarea
                id="attack_input_template"
                className="font-mono text-xs min-h-[120px]"
                {...register('attack_input_template')}
              />
            </FormField>

            <FormField label="Expected Behavior" id="expected_behavior">
              <Textarea id="expected_behavior" {...register('expected_behavior')} />
            </FormField>

            <div className="pt-2">
              <FormField label="Assertion Rules" id="assertion_rules">
                <JsonEditor value={assertionConfig} onChange={setAssertionConfig} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/scenarios/${scenarioId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

