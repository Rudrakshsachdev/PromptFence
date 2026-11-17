'use client';

import { RequirePermission } from '@/components/shared/require-permission';
import { PERMISSIONS } from '@/constants/permissions';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Crosshair } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { useCreateTarget } from '@/hooks/use-targets';
import { TargetForm, type TargetFormPayload } from '../_components/target-form';

function NewTargetPageContent() {
  const router = useRouter();
  const createMutation = useCreateTarget();

  const handleSubmit = (payload: TargetFormPayload) => {
    // Success/error toasts are emitted by useCreateTarget.
    createMutation.mutate(payload, {
      onSuccess: (newTarget) => router.push(`/targets/${newTarget.id}`),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/targets"
        backLabel="Targets"
        icon={Crosshair}
        title="Register target"
        description="Configure the endpoint, credentials and request schema PromptFence uses to send adversarial scenarios."
      />
      <TargetForm
        mode="create"
        defaultValues={{
          target_type: 'CHAT_API',
          http_method: 'POST',
          authentication_type: 'NONE',
          timeout_seconds: 30,
          endpoint: '/v1/chat/completions',
          expected_response_format: 'json',
        }}
        initialTemplate={{ messages: [{ role: 'user', content: '{{prompt}}' }] }}
        isSubmitting={createMutation.isPending}
        cancelHref="/targets"
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function NewTargetPage() {
  return (
    <RequirePermission permission={PERMISSIONS.targetsWrite} backHref="/targets" backLabel="Back to targets">
      <NewTargetPageContent />
    </RequirePermission>
  );
}
