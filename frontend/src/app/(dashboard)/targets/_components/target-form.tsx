'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  Cpu,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { FormField } from '@/components/forms/form-field';
import { JsonEditor } from '@/components/forms/json-editor';
import { Panel } from '@/components/shared/panel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getTargetTypeLabel } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { AuthenticationType, TargetType } from '@/types/target';
import { AUTH_TYPE_LABELS, isSensitiveKey, MASK } from './target-utils';

export const targetFormSchema = z.object({
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

export type TargetFormValues = z.infer<typeof targetFormSchema>;

export interface TargetFormPayload extends TargetFormValues {
  headers_config?: Record<string, string>;
  request_template?: Record<string, unknown>;
}

const ARCHITECTURES: { type: TargetType; description: string; icon: React.ElementType }[] = [
  { type: 'CHAT_API', description: 'OpenAI-compatible messages payload', icon: MessageSquare },
  { type: 'COMPLETION_API', description: 'Raw prompt string completion', icon: Cpu },
  { type: 'AGENT_API', description: 'Tool-executing agent endpoint', icon: Bot },
  { type: 'CUSTOM', description: 'Proprietary JSON schema over HTTP', icon: Layers },
];

const AUTH_TYPES: AuthenticationType[] = ['NONE', 'BEARER', 'API_KEY', 'BASIC'];

interface HeaderRow {
  id: number;
  key: string;
  value: string;
}

let rowSeq = 0;
const toRows = (headers: Record<string, string> | null | undefined): HeaderRow[] =>
  Object.entries(headers ?? {}).map(([key, value]) => ({ id: ++rowSeq, key, value }));

function base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

interface TargetFormProps {
  mode: 'create' | 'edit';
  defaultValues: Partial<TargetFormValues>;
  initialHeaders?: Record<string, string> | null;
  initialTemplate?: Record<string, unknown> | null;
  isSubmitting: boolean;
  cancelHref: string;
  onSubmit: (payload: TargetFormPayload) => void;
}

/**
 * Shared create/edit form. Sends the same payload shape as the original pages:
 * form values + headers_config (omitted when empty) + request_template (omitted when null).
 */
export function TargetForm({
  mode,
  defaultValues,
  initialHeaders,
  initialTemplate,
  isSubmitting,
  cancelHref,
  onSubmit,
}: TargetFormProps) {
  const [rows, setRows] = useState<HeaderRow[]>(() => toRows(initialHeaders));
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [requestTemplate, setRequestTemplate] = useState<Record<string, unknown> | null>(
    initialTemplate ?? null,
  );
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [basicUser, setBasicUser] = useState('');
  const [basicPass, setBasicPass] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const values = watch();

  const headersConfig = useMemo(() => {
    const out: Record<string, string> = {};
    rows.forEach(({ key, value }) => {
      if (key.trim()) out[key.trim()] = value;
    });
    return out;
  }, [rows]);

  /** Sets (or replaces) a header row by case-insensitive name. */
  const upsertHeader = (name: string, value: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.key.trim().toLowerCase() === name.toLowerCase());
      if (idx === -1) return [...prev, { id: ++rowSeq, key: name, value }];
      const next = [...prev];
      next[idx] = { ...next[idx], value };
      return next;
    });
  };

  const hasCredentialHeader = rows.some((r) => r.key.trim() && isSensitiveKey(r.key) && r.value);

  const submit = (v: TargetFormValues) => {
    onSubmit({
      ...v,
      expected_response_format: v.expected_response_format?.trim() || undefined,
      headers_config: Object.keys(headersConfig).length > 0 ? headersConfig : undefined,
      request_template: requestTemplate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        {/* Identity */}
        <Panel title="Identity" description="How this target appears across PromptFence" icon={SlidersHorizontal}>
          <div className="space-y-4">
            <FormField label="Target name" id="name" error={errors.name?.message} required>
              <Input
                id="name"
                placeholder="Customer support assistant"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
            </FormField>
            <FormField
              label="Description"
              id="description"
              error={errors.description?.message}
              helperText="Purpose, underlying model, and anything a reviewer should know."
            >
              <Textarea
                id="description"
                placeholder="RAG assistant over internal policy docs, GPT-4 class model."
                {...register('description')}
                className="min-h-[72px]"
              />
            </FormField>
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-foreground">
                Target type <span className="text-critical" aria-hidden>*</span>
              </legend>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                {ARCHITECTURES.map((arch) => {
                  const Icon = arch.icon;
                  const selected = values.target_type === arch.type;
                  return (
                    <button
                      key={arch.type}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setValue('target_type', arch.type, { shouldDirty: true, shouldValidate: true })
                      }
                      className={cn(
                        'flex items-start gap-3 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                        selected
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-border bg-background/40 hover:border-border-strong hover:bg-surface/50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                          selected
                            ? 'border-primary/40 bg-primary/15 text-primary'
                            : 'border-border bg-surface text-muted-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-foreground">
                          {getTargetTypeLabel(arch.type)}
                        </span>
                        <span className="block text-xs text-muted-foreground">{arch.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </Panel>

        {/* Endpoint */}
        <Panel title="Endpoint" description="Where test traffic is sent" icon={Globe}>
          <div className="space-y-4">
            <Alert variant="info">
              <ShieldCheck />
              <AlertTitle>Outbound SSRF protection</AlertTitle>
              <AlertDescription>
                Private ranges (RFC 1918), loopback and cloud metadata addresses are rejected by the
                backend when the target is contacted.
              </AlertDescription>
            </Alert>
            <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
              <FormField label="Method" id="http_method" required>
                <select
                  id="http_method"
                  {...register('http_method')}
                  className="flex h-9 w-full rounded-md border border-input bg-background/60 px-2.5 font-mono text-[13px] text-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                </select>
              </FormField>
              <FormField
                label="Base URL"
                id="base_url"
                error={errors.base_url?.message}
                required
                helperText="Scheme and host, e.g. https://api.example.com"
              >
                <Input
                  id="base_url"
                  placeholder="https://api.example.com"
                  aria-invalid={!!errors.base_url}
                  className="font-mono"
                  {...register('base_url')}
                />
              </FormField>
            </div>
            <FormField
              label="Endpoint path"
              id="endpoint"
              error={errors.endpoint?.message}
              required
              helperText="Appended to the base URL"
            >
              <Input
                id="endpoint"
                placeholder="/v1/chat/completions"
                aria-invalid={!!errors.endpoint}
                className="font-mono"
                {...register('endpoint')}
              />
            </FormField>
          </div>
        </Panel>

        {/* Authentication */}
        <Panel title="Authentication" description="Credentials are sent as request headers" icon={KeyRound}>
          <div className="space-y-4">
            <div role="radiogroup" aria-label="Authentication type" className="flex flex-wrap gap-2">
              {AUTH_TYPES.map((t) => {
                const selected = values.authentication_type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setValue('authentication_type', t, { shouldDirty: true })}
                    className={cn(
                      'h-8 rounded-md border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                      selected
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground',
                    )}
                  >
                    {AUTH_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>

            {mode === 'edit' && hasCredentialHeader && values.authentication_type !== 'NONE' && (
              <p className="text-xs text-muted-foreground">
                A credential header is already configured (masked below). Enter a new value to replace it.
              </p>
            )}

            {values.authentication_type === 'BEARER' && (
              <FormField
                label="Bearer token"
                id="bearer_token"
                helperText="Written to the Authorization header as “Bearer <token>”."
              >
                <Input
                  id="bearer_token"
                  type="password"
                  autoComplete="off"
                  placeholder="sk-…"
                  className="font-mono"
                  onChange={(e) => e.target.value && upsertHeader('Authorization', `Bearer ${e.target.value}`)}
                />
              </FormField>
            )}

            {values.authentication_type === 'API_KEY' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Header name" id="api_key_header">
                  <Input
                    id="api_key_header"
                    value={apiKeyHeader}
                    onChange={(e) => setApiKeyHeader(e.target.value)}
                    className="font-mono"
                  />
                </FormField>
                <FormField label="API key" id="api_key_value">
                  <Input
                    id="api_key_value"
                    type="password"
                    autoComplete="off"
                    placeholder="Secret value"
                    className="font-mono"
                    onChange={(e) =>
                      e.target.value && upsertHeader(apiKeyHeader.trim() || 'X-API-Key', e.target.value)
                    }
                  />
                </FormField>
              </div>
            )}

            {values.authentication_type === 'BASIC' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Username" id="basic_user">
                  <Input
                    id="basic_user"
                    autoComplete="off"
                    value={basicUser}
                    onChange={(e) => {
                      setBasicUser(e.target.value);
                      if (e.target.value && basicPass)
                        upsertHeader('Authorization', `Basic ${base64(`${e.target.value}:${basicPass}`)}`);
                    }}
                  />
                </FormField>
                <FormField label="Password" id="basic_pass" helperText="Encoded into the Authorization header.">
                  <Input
                    id="basic_pass"
                    type="password"
                    autoComplete="off"
                    value={basicPass}
                    onChange={(e) => {
                      setBasicPass(e.target.value);
                      if (basicUser && e.target.value)
                        upsertHeader('Authorization', `Basic ${base64(`${basicUser}:${e.target.value}`)}`);
                    }}
                  />
                </FormField>
              </div>
            )}

            {values.authentication_type === 'NONE' && (
              <p className="text-xs text-muted-foreground">
                No authentication headers are added. Suitable for public or mock endpoints.
              </p>
            )}
          </div>
        </Panel>

        {/* Request & response */}
        <Panel title="Request & response" description="Headers and body sent for every scenario" icon={Settings2}>
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">HTTP headers</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setRows((r) => [...r, { id: ++rowSeq, key: '', value: '' }])}
                >
                  <Plus className="h-3 w-3" /> Add header
                </Button>
              </div>
              {rows.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-subtle-foreground">
                  No custom headers.
                </p>
              ) : (
                <ul className="space-y-2">
                  {rows.map((row) => {
                    const sensitive = isSensitiveKey(row.key);
                    const show = !sensitive || revealed.has(row.id);
                    return (
                      <li key={row.id} className="flex items-center gap-2">
                        <Input
                          aria-label="Header name"
                          placeholder="Header-Name"
                          value={row.key}
                          onChange={(e) =>
                            setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, key: e.target.value } : r)))
                          }
                          className="h-8 flex-1 font-mono text-xs"
                        />
                        <div className="relative flex-1">
                          <Input
                            aria-label={`Value for ${row.key || 'header'}`}
                            placeholder="value"
                            type={show ? 'text' : 'password'}
                            autoComplete="off"
                            value={row.value}
                            onChange={(e) =>
                              setRows((rs) =>
                                rs.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)),
                              )
                            }
                            className={cn('h-8 font-mono text-xs', sensitive && 'pr-8')}
                          />
                          {sensitive && (
                            <button
                              type="button"
                              aria-label={show ? 'Hide value' : 'Reveal value'}
                              onClick={() =>
                                setRevealed((s) => {
                                  const n = new Set(s);
                                  if (n.has(row.id)) n.delete(row.id);
                                  else n.add(row.id);
                                  return n;
                                })
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-subtle-foreground hover:text-foreground"
                            >
                              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove header"
                          onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
                          className="hover:text-critical"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Request body template</span>
                <span className="font-mono text-[11px] text-subtle-foreground">{'{{prompt}}'} is replaced per scenario</span>
              </div>
              <JsonEditor value={requestTemplate} onChange={setRequestTemplate} height="170px" />
            </div>
          </div>
        </Panel>

        {/* Advanced */}
        <Panel title="Advanced" icon={SlidersHorizontal}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Timeout (seconds)"
              id="timeout_seconds"
              error={errors.timeout_seconds?.message}
              required
              helperText="1–300 seconds per request"
            >
              <Input
                id="timeout_seconds"
                type="number"
                min={1}
                max={300}
                aria-invalid={!!errors.timeout_seconds}
                className="font-mono"
                {...register('timeout_seconds')}
              />
            </FormField>
            <FormField
              label="Expected response format"
              id="expected_response_format"
              helperText="e.g. json, markdown, text"
            >
              <Input
                id="expected_response_format"
                placeholder="json"
                className="font-mono"
                {...register('expected_response_format')}
              />
            </FormField>
          </div>
        </Panel>
      </div>

      {/* Summary rail */}
      <aside className="xl:sticky xl:top-20 xl:self-start">
        <Panel title="Request preview">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-background p-2.5 font-mono text-[12px]">
              <span className="mr-2 font-semibold text-primary">{values.http_method || 'POST'}</span>
              <span className="break-all text-foreground/90">
                {values.base_url || 'https://…'}
                {values.endpoint || ''}
              </span>
            </div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="text-foreground">{getTargetTypeLabel(values.target_type)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Authentication</dt>
                <dd className="text-foreground">{AUTH_TYPE_LABELS[values.authentication_type] ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Headers</dt>
                <dd className="font-mono text-foreground">{Object.keys(headersConfig).length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Timeout</dt>
                <dd className="font-mono text-foreground">{values.timeout_seconds || '—'}s</dd>
              </div>
            </dl>
            {Object.keys(headersConfig).length > 0 && (
              <ul className="space-y-1 border-t border-border pt-3 font-mono text-[11px]">
                {Object.entries(headersConfig).map(([k, v]) => (
                  <li key={k} className="flex gap-1.5 truncate">
                    <span className="text-muted-foreground">{k}:</span>
                    <span className="truncate text-foreground/80">{isSensitiveKey(k) ? MASK : v}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-subtle-foreground">
              {mode === 'create'
                ? 'Saving creates version 1 of this target. Later edits create new immutable versions.'
                : 'Saving creates a new immutable configuration version. Past runs keep their snapshot.'}
            </p>
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {isSubmitting ? 'Saving…' : mode === 'create' ? 'Register target' : 'Save as new version'}
              </Button>
              <Button asChild variant="ghost">
                <Link href={cancelHref}>Cancel</Link>
              </Button>
            </div>
          </div>
        </Panel>
      </aside>
    </form>
  );
}
