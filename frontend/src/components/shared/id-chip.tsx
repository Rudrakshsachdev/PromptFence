'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CopyButton({
  value,
  label = 'Copy',
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error('Clipboard is not available in this context');
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-subtle-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

/**
 * Technical identifier in monospace (execution IDs, hashes, token previews).
 * Shows a shortened value with the full value in the title and an optional copy action.
 */
export function IdChip({
  value,
  length = 8,
  full = false,
  copy = true,
  prefix,
  className,
}: {
  value: string | null | undefined;
  length?: number;
  full?: boolean;
  copy?: boolean;
  prefix?: string;
  className?: string;
}) {
  if (!value) return <span className="mono-id">—</span>;
  const display = full || value.length <= length ? value : `${value.slice(0, length)}…`;
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1', className)}>
      <span className="truncate font-mono text-[12px] text-muted-foreground" title={value}>
        {prefix && <span className="text-subtle-foreground">{prefix}</span>}
        {display}
      </span>
      {copy && <CopyButton value={value} label="Copy identifier" />}
    </span>
  );
}
