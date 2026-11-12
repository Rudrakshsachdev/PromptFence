'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit,
  History,
  Play,
  Trash2,
} from 'lucide-react';
import { PageActions, PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useTarget,
  useTargetVersions,
  useValidateTarget,
} from '@/hooks/use-targets';
import { formatDate } from '@/lib/utils';

export default function TargetDetailPage() {
  const params = useParams();
  const targetId = params.targetId as string;

  const { data: target, isLoading } = useTarget(targetId);
  const { data: versions, isLoading: isVersionsLoading } = useTargetVersions(targetId);
  const validateMutation = useValidateTarget(targetId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!target) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold">Target not found</h3>
        <Button asChild className="mt-4">
          <Link href="/targets">Back to targets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-7 px-2">
          <Link href="/targets">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> All Targets
          </Link>
        </Button>
      </div>

      <PageHeader title={target.name} description={target.description || 'Target Application Configuration'}>
        <PageActions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {validateMutation.isPending ? 'Probing...' : 'Test Connectivity'}
          </Button>
          <Button asChild size="sm">
            <Link href={`/targets/${targetId}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Configuration
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Configuration Overview */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Endpoint Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Architecture</p>
                  <p className="text-sm font-medium mt-1">{target.target_type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                  <div className="mt-1">
                    <StatusBadge isActive={target.is_active} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Full Destination URL</p>
                <div className="mt-1.5 p-3 rounded bg-slate-900 text-teal-300 font-mono text-xs break-all">
                  <span className="text-amber-400 font-bold mr-2">{target.http_method}</span>
                  {target.base_url}
                  {target.endpoint}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Authentication</p>
                  <p className="text-sm font-medium mt-1">{target.authentication_type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Timeout Window</p>
                  <p className="text-sm font-medium mt-1">{target.timeout_seconds} seconds</p>
                </div>
              </div>

              {target.headers_config && Object.keys(target.headers_config).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Configured Headers</p>
                  <div className="rounded border bg-slate-50 p-3 font-mono text-xs space-y-1 dark:bg-slate-900">
                    {Object.entries(target.headers_config).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-600 font-medium">{k}:</span>
                        <span className="text-slate-900 dark:text-white">
                          {k.toLowerCase().includes('auth') || k.toLowerCase().includes('key')
                            ? '••••••••'
                            : v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {target.request_template && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Request Template</p>
                  <pre className="p-3 rounded bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(target.request_template, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Version History */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center">
                <History className="h-4 w-4 mr-2 text-teal-600" /> Version History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isVersionsLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : versions?.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground">No historical versions recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions?.map((ver) => (
                      <TableRow key={ver.id}>
                        <TableCell className="font-semibold text-xs">
                          <Badge variant="outline" className="text-xs font-mono">
                            v{ver.version_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDate(ver.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatDate(target.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatDate(target.updated_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Target ID:</span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                  {target.id}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

