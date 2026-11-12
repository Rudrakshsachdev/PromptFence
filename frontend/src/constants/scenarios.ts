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

export const SCENARIO_SEVERITIES: { value: ScenarioSeverity; label: string; color: string }[] = [
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'INFO', label: 'Info', color: 'bg-slate-100 text-slate-800 border-slate-200' },
];

