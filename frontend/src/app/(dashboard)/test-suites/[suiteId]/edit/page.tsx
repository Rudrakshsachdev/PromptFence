'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layers, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { PageSkeleton } from '@/components/shared/skeletons';
import { useTestSuite, useUpdateTestSuite } from '@/hooks/use-test-suites';
import { ApiError } from '@/lib/api-client';
import { SuiteForm, type SuiteFormValues } from '../../_components/suite-form';

export default function EditTestSuitePage() {
  const params = useParams();
  const suiteId = params.suiteId as string;
  const router = useRouter();

  const { data: suite, isLoading, error, refetch } = useTestSuite(suiteId);
  const updateMutation = useUpdateTestSuite(suiteId);

  const onSubmit = (values: SuiteFormValues) => {
    // Success/error toasts are emitted by useUpdateTestSuite.
    updateMutation.mutate(values, {
      onSuccess: () => router.push(`/test-suites/${suiteId}`),
    });
  };

  if (isLoading) return <PageSkeleton />;

  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        icon={SearchX}
        title="Test suite not found"
        description="The suite does not exist or has been deleted."
        actionText="Back to test suites"
        actionHref="/test-suites"
      />
    );
  }
  if (error || !suite) {
    return <ErrorState title="Unable to load test suite" error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/test-suites/${suiteId}`}
        backLabel={suite.name}
        icon={Layers}
        title="Edit test suite"
        description="Update the suite name and scope. Scenario assignment and order are managed on the suite page."
      />
      <SuiteForm
        key={suite.id}
        mode="edit"
        defaultValues={{ name: suite.name, description: suite.description || '' }}
        isSubmitting={updateMutation.isPending}
        cancelHref={`/test-suites/${suiteId}`}
        onSubmit={onSubmit}
      />
    </div>
  );
}
