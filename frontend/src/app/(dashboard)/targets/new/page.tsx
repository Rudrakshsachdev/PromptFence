'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Cpu,
  Globe,
  Info,
  Key,
  Layers,
  Lock,
  MessageSquare,
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateTarget } from '@/hooks/use-targets';
import { toast } from 'sonner';

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

const STEPS = [
  { id: 1, name: 'General', description: 'Identity & Architecture' },
  { id: 2, name: 'Connection', description: 'Endpoints & Network' },
  { id: 3, name: 'Authentication', description: 'Credentials & Security' },
  { id: 4, name: 'Payload', description: 'Headers & Body Schema' },
  { id: 5, name: 'Review', description: 'Summary & Confirmation' },
];

const ARCHITECTURES = [
  {
    type: 'CHAT_API',
    title: 'Chat API',
    description: 'OpenAI-compatible messages payload (/chat/completions)',
    icon: MessageSquare,
  },
  {
    type: 'COMPLETION_API',
    title: 'Completion API',
    description: 'Direct prompt string completions (/completions)',
    icon: Cpu,
  },
  {
    type: 'AGENT_API',
    title: 'AI Agent Endpoint',
    description: 'Autonomous tool-executing agent or LangChain / CrewAI endpoint',
    icon: Bot,
  },
  {
    type: 'CUSTOM',
    title: 'Custom API',
    description: 'Proprietary or specialized JSON payload schema',
    icon: Layers,
  },
];

