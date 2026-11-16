import { ScenarioCategory, ScenarioSeverity } from '@/types/scenario';

export const SCENARIO_CATEGORIES: { value: ScenarioCategory; label: string; description: string }[] = [
  {
    value: 'PROMPT_INJECTION',
    label: 'Prompt Injection',
    description: 'Adversarial inputs attempting to override or hijack the core system prompt.',
  },
  {
    value: 'DATA_DISCLOSURE',
    label: 'Data Disclosure',
    description: 'Extraction of sensitive credentials, training records, or canary tokens.',
  },
  {
    value: 'TOOL_EXECUTION',
    label: 'Tool Execution',
    description: 'Inducing unauthorized, dangerous, or unauthenticated tool/function calls.',
  },
  {
    value: 'INSTRUCTION_CONFLICT',
    label: 'Instruction Conflict',
    description: 'Conflicting priorities between developer safety guidelines and user input.',
  },
  {
    value: 'REGRESSION',
    label: 'Regression',
    description: 'Baseline stability and safety boundaries across target application updates.',
  },
];

/** Ordered most → least severe. `color` kept for backwards compatibility (token-based). */
export const SCENARIO_SEVERITIES: { value: ScenarioSeverity; label: string; color: string }[] = [
  { value: 'CRITICAL', label: 'Critical', color: 'border-critical/30 bg-critical/10 text-critical' },
  { value: 'HIGH', label: 'High', color: 'border-high/30 bg-high/10 text-high' },
  { value: 'MEDIUM', label: 'Medium', color: 'border-warning/30 bg-warning/10 text-warning' },
  { value: 'LOW', label: 'Low', color: 'border-low/30 bg-low/10 text-low' },
  { value: 'INFO', label: 'Informational', color: 'border-border bg-surface text-muted-foreground' },
];
