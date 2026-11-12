import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScenarioSeverity } from '@/types/scenario';

const severityLabels: Record<ScenarioSeverity, { label: string; className: string }> = {
  CRITICAL: {
    label: 'Critical',
    className: 'bg-red-600 text-white border-transparent font-bold',
  },
  HIGH: {
    label: 'High',
    className: 'bg-orange-500 text-white border-transparent font-semibold',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-amber-100 text-amber-800 border-amber-300 font-medium',
  },
  LOW: {
    label: 'Low',
    className: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
  },
  INFO: {
    label: 'Info',
    className: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
  },
};

export function SeverityBadge({ severity }: { severity: ScenarioSeverity }) {
  const config = severityLabels[severity] || { label: severity, className: '' };
  return (
    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${config.className}`}>
      {config.label}
    </Badge>
  );
}