export default function NewTargetPage() {
  const router = useRouter();
  const createMutation = useCreateTarget();
  const [currentStep, setCurrentStep] = useState(1);

  const [headersConfig, setHeadersConfig] = useState<Record<string, string>>({});
  const [requestTemplate, setRequestTemplate] = useState<Record<string, unknown> | null>({
    messages: [{ role: 'user', content: '{{prompt}}' }],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      target_type: 'CHAT_API',
      http_method: 'POST',
      authentication_type: 'NONE',
      timeout_seconds: 30,
      endpoint: '/v1/chat/completions',
      expected_response_format: 'json',
    },
    mode: 'onChange',
  });

  const formValues = watch();

  const handleNext = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger(['name', 'target_type']);
    } else if (currentStep === 2) {
      isValid = await trigger(['base_url', 'endpoint', 'http_method', 'timeout_seconds']);
    } else if (currentStep === 3) {
      isValid = await trigger(['authentication_type']);
    } else if (currentStep === 4) {
      isValid = true;
    }
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const onSubmit = (values: TargetFormValues) => {
    createMutation.mutate(
      {
        ...values,
        headers_config: Object.keys(headersConfig).length > 0 ? headersConfig : undefined,
        request_template: requestTemplate || undefined,
      },
      {
        onSuccess: (newTarget) => {
          toast.success('Target registered successfully');
          router.push(`/targets/${newTarget.id}`);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to register target');
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb back link */}
      <div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href="/targets">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Targets
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Register AI Target"
        description="Configure connectivity parameters, authentication credentials, and request schema for adversarial testing."
      />

      {/* Step Progress Tracker */}
      <div className="grid grid-cols-5 gap-2 border-b border-slate-200/80 pb-4">
        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              disabled={step.id > currentStep}
              className={`flex flex-col text-left transition-all ${
                isCurrent
                  ? 'text-teal-700 font-semibold'
                  : isDone
                  ? 'text-slate-700 hover:text-slate-900'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-teal-600 text-white'
                      : isDone
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : step.id}
                </span>
                <span className="text-xs truncate">{step.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block truncate">
                {step.description}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 1: General Information & Architecture */}
        {currentStep === 1 && (
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-teal-600" />
                <span>1. General Information & Architecture</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                label="Target Application Name"
                id="name"
                error={errors.name?.message}
                required
                helperText="E.g., Customer Support Chatbot, Internal Knowledge RAG, Code Assistant"
              >
                <Input
                  id="name"
                  placeholder="Demo AI Assistant API"
                  {...register('name')}
                  className="h-9 text-xs"
                />
              </FormField>

              <FormField
                label="Description"
                id="description"
                error={errors.description?.message}
                helperText="Provide context regarding the target's purpose and underlying model."
              >
                <Textarea
                  id="description"
                  placeholder="LLM application serving customer queries via external REST endpoint."
                  {...register('description')}
                  className="text-xs min-h-[70px]"
                />
              </FormField>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Target Architecture Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ARCHITECTURES.map((arch) => {
                    const Icon = arch.icon;
                    const isSelected = formValues.target_type === arch.type;
                    return (
                      <div
                        key={arch.type}
                        onClick={() => setValue('target_type', arch.type as any)}
                        className={`cursor-pointer p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900">{arch.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {arch.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Connection Configuration */}
        {currentStep === 2 && (
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-teal-600" />
                <span>2. Connection & Network Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SSRF Protection Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-md border border-teal-200/80 bg-teal-50/60 text-teal-900 text-xs">
                <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">SSRF Protection Enabled</p>
                  <p className="text-[11px] text-teal-800">
                    Outbound connections are validated by PromptFence. Internal networks (RFC 1918),
                    loopback (127.0.0.1), and cloud metadata endpoints (169.254.169.254) are rejected.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    label="Base URL"
                    id="base_url"
                    error={errors.base_url?.message}
                    required
                    helperText="Protocol and hostname (e.g., https://api.openai.com or https://myai.internal)"
                  >
                    <Input
                      id="base_url"
                      placeholder="https://api.yourdomain.com"
                      {...register('base_url')}
                      className="h-9 text-xs font-mono"
                    />
                  </FormField>
                </div>

                <div>
                  <FormField
                    label="Endpoint Path"
                    id="endpoint"
                    error={errors.endpoint?.message}
                    required
                    helperText="Relative path of the target API"
                  >
                    <Input
                      id="endpoint"
                      placeholder="/v1/chat/completions"
                      {...register('endpoint')}
                      className="h-9 text-xs font-mono"
                    />
                  </FormField>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    HTTP Method <span className="text-red-500">*</span>
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
                  label="Timeout Window (Seconds)"
                  id="timeout_seconds"
                  error={errors.timeout_seconds?.message}
                  required
                  helperText="Maximum allowed latency (1 to 300s)"
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
        )}

        {/* STEP 3: Authentication & Security */}
        {currentStep === 3 && (
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-teal-600" />
                <span>3. Authentication & Access Credentials</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Authentication Mechanism <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formValues.authentication_type}
                  onValueChange={(val) => setValue('authentication_type', val as any)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Authentication Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None / Public API</SelectItem>
                    <SelectItem value="BEARER">Bearer Token (Authorization: Bearer ...)</SelectItem>
                    <SelectItem value="API_KEY">API Key Header</SelectItem>
                    <SelectItem value="BASIC">Basic Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formValues.authentication_type === 'BEARER' && (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <Key className="h-3.5 w-3.5 text-teal-600" />
                    <span>Bearer Token Configuration</span>
                  </div>
                  <Input
                    type="password"
                    placeholder="Enter bearer token (e.g., sk-...)"
                    onChange={(e) => {
                      if (e.target.value) {
                        setHeadersConfig((prev) => ({
                          ...prev,
                          Authorization: `Bearer ${e.target.value}`,
                        }));
                      }
                    }}
                    className="h-9 text-xs font-mono bg-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Stored securely and injected into the Authorization header during evaluations.
                  </p>
                </div>
              )}

              {formValues.authentication_type === 'API_KEY' && (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <Key className="h-3.5 w-3.5 text-teal-600" />
                    <span>API Key Header Configuration</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Header Name (e.g. X-API-Key)"
                      id="api_key_header"
                      className="h-9 text-xs font-mono bg-white"
                    />
                    <Input
                      type="password"
                      placeholder="API Key Secret"
                      id="api_key_value"
                      onChange={(e) => {
                        const headerName =
                          (document.getElementById('api_key_header') as HTMLInputElement)?.value ||
                          'X-API-Key';
                        if (e.target.value) {
                          setHeadersConfig((prev) => ({
                            ...prev,
                            [headerName]: e.target.value,
                          }));
                        }
                      }}
                      className="h-9 text-xs font-mono bg-white"
                    />
                  </div>
                </div>
              )}

              {formValues.authentication_type === 'NONE' && (
                <p className="text-xs text-slate-500 italic p-3 rounded bg-slate-50 border border-slate-100">
                  No authentication headers will be transmitted. Suitable for open model endpoints or mock testing servers.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Request Payload & Custom Headers */}
        {currentStep === 4 && (
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-teal-600" />
                <span>4. Request Headers & Payload Template</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Custom HTTP Headers
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
                  <label className="text-xs font-semibold text-slate-700">
                    JSON Request Template
                  </label>
                  <span className="text-[10px] text-teal-700 font-mono">
                    Use {'{{prompt}}'} as placeholder
                  </span>
                </div>
                <JsonEditor
                  value={requestTemplate}
                  onChange={setRequestTemplate}
                  height="160px"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  PromptFence will replace {'{{prompt}}'} with individual adversarial scenario vectors during test runs.
                </p>
              </div>

              <FormField
                label="Expected Response Format"
                id="expected_response_format"
                helperText="E.g., json, markdown, plain text"
              >
                <Input
                  id="expected_response_format"
                  placeholder="json"
                  {...register('expected_response_format')}
                  className="h-9 text-xs font-mono"
                />
              </FormField>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Review & Save */}
        {currentStep === 5 && (
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>5. Configuration Review & Confirmation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Target Name:</span>
                  <span className="font-semibold text-slate-900">{formValues.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Architecture:</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {formValues.target_type}
                  </Badge>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Full URL:</span>
                  <span className="font-mono text-teal-700 font-medium truncate max-w-xs">
                    {formValues.http_method} {formValues.base_url}
                    {formValues.endpoint}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Authentication:</span>
                  <span className="font-mono text-slate-800">{formValues.authentication_type}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Timeout:</span>
                  <span className="font-mono text-slate-800">{formValues.timeout_seconds}s</span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-teal-50 border border-teal-200/60 text-teal-800 text-[11px] leading-relaxed">
                Saving will create <strong>Version 1 (v1)</strong> of this target configuration snapshot. Any future edits will automatically create immutable incremental versions.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wizard Navigation Actions */}
        <div className="flex items-center justify-between pt-2">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
              className="h-8 text-xs text-slate-600"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white"
            >
              Next Step <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={createMutation.isPending}
              size="sm"
              className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
            >
              {createMutation.isPending ? 'Saving Target...' : 'Save & Register Target'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
