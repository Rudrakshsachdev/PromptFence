'use client';

import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  Cpu,
  Database,
  Radar,
  ScanSearch,
  Syringe,
  Wrench,
} from 'lucide-react';
import { formatTimeMs } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ExecutionEvent, TargetTrace } from '@/types/test-run';

/**
 * recorded: backed by at least one persisted event/record.
 * exposure: the detection stage recorded a CANARY_OBSERVED event.
 * clear: the response was received and checked; no CANARY_OBSERVED event exists.
 * missing: nothing was persisted for this stage (never inferred).
 */
export type StageState = 'recorded' | 'exposure' | 'clear' | 'missing';

export type StageKey = 'source' | 'injection' | 'model' | 'tooling' | 'output' | 'detection';

export interface FlowStage {
  key: StageKey;
  title: string;
  state: StageState;
  /** Events that back this stage, chronological. */
  events: ExecutionEvent[];
  /** Short evidence line (mono) shown on the stage card. */
  summary: string | null;
  /** Explanation shown when the stage is missing/clear. */
  note: string;
  timestamp: string | null;
  traces?: TargetTrace[];
}

const ICONS: Record<StageKey, React.ElementType> = {
  source: Database,
  injection: Syringe,
  model: Cpu,
  tooling: Wrench,
  output: ScanSearch,
  detection: Radar,
};

const STATE_LABEL: Record<StageState, string> = {
  recorded: 'Recorded',
  exposure: 'Exposure detected',
  clear: 'Token not observed',
  missing: 'Not recorded',
};

const STATE_STYLE: Record<StageState, { card: string; icon: string; label: string; dot: string }> = {
  recorded: {
    card: 'border-border bg-card hover:border-border-strong',
    icon: 'border-info/30 bg-info/10 text-info',
    label: 'text-info',
    dot: 'bg-info',
  },
  exposure: {
    card: 'border-critical/45 bg-critical/[0.06] hover:border-critical/70',
    icon: 'border-critical/40 bg-critical/15 text-critical',
    label: 'text-critical',
    dot: 'bg-critical',
  },
  clear: {
    card: 'border-success/30 bg-success/[0.04] hover:border-success/50',
    icon: 'border-success/30 bg-success/10 text-success',
    label: 'text-success',
    dot: 'bg-success',
  },
  missing: {
    card: 'border-dashed border-border bg-background/40 opacity-70 hover:opacity-100',
    icon: 'border-dashed border-border bg-transparent text-subtle-foreground',
    label: 'text-subtle-foreground',
    dot: 'bg-subtle-foreground',
  },
};

/**
 * Six-stage taint propagation flow. Horizontal on wide screens, vertical on
 * narrow ones. Each stage is a button that selects it for detailed inspection.
 */
export function ProvenanceFlow({
  stages,
  selected,
  onSelect,
}: {
  stages: FlowStage[];
  selected: StageKey;
  onSelect: (key: StageKey) => void;
}) {
  return (
    <div className="bg-grid rounded-lg border border-border bg-background/60 p-3 sm:p-4">
      <ol className="flex flex-col gap-0 xl:flex-row xl:items-stretch" aria-label="Provenance chain">
        {stages.map((stage, idx) => {
          const Icon = ICONS[stage.key];
          const style = STATE_STYLE[stage.state];
          const isSelected = selected === stage.key;
          return (
            <li key={stage.key} className="flex flex-col xl:min-w-0 xl:flex-1 xl:flex-row xl:items-center">
              <button
                type="button"
                onClick={() => onSelect(stage.key)}
                aria-pressed={isSelected}
                aria-label={`${stage.title}: ${STATE_LABEL[stage.state]}`}
                className={cn(
                  'group flex w-full min-w-0 flex-1 flex-col gap-2 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 xl:h-full',
                  style.card,
                  isSelected && 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                      style.icon,
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="font-mono text-[10px] text-subtle-foreground">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold leading-tight text-foreground">{stage.title}</p>
                  <p className={cn('mt-1 flex items-center gap-1.5 text-[11px] font-medium', style.label)}>
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        style.dot,
                        stage.state === 'exposure' && 'animate-status-pulse',
                      )}
                      aria-hidden
                    />
                    {STATE_LABEL[stage.state]}
                  </p>
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="font-mono text-[10px] text-subtle-foreground">
                    {stage.timestamp ? formatTimeMs(stage.timestamp) : '—'}
                  </p>
                  {stage.summary && (
                    <p className="truncate font-mono text-[11px] text-muted-foreground" title={stage.summary}>
                      {stage.summary}
                    </p>
                  )}
                </div>
              </button>
              {idx < stages.length - 1 && (
                <span
                  aria-hidden
                  className="flex h-6 items-center justify-center text-subtle-foreground xl:h-auto xl:w-5 xl:shrink-0"
                >
                  <ArrowDown className="h-3.5 w-3.5 xl:hidden" />
                  <ArrowRight className="hidden h-3.5 w-3.5 xl:block" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export const STAGE_STATE_LABEL = STATE_LABEL;
