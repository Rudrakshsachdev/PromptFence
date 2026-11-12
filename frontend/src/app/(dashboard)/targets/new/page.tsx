'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateTarget } from '@/hooks/use-targets';
import { AuthenticationType, TargetType } from '@/types/target';

const targetFormSchema = z.object({
  name: z.string().min(1, 'Target name is required').max(255),
  description: z.string().optional(),
  target_type: z.enum(['CHAT_API', 'COMPLETION_API', 'AGENT_API', 'CUSTOM']),
  base_url: z.string().url('Must be a valid HTTP/HTTPS URL'),
  endpoint: z.string().min(1, 'Endpoint path is required'),
  http_method: z.string().default('POST'),
  authentication_type: z.enum(['NONE', 'BEARER', 'API_KEY', 'BASIC']).default('NONE'),
  timeout_seconds: z.coerce.number().min(1).max(300).default(30),
  expected_response_format: z.string().optional(),
});

type TargetFormValues = z.infer<typeof targetFormSchema>;

export default function NewTargetPage() {
  const router = useRouter();
  const createMutation = useCreateTarget();

  const [headersConfig, setHeadersConfig] = useState<Record<string, string>>({});
  const [requestTemplate, setRequestTemplate] = useState<Record<string, unknown> | null>({
    messages: [{ role: 'user', content: '{{prompt}}' }],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      target_type: 'CHAT_API',
      http_method: 'POST',
      authentication_type: 'NONE',
      timeout_seconds: 30,
      endpoint: '/v1/chat/completions',
    },
  });

  const targetType = watch('target_type');
  const authType = watch('authentication_type');
  const httpMethod = watch('http_method');

  const onSubmit = (values: TargetFormValues) => {
    createMutation.mutate(
      {
        ...values,
        headers_config: Object.keys(headersConfig).length > 0 ? headersConfig : undefined,
        request_template: requestTemplate || undefined,
      },
      {
        onSuccess: (newTarget) => {
          router.push(`/targets/${newTarget.id}`);
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Register New AI Target"
        description="Configure connectivity parameters, headers, and payload schema for adversarial evaluation."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: General Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">1. Target Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Target Application Name" id="name" error={errors.name?.message} required>
              <Input
                id="name"
                placeholder="e.g. Customer Support AI Assistant"
                {...register('name')}
              />
            </FormField>

            <FormField label="Description" id="description" error={errors.description?.message}>
              <Textarea
                id="description"
                placeholder="Briefly describe the target's purpose, model foundation, or role..."
                {...register('description')}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Target Architecture" id="target_type" error={errors.target_type?.message} required>
                <Select
                  value={targetType}
                  onValueChange={(val) => setValue('target_type', val as TargetType)}
                >
                  <SelectTrigger id="target_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHAT_API">Chat API (Multi-turn)</SelectItem>
                    <SelectItem value="COMPLETION_API">Completion API (Single-turn)</SelectItem>
                    <SelectItem value="AGENT_API">Agent API (Tool/Action execution)</SelectItem>
                    <SelectItem value="CUSTOM">Custom Integration</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Timeout (Seconds)" id="timeout_seconds" error={errors.timeout_seconds?.message}>
                <Input
                  id="timeout_seconds"
                  type="number"
                  min={1}
                  max={300}
                  {...register('timeout_seconds')}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Connection Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">2. Connection & Routing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField
                  label="Base URL"
                  id="base_url"
                  error={errors.base_url?.message}
                  description="SSRF-protected: loopback, link-local, and private addresses will be rejected"
                  required
                >
                  <Input
                    id="base_url"
                    placeholder="https://api.yourcompany.com"
                    {...register('base_url')}
                  />
                </FormField>
              </div>

              <div>
                <FormField label="HTTP Method" id="http_method" error={errors.http_method?.message} required>
                  <Select
                    value={httpMethod}
                    onValueChange={(val) => setValue('http_method', val)}
                  >
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
              <Input id="endpoint" placeholder="/v1/chat/completions" {...register('endpoint')} />
            </FormField>
          </CardContent>
        </Card>

        {/* Section 3: Authentication & Headers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">3. Authentication & Custom Headers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Authentication Type" id="authentication_type" error={errors.authentication_type?.message}>
              <Select
                value={authType}
                onValueChange={(val) => setValue('authentication_type', val as AuthenticationType)}
              >
                <SelectTrigger id="authentication_type">
                  <SelectValue placeholder="Authentication Type" />
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
              <KeyValueEditor
                value={headersConfig}
                onChange={setHeadersConfig}
                keyPlaceholder="Header Name (e.g. X-Api-Key)"
                valuePlaceholder="Header Value"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Request Payload Template */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">4. Request Payload Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label="JSON Payload Template"
              id="request_template"
              description="Use {{prompt}} as the substitution variable where test payloads should be injected"
            >
              <JsonEditor
                value={requestTemplate}
                onChange={setRequestTemplate}
                placeholder="{\n  &quot;messages&quot;: [{\n    &quot;role&quot;: &quot;user&quot;,\n    &quot;content&quot;: &quot;{{prompt}}&quot;\n  }]\n}"
              />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button variant="outline" asChild>
            <Link href="/targets">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Registering Target...' : 'Save and Register Target'}
          </Button>
        </div>
      </form>
    </div>
  );
}

