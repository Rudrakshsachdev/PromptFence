'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, WrapText } from 'lucide-react';
import { CopyButton } from '@/components/shared/id-chip';
import { cn } from '@/lib/utils';

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    // Pretty-print strings that are JSON documents.
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length < 500_000) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Minimal, dependency-free JSON token colouring. Output is text nodes only (no innerHTML). */
function highlightJson(text: string): React.ReactNode[] {
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(
        <span key={i++} className={m[2] ? 'text-primary' : 'text-success'}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(m[2]);
    } else if (m[3]) {
      out.push(
        <span key={i++} className="text-high">
          {m[3]}
        </span>,
      );
    } else if (m[4]) {
      out.push(
        <span key={i++} className="text-info">
          {m[4]}
        </span>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

interface CodeViewerProps {
  title?: string;
  /** Any JSON-serialisable value or raw string. */
  value: unknown;
  language?: 'json' | 'text';
  maxHeight?: number;
  emptyText?: string;
  /** Optional right-side header meta (status code, latency…). */
  meta?: React.ReactNode;
  /** Highlight occurrences of this substring (e.g. a canary token preview). */
  highlight?: string | null;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/** Read-only code / payload viewer with copy, wrap toggle and JSON colouring. */
export function CodeViewer({
  title,
  value,
  language,
  maxHeight = 360,
  emptyText = 'No data recorded',
  meta,
  highlight,
  className,
  collapsible = false,
  defaultCollapsed = false,
}: CodeViewerProps) {
  const text = useMemo(() => toText(value), [value]);
  const isJson = language ? language === 'json' : typeof value !== 'string' || text !== value;
  const [wrap, setWrap] = useState(true);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const content = useMemo(() => {
    if (!text) return null;
    if (highlight && text.includes(highlight)) {
      const parts = text.split(highlight);
      return parts.flatMap((part, idx) =>
        idx === 0
          ? [part]
          : [
              <mark
                key={`h${idx}`}
                className="rounded-sm bg-critical/25 px-0.5 text-critical ring-1 ring-critical/40"
              >
                {highlight}
              </mark>,
              part,
            ],
      );
    }
    return isJson && text.length < 200_000 ? highlightJson(text) : text;
  }, [text, isJson, highlight]);

  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-background', className)}>
      {(title || meta) && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface/40 px-3 py-1.5">
          <button
            type="button"
            disabled={!collapsible}
            onClick={() => setCollapsed((c) => !c)}
            className="flex min-w-0 items-center gap-1.5 text-left disabled:cursor-default"
            aria-expanded={collapsible ? !collapsed : undefined}
          >
            {collapsible &&
              (collapsed ? (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ))}
            <span className="eyebrow truncate">{title}</span>
          </button>
          <div className="flex shrink-0 items-center gap-1.5">
            {meta}
            {text && (
              <>
                <button
                  type="button"
                  onClick={() => setWrap((w) => !w)}
                  aria-label={wrap ? 'Disable line wrap' : 'Enable line wrap'}
                  title={wrap ? 'Disable line wrap' : 'Enable line wrap'}
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded hover:bg-surface-hover',
                    wrap ? 'text-foreground' : 'text-subtle-foreground',
                  )}
                >
                  <WrapText className="h-3 w-3" />
                </button>
                <CopyButton value={text} label="Copy contents" />
              </>
            )}
          </div>
        </div>
      )}
      {!collapsed &&
        (text ? (
          <pre
            className={cn(
              'overflow-auto p-3 font-mono text-[12px] leading-[1.6] text-foreground/90',
              wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
            )}
            style={{ maxHeight }}
          >
            <code>{content}</code>
          </pre>
        ) : (
          <p className="px-3 py-4 text-xs italic text-subtle-foreground">{emptyText}</p>
        ))}
    </div>
  );
}

/** Side-by-side request / response inspection (stacks on small screens). */
export function RequestResponseViewer({
  request,
  response,
  requestTitle = 'Request',
  responseTitle = 'Response',
  requestMeta,
  responseMeta,
  highlight,
  maxHeight = 420,
}: {
  request: unknown;
  response: unknown;
  requestTitle?: string;
  responseTitle?: string;
  requestMeta?: React.ReactNode;
  responseMeta?: React.ReactNode;
  highlight?: string | null;
  maxHeight?: number;
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <CodeViewer title={requestTitle} value={request} meta={requestMeta} maxHeight={maxHeight} />
      <CodeViewer
        title={responseTitle}
        value={response}
        meta={responseMeta}
        highlight={highlight}
        maxHeight={maxHeight}
      />
    </div>
  );
}
