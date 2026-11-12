'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, ShieldAlert } from 'lucide-react';
import { PageActions, PageHeader } from '@/components/layout/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useScenario } from '@/hooks/use-scenarios';
import { formatDate } from '@/lib/utils';

export default function ScenarioDetailPage() {
  const params = useParams();
  const scenarioId = params.scenarioId as string;

  const { data: scenario, isLoading } = useScenario(scenarioId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold">Scenario not found</h3>
        <Button asChild className="mt-4">
          <Link href="/scenarios">Back to Scenario Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-7 px-2">
          <Link href="/scenarios">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Scenario Library
          </Link>
        </Button>
      </div>

      <PageHeader
        title={scenario.name}
        description={scenario.description || 'Adversarial Test Scenario Definition'}
      >
        <PageActions>
          <Button asChild size="sm">
            <Link href={`/scenarios/${scenarioId}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Scenario
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Attack Payload Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {scenario.attack_input_template}
              </div>

              {scenario.expected_behavior && (
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
                    Expected Safe Behavior
                  </p>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border dark:bg-slate-900 dark:text-slate-300">
                    {scenario.expected_behavior}
                  </p>
                </div>
              )}

              {scenario.assertion_config && (
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2">
                    Configured Assertions
                  </p>
                  <pre className="p-3 rounded bg-slate-900 text-teal-300 font-mono text-xs overflow-x-auto">
                    {JSON.stringify(scenario.assertion_config, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span>Category:</span>
                <CategoryBadge category={scenario.category} />
              </div>

              <div className="flex justify-between items-center">
                <span>Severity:</span>
                <SeverityBadge severity={scenario.severity} />
              </div>

              <div className="flex justify-between items-center">
                <span>Status:</span>
                <StatusBadge
                  isActive={scenario.is_enabled}
                  activeText="Enabled"
                  inactiveText="Disabled"
                />
              </div>

              <Separator />

              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatDate(scenario.created_at)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatDate(scenario.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

