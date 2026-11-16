import {
  Ban,
  CheckCircle2,
  CircleDot,
  FileSearch,
  Fingerprint,
  Flag,
  Inbox,
  ListChecks,
  Play,
  Send,
  ShieldAlert,
  Siren,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { humanize } from '@/lib/format';
import type { Tone } from '@/lib/status';
import type { EventType } from '@/types/test-run';

interface EventMeta {
  label: string;
  tone: Tone;
  icon: LucideIcon;
}

/** Presentation for execution engine event types (run- and case-level). */
export const EVENT_META: Record<EventType, EventMeta> = {
  RUN_CREATED: { label: 'Run created', tone: 'neutral', icon: CircleDot },
  RUN_QUEUED: { label: 'Run queued', tone: 'neutral', icon: Inbox },
  RUN_STARTED: { label: 'Run started', tone: 'info', icon: Play },
  CASE_STARTED: { label: 'Scenario started', tone: 'info', icon: Play },
  CANARY_GENERATED: { label: 'Canary generated', tone: 'accent', icon: Fingerprint },
  SOURCE_INSTRUMENTED: { label: 'Source instrumented', tone: 'accent', icon: FileSearch },
  ADAPTER_REQUEST_SENT: { label: 'Request sent', tone: 'neutral', icon: Send },
  ADAPTER_RESPONSE_RECEIVED: { label: 'Response received', tone: 'neutral', icon: Inbox },
  TOOL_CALL_ATTEMPTED: { label: 'Tool call attempted', tone: 'warning', icon: Wrench },
  CANARY_OBSERVED: { label: 'Canary observed', tone: 'critical', icon: Siren },
  ASSERTION_COMPLETED: { label: 'Assertion evaluated', tone: 'info', icon: ListChecks },
  FINDING_CREATED: { label: 'Finding created', tone: 'high', icon: ShieldAlert },
  CASE_COMPLETED: { label: 'Scenario completed', tone: 'success', icon: CheckCircle2 },
  RUN_COMPLETED: { label: 'Run completed', tone: 'success', icon: Flag },
  RUN_FAILED: { label: 'Run failed', tone: 'critical', icon: XCircle },
  RUN_CANCELLED: { label: 'Run cancelled', tone: 'warning', icon: Ban },
};

export function getEventMeta(type: string, level?: string | null): EventMeta {
  const meta = EVENT_META[type as EventType] ?? { label: humanize(type), tone: 'neutral', icon: CircleDot };
  const lvl = level?.toUpperCase();
  if (lvl === 'ERROR' || lvl === 'CRITICAL') return { ...meta, tone: 'critical' };
  return meta;
}

/** Log level → tone. */
export function getLogLevelTone(level: string | null | undefined): Tone {
  const lvl = (level ?? '').toUpperCase();
  if (lvl === 'ERROR' || lvl === 'CRITICAL' || lvl === 'FATAL') return 'critical';
  if (lvl === 'WARNING' || lvl === 'WARN') return 'warning';
  if (lvl === 'DEBUG' || lvl === 'TRACE') return 'neutral';
  return 'info';
}

/**
 * The backend stores only a preview of each token (`head13...tail6`), so the
 * literal preview never appears in output. The 13-character head is the real
 * token prefix and can be matched against recorded response text.
 */
export function tokenPrefix(preview: string | null | undefined): string | null {
  if (!preview) return null;
  const head = preview.split('...')[0];
  return head && head.length >= 8 ? head : null;
}
