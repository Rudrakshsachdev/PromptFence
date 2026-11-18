'use client';

import { RequirePermission } from '@/components/shared/require-permission';
import { PERMISSIONS } from '@/constants/permissions';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Crosshair, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { IdChip } from '@/components/shared/id-chip';
import { PageSkeleton } from '@/components/shared/skeletons';
import { useTarget, useUpdateTarget } from '@/hooks/use-targets';
import { ApiError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { TargetForm, type TargetFormPayload } from '../../_components/target-form';

function EditTargetPageContent() {
  const params = useParams();
  const targetId = params.targetId as string;
  const router = useRouter();

  const { data: target, isLoading, error, refetch } = useTarget(targetId);
  const updateMutation = useUpdateTarget(targetId);

  const handleSubmit = (payload: TargetFormPayload) => {
    // Success/error toasts are emitted by useUpdateTarget.
    updateMutation.mutate(payload, {
      onSuccess: () => router.push(`/targets/${targetId}`),
    });
  };

  if (isLoading) return <PageSkeleton />;

  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        icon={SearchX}
        title="Target not found"
        description="The target does not exist or has been deleted."
        actionText="Back to targets"
        actionHref="/targets"
      />
    );
  }

  if (error || !target) {
    return <ErrorState title="Unable to load target" error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/targets/${targetId}`}
        backLabel={target.name}
        icon={Crosshair}
        title="Edit target"
        description="Changes create a new immutable configuration version. Previous test runs keep their original snapshot."
        meta={
          <>
            <HeaderMeta label="ID">
              <IdChip value={target.id} />
            </HeaderMeta>
            <HeaderMeta label="Last modified">{formatDate(target.updated_at)}</HeaderMeta>
          </>
        }
      />
      {/* Mounted only after load so editors initialise with the stored headers/template. */}
      <TargetForm
        key={target.id}
        mode="edit"
        defaultValues={{
          name: target.name,
          description: target.description || '',
          target_type: target.target_type,
          base_url: target.base_url,
          endpoint: target.endpoint,
          http_method: target.http_method,
          authentication_type: target.authentication_type,
          timeout_seconds: target.timeout_seconds,
          expected_response_format: target.expected_response_format || '',
        }}
        initialHeaders={target.headers_config}
        initialTemplate={target.request_template}
        isSubmitting={updateMutation.isPending}
        cancelHref={`/targets/${targetId}`}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function EditTargetPage() {
  return (
    <RequirePermission permission={PERMISSIONS.targetsWrite} backHref="/targets" backLabel="Back to targets">
      <EditTargetPageContent />
    </RequirePermission>
  );
}
