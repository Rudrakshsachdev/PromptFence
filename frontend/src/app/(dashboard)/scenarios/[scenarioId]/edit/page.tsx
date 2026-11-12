'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Code2,
  Save,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
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
import { toast } from 'sonner';

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

  const category = watch('category');
  const severity = watch('severity');

  useEffect(() => {
    if (scenario) {
      reset({
        name: scenario.name,
        description: scenario.description || '',
        category: scenario.category as ScenarioCategory,
        severity: scenario.severity as ScenarioSeverity,
        attack_input_template: scenario.attack_input_template,
        expected_behavior: scenario.expected_behavior || '',
      });
      setAssertionConfig(scenario.assertion_config || null);
    }
  }, [scenario, reset]);

  const onSubmit = (values: ScenarioEditValues) => {
    updateMutation.mutate(
      {
        ...values,
        assertion_config: assertionConfig || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Scenario updated successfully');
          router.push(`/scenarios/${scenarioId}`);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to update scenario');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href={`/scenarios/${scenarioId}`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Scenario
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Edit Scenario: ${scenario?.name}`}
        description="Update attack vector definitions, assertion rules, and safety parameters."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-teal-600" />
              <span>Classification & Objective</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <FormField label="Scenario Name" id="name" error={errors.name?.message} required>
              <Input id="name" {...register('name')} className="h-9 text-xs" />
            </FormField>

            <FormField label="Description" id="description" error={errors.description?.message}>
              <Textarea id="description" {...register('description')} className="text-xs min-h-[70px]" />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Attack Category
                </label>
                <Select
                  value={category}
                  onValueChange={(val) => setValue('category', val as ScenarioCategory)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
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
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Severity Rating
                </label>
                <Select
                  value={severity}
                  onValueChange={(val) => setValue('severity', val as ScenarioSeverity)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attack Input Template */}
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Terminal className="h-4 w-4 text-teal-600" />
              <span>Adversarial Prompt Payload Template</span>
            </CardTitle>
            <span className="text-[10px] font-mono text-slate-400">JetBrains Mono</span>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <FormField
              label="Attack Input Template"
              id="attack_input_template"
              error={errors.attack_input_template?.message}
              required
            >
              <Textarea
                id="attack_input_template"
                {...register('attack_input_template')}
                className="font-mono text-xs min-h-[130px] bg-slate-900 text-teal-300 border-slate-800 p-3 leading-relaxed"
              />
            </FormField>

            <FormField
              label="Expected Security Behavior (Safety Baseline)"
              id="expected_behavior"
            >
              <Textarea
                id="expected_behavior"
                {...register('expected_behavior')}
                className="text-xs min-h-[70px]"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Assertion Rules */}
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Code2 className="h-4 w-4 text-teal-600" />
              <span>Assertion Rules Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <JsonEditor value={assertionConfig} onChange={setAssertionConfig} height="130px" />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href={`/scenarios/${scenarioId}`}>Cancel</Link>
          </Button>

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            size="sm"
            className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
