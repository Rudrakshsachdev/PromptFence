'use client';

import { RequirePermission } from '@/components/shared/require-permission';
import { PERMISSIONS } from '@/constants/permissions';
import React from 'react';
import { useRouter } from 'next/navigation';
import { LibraryBig } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { useCreateScenario } from '@/hooks/use-scenarios';
import { ScenarioForm } from '../_components/scenario-form';

function NewScenarioPageContent() {
  const router = useRouter();
  const createMutation = useCreateScenario();

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/scenarios"
        backLabel="Scenario library"
        icon={LibraryBig}
        title="New attack scenario"
        description="Define an adversarial payload, the behaviour a secure target should exhibit, and how the result is asserted."
      />
      <ScenarioForm
        isSubmitting={createMutation.isPending}
        submitLabel="Create scenario"
        cancelHref="/scenarios"
        onSubmit={(data) =>
          createMutation.mutate(data, {
            // Success / error toasts are emitted by useCreateScenario.
            onSuccess: (created) => router.push(`/scenarios/${created.id}`),
          })
        }
      />
    </div>
  );
}

export default function NewScenarioPage() {
  return (
    <RequirePermission permission={PERMISSIONS.scenariosWrite} backHref="/scenarios" backLabel="Back to scenarios">
      <NewScenarioPageContent />
    </RequirePermission>
  );
}
