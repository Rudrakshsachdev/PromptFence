'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, FolderKanban, Save } from 'lucide-react';
import { FormField } from '@/components/forms/form-field';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useTestSuite, useUpdateTestSuite } from '@/hooks/use-test-suites';
import { toast } from 'sonner';

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
        toast.success('Test suite updated successfully');
        router.push(`/test-suites/${suiteId}`);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to update test suite');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href={`/test-suites/${suiteId}`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Suite Details
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Edit Suite: ${suite?.name}`}
        description="Update test suite metadata, scope, and objectives."
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
            <FormField label="Suite Name" id="name" error={errors.name?.message} required>
              <Input id="name" {...register('name')} className="h-9 text-xs" />
            </FormField>

            <FormField label="Description" id="description" error={errors.description?.message}>
              <Textarea id="description" {...register('description')} className="text-xs min-h-[90px]" />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href={`/test-suites/${suiteId}`}>Cancel</Link>
          </Button>

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            size="sm"
            className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {updateMutation.isPending ? 'Saving Changes...' : 'Save Suite'}
          </Button>
        </div>
      </form>
    </div>
  );
}
