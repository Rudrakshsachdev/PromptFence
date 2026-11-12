import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScenarioCategory } from '@/types/scenario';

const categoryLabels: Record<ScenarioCategory, { label: string; className: string }> = {
  PROMPT_INJECTION: {
    label: 'Prompt Injection',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300',
  },
  DATA_DISCLOSURE: {
    label: 'Data Disclosure',
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
  },
  TOOL_EXECUTION: {
    label: 'Tool Execution',
    className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300',
  },
  INSTRUCTION_CONFLICT: {
    label: 'Instruction Conflict',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  REGRESSION: {
    label: 'Regression',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  },
};

export function CategoryBadge({ category }: { category: ScenarioCategory }) {
  const config = categoryLabels[category] || { label: category, className: '' };
  return (
    <Badge variant="outline" className={`font-medium text-[11px] ${config.className}`}>
      {config.label}
    </Badge>
  );
}

