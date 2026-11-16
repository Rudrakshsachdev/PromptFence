import React from 'react';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { formatTimeMs } from '@/lib/format';
import { TONE_CLASSES, type Tone } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { DynamicCanary, EventType, ExecutionEvent } from '@/types/test-run';

interface Stage {
  key: string;
  label: string;
  events: EventType[];
  /** Tone when the stage was recorded. */
  tone: Tone;
}

const STAGES: Stage[] = [
  { key: 'gen', label: 'Canary generated', events: ['CANARY_GENERATED'], tone: 'accent' },
  { key: 'inst', label: 'Source instrumented', events: ['SOURCE_INSTRUMENTED'], tone: 'accent' },
  { key: 'req', label: 'Request dispatched', events: ['ADAPTER_REQUEST_SENT'], tone: 'info' },
  { key: 'resp', label: 'Response observed', events: ['ADAPTER_RESPONSE_RECEIVED'], tone: 'info' },
  { key: 'tool', label: 'Tool interaction', events: ['TOOL_CALL_ATTEMPTED'], tone: 'warning' },
  { key: 'exp', label: 'Exposure detected', events: ['CANARY_OBSERVED'], tone: 'critical' },
];

/**
 * Stage-by-stage provenance for a single case, derived only from recorded
 * engine events. A stage with no event is shown as "not recorded", never
 * assumed; exposure is only shown when a CANARY_OBSERVED event exists.
 */
export function ProvenanceFlow({
  events,
  canary,
}: {
  events: ExecutionEvent[];
  canary: DynamicCanary | undefined;
}) {
  const firstOf = (types: EventType[]) =>
    events
      .filter((e) => types.includes(e.event_type))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

  return (
    <div className="bg-grid overflow-x-auto rounded-md border border-border p-4">
      <ol className="flex min-w-[760px] items-stretch gap-1.5">
        {STAGES.map((stage, idx) => {
          const ev = firstOf(stage.events);
          const recorded = !!ev;
          const isExposure = stage.key === 'exp';
          const t = TONE_CLASSES[stage.tone];
          return (
            <React.Fragment key={stage.key}>
              <li
                className={cn(
                  'flex min-w-0 flex-1 flex-col gap-1.5 rounded-md border bg-card p-2.5',
                  recorded ? (isExposure ? 'border-critical/40' : 'border-border-strong') : 'border-dashed border-border opacity-70',
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                      recorded ? t.soft : 'bg-surface',
                    )}
                  >
                    {recorded ? <Check className={cn('h-2.5 w-2.5', t.text)} /> : <Minus className="h-2.5 w-2.5 text-subtle-foreground" />}
                  </span>
                  <span className="truncate text-[11px] font-medium text-foreground">{stage.label}</span>
                </span>
                <span className="font-mono text-[10px] text-subtle-foreground">
                  {recorded ? formatTimeMs(ev.created_at) : 'not recorded'}
                </span>
                {stage.key === 'gen' && canary && (
                  <span className="truncate font-mono text-[10px] text-muted-foreground" title={canary.token_preview}>
                    {canary.token_preview}
                  </span>
                )}
                {stage.key === 'inst' && canary && (
                  <span className="truncate font-mono text-[10px] text-muted-foreground" title={canary.source_id}>
                    {canary.source_id}
                  </span>
                )}
                {isExposure && (
                  <span className={cn('text-[10px] font-medium', recorded ? 'text-critical' : 'text-success')}>
                    {recorded ? 'Exact token match' : canary ? 'Not observed' : 'No canary'}
                  </span>
                )}
              </li>
              {idx < STAGES.length - 1 && (
                <li aria-hidden className="flex items-center">
                  <ArrowRight className="h-3 w-3 text-subtle-foreground" />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}
