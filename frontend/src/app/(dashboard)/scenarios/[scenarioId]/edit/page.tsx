'use client';

import { RequirePermission } from '@/components/shared/require-permission';
import { PERMISSIONS } from '@/constants/permissions';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LibraryBig, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { PageSkeleton } from '@/components/shared/skeletons';
import { useScenario, useUpdateScenario } from '@/hooks/use-scenarios';
import { ApiError } from '@/lib/api-client';
import { ScenarioForm } from '../../_components/scenario-form';

function EditScenarioPageContent() {
  const params = useParams();
  const scenarioId = params.scenarioId as string;
  const router = useRouter();

  const { data: scenario, isLoading, error, refetch } = useScenario(scenarioId);
  const updateMutation = useUpdateScenario(scenarioId);

  if (isLoading) return <PageSkeleton />;

  if (error && !(error instanceof ApiError && error.status === 404)) {
    return <ErrorState title="Unable to load scenario" error={error} onRetry={() => refetch()} />;
  }

  if (!scenario) {
    return (
      <EmptyState
        icon={SearchX}
        title="Scenario not found"
        description="The scenario does not exist or has been deleted."
        actionText="Back to scenario library"
        actionHref="/scenarios"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/scenarios/${scenarioId}`}
        backLabel={scenario.name}
        icon={LibraryBig}
        title="Edit scenario"
        description="Changes apply to future executions. Runs already executed keep the scenario snapshot they were run with."
      />
      {/* Keyed so the form (and its JSON editor) initialise from the loaded scenario. */}
      <ScenarioForm
        key={scenario.id}
        scenario={scenario}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save changes"
        cancelHref={`/scenarios/${scenarioId}`}
        onSubmit={(data) =>
          updateMutation.mutate(data, {
            // Success / error toasts are emitted by useUpdateScenario.
            onSuccess: () => router.push(`/scenarios/${scenarioId}`),
          })
        }
      />
    </div>
  );
}

export default function EditScenarioPage() {
  return (
    <RequirePermission permission={PERMISSIONS.scenariosWrite} backHref="/scenarios" backLabel="Back to scenarios">
      <EditScenarioPageContent />
    </RequirePermission>
  );
}
