'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useTestSuite, useUpdateTestSuite } from '@/hooks/use-test-suites';

const suiteSchema = z.object({
  name: z.string().min(1, 'Suite name is required').max(255),
  description: z.string().optional(),
});

type SuiteFormValues = z.infer<typeof suiteSchema>;

export default function EditTestSuitePage() {
  const params = useParams();
  const suiteId = params.suiteId as string;
  const router = useRouter();

  const { data: suite, isLoading } = useTestSuite(suiteId);
  const updateMutation = useUpdateTestSuite(suiteId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuiteFormValues>({
    resolver: zodResolver(suiteSchema),
  });

  useEffect(() => {
    if (suite) {
      reset({
        name: suite.name,
        description: suite.description || '',
      });
    }
  }, [suite, reset]);

  const onSubmit = (values: SuiteFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        router.push(`/test-suites/${suiteId}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={`Edit Suite: ${suite?.name}`}
        description="Update metadata and documentation for this test suite."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Suite Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Suite Name" id="name" error={errors.name?.message} required>
              <Input id="name" {...register('name')} />
            </FormField>

            <FormField label="Description" id="description" error={errors.description?.message}>
              <Textarea id="description" {...register('description')} />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/test-suites/${suiteId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

