'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  History,
  Lock,
  Save,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { FormField } from '@/components/forms/form-field';
import { JsonEditor } from '@/components/forms/json-editor';
import { KeyValueEditor } from '@/components/forms/key-value-editor';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

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
    watch,
    reset,
    formState: { errors },
  } = useForm<TargetEditValues>({
    resolver: zodResolver(targetEditSchema),
  });

  const formValues = watch();

  useEffect(() => {
    if (target) {
      reset({
        name: target.name,
        description: target.description || '',
        target_type: target.target_type as any,
        base_url: target.base_url,
        endpoint: target.endpoint,
        http_method: target.http_method,
        authentication_type: target.authentication_type as any,
        timeout_seconds: target.timeout_seconds,
      });
      setHeadersConfig(target.headers_config || {});
      setRequestTemplate(target.request_template || null);
    }
  }, [target, reset]);

  const onSubmit = (values: TargetEditValues) => {
    updateMutation.mutate(
      {
        ...values,
        headers_config: Object.keys(headersConfig).length > 0 ? headersConfig : undefined,
        request_template: requestTemplate || undefined,
      },
      {
        onSuccess: (updated) => {
          toast.success('Target configuration updated and new version snapshot created');
          router.push(`/targets/${targetId}`);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to update target configuration');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href={`/targets/${targetId}`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Target Details
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Edit Target: ${target?.name}`}
        description="Update endpoint connectivity, custom headers, or request body. Changes create a new immutable version snapshot."
        badge={
          <Badge variant="outline" className="text-[10px] font-mono bg-teal-50 text-teal-700 border-teal-200">
            Immutable Versioning Active
          </Badge>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: General Info */}
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-teal-600" />
              <span>Target Identity & Architecture</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <FormField label="Target Name" id="name" error={errors.name?.message} required>
              <Input id="name" {...register('name')} className="h-9 text-xs" />
            </FormField>

            <FormField label="Description" id="description" error={errors.description?.message}>
              <Textarea id="description" {...register('description')} className="text-xs min-h-[70px]" />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Architecture Type
                </label>
                <Select
                  value={formValues.target_type}
                  onValueChange={(val) => setValue('target_type', val as any)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Architecture" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHAT_API">Chat API</SelectItem>
                    <SelectItem value="COMPLETION_API">Completion API</SelectItem>
                    <SelectItem value="AGENT_API">AI Agent Endpoint</SelectItem>
                    <SelectItem value="CUSTOM">Custom API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Authentication Type
                </label>
                <Select
                  value={formValues.authentication_type}
                  onValueChange={(val) => setValue('authentication_type', val as any)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Auth Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="BEARER">Bearer Token</SelectItem>
                    <SelectItem value="API_KEY">API Key Header</SelectItem>
                    <SelectItem value="BASIC">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Connection Parameters */}
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-teal-600" />
              <span>Connection Parameters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField label="Base URL" id="base_url" error={errors.base_url?.message} required>
                  <Input id="base_url" {...register('base_url')} className="h-9 text-xs font-mono" />
                </FormField>
              </div>
              <div>
                <FormField label="Endpoint Path" id="endpoint" error={errors.endpoint?.message} required>
                  <Input id="endpoint" {...register('endpoint')} className="h-9 text-xs font-mono" />
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  HTTP Method
                </label>
                <Select
                  value={formValues.http_method}
                  onValueChange={(val) => setValue('http_method', val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FormField
                label="Timeout (Seconds)"
                id="timeout_seconds"
                error={errors.timeout_seconds?.message}
                required
              >
                <Input
                  id="timeout_seconds"
                  type="number"
                  min={1}
                  max={300}
                  {...register('timeout_seconds')}
                  className="h-9 text-xs font-mono"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Headers & Payload */}
        <Card className="border border-slate-200/80 bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-teal-600" />
              <span>Headers & Payload Schema</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Configured HTTP Headers
              </label>
              <KeyValueEditor
                value={headersConfig}
                onChange={setHeadersConfig}
                keyPlaceholder="Header Name"
                valuePlaceholder="Header Value"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Request Body Template</label>
                <span className="text-[10px] text-teal-700 font-mono">Placeholders: {'{{prompt}}'}</span>
              </div>
              <JsonEditor value={requestTemplate} onChange={setRequestTemplate} height="150px" />
            </div>
          </CardContent>
        </Card>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href={`/targets/${targetId}`}>Cancel</Link>
          </Button>

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            size="sm"
            className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {updateMutation.isPending ? 'Updating...' : 'Save Changes as New Version'}
          </Button>
        </div>
      </form>
    </div>
  );
}
