'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTestSuite } from '@/hooks/use-test-suites';

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
        router.push(`/test-suites/${newSuite.id}`);
      },
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Create Test Suite"
        description="Define an evaluation suite to group and sequence attack scenarios."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Suite Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Suite Name" id="name" error={errors.name?.message} required>
              <Input
                id="name"
                placeholder="e.g. OWASP LLM Top 10 Core Regression"
                {...register('name')}
              />
            </FormField>

            <FormField label="Description" id="description" error={errors.description?.message}>
              <Textarea
                id="description"
                placeholder="Specify the scope and testing objectives for this evaluation suite..."
                {...register('description')}
              />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href="/test-suites">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating Suite...' : 'Create Test Suite'}
          </Button>
        </div>
      </form>
    </div>
  );
}

