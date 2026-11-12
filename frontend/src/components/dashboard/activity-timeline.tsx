'use client';

import React from 'react';
import {
  Clock,
  Crosshair,
  FolderKanban,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityItem {
  id: string;
  type: 'target' | 'suite' | 'scenario' | 'auth' | 'system';
  title: string;
  description: string;
  timestamp: string;
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'system',
    title: 'SSRF Validation Active',
    description: 'Outbound IP filtering guard enabled for loopback and cloud metadata ranges.',
    timestamp: 'Just now',
  },
  {
    id: '2',
    type: 'scenario',
    title: 'Adversarial Library Seeded',
    description: 'Loaded default OWASP Top 10 for LLM scenarios (Indirect Prompt Injection, Canary Extraction).',
    timestamp: '15m ago',
  },
  {
    id: '3',
    type: 'target',
    title: 'Demo Target Configured',
    description: 'Demo Chatbot Endpoint registered with immutable version v1 snapshot.',
    timestamp: '1h ago',
  },
  {
    id: '4',
    type: 'suite',
    title: 'OWASP LLM Suite Created',
    description: 'Assembled initial adversarial regression test suite with 5 test scenarios.',
    timestamp: '2h ago',
  },
  {
    id: '5',
    type: 'auth',
    title: 'Administrator Session Initialized',
    description: 'Signed in from internal console with single-use refresh token rotation.',
    timestamp: 'Today',
  },
];

const iconMap = {
  target: Crosshair,
  suite: FolderKanban,
  scenario: ShieldAlert,
  auth: UserCheck,
  system: ShieldCheck,
};

const colorMap = {
  target: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400',
  suite: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400',
  scenario: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
  auth: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
  system: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400',
};

export function ActivityTimeline() {
  return (
    <Card className="border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-600" />
          <span>Security Audit Activity</span>
        </CardTitle>
        <span className="text-[10px] font-mono text-slate-400 uppercase">Live Log</span>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
          {SAMPLE_ACTIVITIES.map((activity) => {
            const Icon = iconMap[activity.type];
            return (
              <div key={activity.id} className="relative group">
                <div
                  className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                    colorMap[activity.type]
                  }`}
                >
                  <Icon className="h-2.5 w-2.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {activity.title}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {activity.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {activity.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

