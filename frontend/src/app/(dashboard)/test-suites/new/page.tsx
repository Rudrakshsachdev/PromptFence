'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, FolderKanban, Plus } from 'lucide-react';
import { FormField } from '@/components/forms/form-field';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTestSuite } from '@/hooks/use-test-suites';
import { toast } from 'sonner';

const suiteSchema = z.object({
  name: z.string().min(1, 'Suite name is required').max(255),
  description: z.string().optional(),
});

type SuiteFormValues = z.infer<typeof suiteSchema>;

export default function NewTestSuitePage() {
  const router = useRouter();
  const createMutation = useCreateTestSuite();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SuiteFormValues>({
    resolver: zodResolver(suiteSchema),
  });

  const onSubmit = (values: SuiteFormValues) => {
    createMutation.mutate(values, {
      onSuccess: (newSuite) => {
        toast.success('Test suite created. You can now assign scenarios.');
        router.push(`/test-suites/${newSuite.id}`);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to create test suite');
      },
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href="/test-suites">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Test Suites
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Create Test Suite"
        description="Define an evaluation test suite to group and sequence attack scenarios against AI targets."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-teal-600" />
              <span>Suite Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <FormField
              label="Suite Name"
              id="name"
              error={errors.name?.message}
              required
              helperText="E.g., OWASP LLM Top 10 Core Regression, System Prompt Protection Suite"
            >
              <Input
                id="name"
                placeholder="OWASP Top 10 Adversarial Suite"
                {...register('name')}
                className="h-9 text-xs"
              />
            </FormField>

            <FormField
              label="Description"
              id="description"
              error={errors.description?.message}
              helperText="Explain the scope and security boundaries evaluated by this suite."
            >
              <Textarea
                id="description"
                placeholder="Comprehensive regression suite evaluating indirect prompt injection, sensitive data disclosure, and tool boundary bypasses."
                {...register('description')}
                className="text-xs min-h-[90px]"
              />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href="/test-suites">Cancel</Link>
          </Button>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            size="sm"
            className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {createMutation.isPending ? 'Creating Suite...' : 'Create & Assemble Suite'}
          </Button>
        </div>
      </form>
    </div>
  );
}
