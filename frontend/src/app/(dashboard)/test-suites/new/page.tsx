'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { useCreateTestSuite } from '@/hooks/use-test-suites';
import { SuiteForm, type SuiteFormValues } from '../_components/suite-form';

export default function NewTestSuitePage() {
  const router = useRouter();
  const createMutation = useCreateTestSuite();

  const onSubmit = (values: SuiteFormValues) => {
    // Success/error toasts are emitted by useCreateTestSuite.
    createMutation.mutate(values, {
      onSuccess: (newSuite) => router.push(`/test-suites/${newSuite.id}`),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/test-suites"
        backLabel="Test suites"
        icon={Layers}
        title="Create test suite"
        description="Group and sequence attack scenarios into a reusable evaluation you can run against any target."
      />
      <SuiteForm
        mode="create"
        isSubmitting={createMutation.isPending}
        cancelHref="/test-suites"
        onSubmit={onSubmit}
      />
    </div>
  );
}
