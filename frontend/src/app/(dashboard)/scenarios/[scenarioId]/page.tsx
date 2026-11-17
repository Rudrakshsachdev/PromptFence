'use client';

import { usePermissions } from '@/hooks/use-auth';
import { PERMISSIONS } from '@/constants/permissions';
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Code2, Crosshair, Info, LibraryBig, Pencil, SearchX, ShieldCheck, Terminal, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { HeaderMeta, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { CodeViewer } from '@/components/shared/code-viewer';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DetailList } from '@/components/shared/detail-list';
import { ErrorState } from '@/components/shared/error-state';
import { IdChip } from '@/components/shared/id-chip';
import { Panel } from '@/components/shared/panel';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { PageSkeleton } from '@/components/shared/skeletons';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SCENARIO_CATEGORIES } from '@/constants/scenarios';
import { useDeleteScenario, useScenario, useUpdateScenarioStatus } from '@/hooks/use-scenarios';
import { ApiError } from '@/lib/api-client';
import { formatTimestamp } from '@/lib/format';
import { getSeverityMeta, getTargetTypeLabel } from '@/lib/status';
import { formatRelativeTime } from '@/lib/utils';

const TEMPLATE_VARIABLES = ['{canary}', '{canary_token}', '{canary_preview}', '{source_id}'];

export default function ScenarioDetailPage() {
  const { can } = usePermissions();
  const params = useParams();
  const scenarioId = params.scenarioId as string;
  const router = useRouter();

  const { data: scenario, isLoading, error, refetch } = useScenario(scenarioId);
  const deleteMutation = useDeleteScenario();
  const statusMutation = useUpdateScenarioStatus(scenarioId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;

  if (error && !(error instanceof ApiError && error.status === 404)) {
    return <ErrorState title="Unable to load scenario" error={error} onRetry={() => refetch()} />;
  }

  if (!scenario) {
    return (
      <EmptyState
        icon={SearchX}
        title="Scenario not found"
        description="The requested scenario does not exist or has been deleted."
        actionText="Back to scenario library"
        actionHref="/scenarios"
      />
    );
  }

  const categoryInfo = SCENARIO_CATEGORIES.find((c) => c.value === scenario.category);
  const targets = scenario.applicable_target_types ?? [];
  const usedVariables = TEMPLATE_VARIABLES.filter((v) => scenario.attack_input_template.includes(v));

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/scenarios"
        backLabel="Scenario library"
        icon={LibraryBig}
        title={scenario.name}
        description={scenario.description || undefined}
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={scenario.category} />
            <SeverityBadge severity={scenario.severity} />
            <StatusBadge isActive={scenario.is_enabled} activeText="Enabled" inactiveText="Disabled" />
          </div>
        }
        meta={
          <>
            <HeaderMeta label="ID">
              <IdChip value={scenario.id} />
            </HeaderMeta>
            <HeaderMeta label="Updated">{formatRelativeTime(scenario.updated_at)}</HeaderMeta>
          </>
        }
      >
        <label className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground">
          <Switch
            checked={scenario.is_enabled}
            disabled={statusMutation.isPending || !can(PERMISSIONS.scenariosWrite)}
            onCheckedChange={(checked) => statusMutation.mutate(checked)}
            aria-label={scenario.is_enabled ? 'Disable scenario' : 'Enable scenario'}
          />
          {scenario.is_enabled ? 'Enabled' : 'Disabled'}
        </label>
        {can(PERMISSIONS.scenariosWrite) && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/scenarios/${scenarioId}/edit`}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          </Button>
        )}
        {can(PERMISSIONS.scenariosDelete) && (
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Attack technique" description="Input template dispatched to the target" icon={Terminal}>
            <CodeViewer
              title="attack_input_template"
              value={scenario.attack_input_template}
              language="text"
              maxHeight={420}
            />
            {usedVariables.length > 0 && (
              <p className="mt-2.5 text-[11px] text-muted-foreground">
                Substituted at execution time:{' '}
                {usedVariables.map((v) => (
                  <code key={v} className="mr-1 rounded border border-info/30 bg-info/10 px-1 py-px font-mono text-info">
                    {v}
                  </code>
                ))}
              </p>
            )}
          </Panel>

          <Panel title="Expected security behaviour" icon={ShieldCheck}>
            {scenario.expected_behavior ? (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                {scenario.expected_behavior}
              </p>
            ) : (
              <p className="text-xs italic text-subtle-foreground">No expected behaviour specified.</p>
            )}
          </Panel>

          <Panel title="Assertion configuration" icon={Code2}>
            <CodeViewer
              value={scenario.assertion_config ?? null}
              language="json"
              emptyText="No custom assertion rules defined. Default assertions for the category apply."
              title="assertion_config"
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Details" icon={Info}>
            <DetailList
              columns={1}
              items={[
                { label: 'Category', value: categoryInfo?.label ?? scenario.category, hint: categoryInfo?.description },
                { label: 'Severity', value: getSeverityMeta(scenario.severity).label },
                { label: 'Created', value: formatTimestamp(scenario.created_at), mono: true },
                { label: 'Last modified', value: formatTimestamp(scenario.updated_at), mono: true },
                { label: 'Owner', value: <IdChip value={scenario.owner_id} /> },
              ]}
            />
            {categoryInfo && (
              <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                {categoryInfo.description}
              </p>
            )}
          </Panel>

          <Panel title="Target coverage" icon={Crosshair}>
            {targets.length === 0 ? (
              <p className="text-xs text-muted-foreground">Applicable to all target types.</p>
            ) : (
              <ul className="space-y-1.5">
                {targets.map((t) => (
                  <li key={t} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground">{getTargetTypeLabel(t)}</span>
                    <span className="font-mono text-[11px] text-subtle-foreground">{t}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete scenario?"
        description={`"${scenario.name}" will be permanently deleted and removed from every test suite that includes it. Completed runs keep their snapshot.`}
        confirmText="Delete scenario"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(scenarioId, {
            onSuccess: () => router.push('/scenarios'),
          })
        }
      />
    </div>
  );
}
