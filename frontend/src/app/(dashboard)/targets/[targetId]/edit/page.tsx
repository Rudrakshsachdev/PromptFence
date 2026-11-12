'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { JsonEditor } from '@/components/forms/json-editor';
import { KeyValueEditor } from '@/components/forms/key-value-editor';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useTarget, useUpdateTarget } from '@/hooks/use-targets';
import { AuthenticationType, TargetType } from '@/types/target';

const targetEditSchema = z.object({
  name: z.string().min(1, 'Target name is required').max(255),
  description: z.string().optional(),
  target_type: z.enum(['CHAT_API', 'COMPLETION_API', 'AGENT_API', 'CUSTOM']),
  base_url: z.string().url('Must be a valid HTTP/HTTPS URL'),
  endpoint: z.string().min(1, 'Endpoint path is required'),
  http_method: z.string().default('POST'),
  authentication_type: z.enum(['NONE', 'BEARER', 'API_KEY', 'BASIC']).default('NONE'),
  timeout_seconds: z.coerce.number().min(1).max(300).default(30),
});

type TargetEditValues = z.infer<typeof targetEditSchema>;

export default function EditTargetPage() {
  const params = useParams();
  const targetId = params.targetId as string;
  const router = useRouter();

  const { data: target, isLoading } = useTarget(targetId);
  const updateMutation = useUpdateTarget(targetId);

  const [headersConfig, setHeadersConfig] = useState<Record<string, string>>({});
  const [requestTemplate, setRequestTemplate] = useState<Record<string, unknown> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<TargetEditValues>({
    resolver: zodResolver(targetEditSchema),
  });

  useEffect(() => {
    if (target) {
      reset({
        name: target.name,
        description: target.description || '',
        target_type: target.target_type,
        base_url: target.base_url,
        endpoint: target.endpoint,
        http_method: target.http_method,
        authentication_type: target.authentication_type,
        timeout_seconds: target.timeout_seconds,
      });
      setHeadersConfig(target.headers_config || {});
      setRequestTemplate(target.request_template || null);
    }
  }, [target, reset]);

  const targetType = watch('target_type');
  const authType = watch('authentication_type');
  const httpMethod = watch('http_method');

  const onSubmit = (values: TargetEditValues) => {
    updateMutation.mutate(
      {
        ...values,
        headers_config: Object.keys(headersConfig).length > 0 ? headersConfig : undefined,
        request_template: requestTemplate || undefined,
      },
      {
        onSuccess: () => {
          router.push(`/targets/${targetId}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={`Edit Target: ${target?.name}`}
        description="Updating configuration automatically generates a new version snapshot in the audit log."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Target Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Target Name" id="name" error={errors.name?.message} required>
              <Input id="name" {...register('name')} />
            </FormField>

            <FormField label="Description" id="description" error={errors.description?.message}>
              <Textarea id="description" {...register('description')} />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Architecture Type" id="target_type" error={errors.target_type?.message} required>
                <Select
                  value={targetType}
                  onValueChange={(val) => setValue('target_type', val as TargetType)}
                >
                  <SelectTrigger id="target_type">
                    <SelectValue placeholder="Architecture" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHAT_API">Chat API</SelectItem>
                    <SelectItem value="COMPLETION_API">Completion API</SelectItem>
                    <SelectItem value="AGENT_API">Agent API</SelectItem>
                    <SelectItem value="CUSTOM">Custom Integration</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Timeout (Seconds)" id="timeout_seconds" error={errors.timeout_seconds?.message}>
                <Input id="timeout_seconds" type="number" min={1} max={300} {...register('timeout_seconds')} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Routing & Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField label="Base URL" id="base_url" error={errors.base_url?.message} required>
                  <Input id="base_url" {...register('base_url')} />
                </FormField>
              </div>
              <div>
                <FormField label="HTTP Method" id="http_method" error={errors.http_method?.message} required>
                  <Select value={httpMethod} onValueChange={(val) => setValue('http_method', val)}>
                    <SelectTrigger id="http_method">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            <FormField label="Endpoint Path" id="endpoint" error={errors.endpoint?.message} required>
              <Input id="endpoint" {...register('endpoint')} />
            </FormField>

            <FormField label="Authentication Mode" id="authentication_type">
              <Select
                value={authType}
                onValueChange={(val) => setValue('authentication_type', val as AuthenticationType)}
              >
                <SelectTrigger id="authentication_type">
                  <SelectValue placeholder="Auth Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None / Open</SelectItem>
                  <SelectItem value="BEARER">Bearer Token</SelectItem>
                  <SelectItem value="API_KEY">API Key Header</SelectItem>
                  <SelectItem value="BASIC">HTTP Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 dark:text-slate-300">
                Custom Headers
              </p>
              <KeyValueEditor value={headersConfig} onChange={setHeadersConfig} />
            </div>

            <div className="pt-2">
              <FormField label="Payload Template" id="request_template">
                <JsonEditor value={requestTemplate} onChange={setRequestTemplate} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/targets/${targetId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving Changes...' : 'Save & Increment Version'}
          </Button>
        </div>
      </form>
    </div>
  );
}

