'use client';

import React from 'react';
import { Target, Play, Fingerprint, AlertTriangle, FileCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Target,
    title: 'Target Configuration',
    description:
      'Connect LLM endpoints, RAG pipelines, or autonomous agents via secure HTTP, OpenAI-compatible APIs, or custom tool harnesses.',
  },
  {
    step: '02',
    icon: Play,
    title: 'Security Test Execution',
    description:
      'Launch comprehensive attack suites covering prompt injection, jailbreaks, data exfiltration, and privilege escalation.',
  },
  {
    step: '03',
    icon: Fingerprint,
    title: 'Canary & Provenance Tracing',
    description:
      'Inject session-bound canary tokens into synthetic knowledge documents and monitor their trajectory across agent tool calls.',
  },
  {
    step: '04',
    icon: AlertTriangle,
    title: 'Findings & Evidence',
    description:
      'Inspect detected exposures, captured outputs, unauthorized tool invocations, and precise token leakage traces with cryptographic proof.',
  },
  {
    step: '05',
    icon: FileCheck,
    title: 'Reports & Regression Baselines',
    description:
      'Export audit-ready executive reports, verify CI/CD pull request gates, and track security score improvements over time.',
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20 border-t border-neutral-200">
      <div className="max-w-2xl">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Operational Workflow
        </h2>
        <p className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">
          From Configuration to Cryptographic Proof
        </p>
        <p className="mt-3 text-base text-neutral-600 leading-relaxed">
          How PromptFence automates end-to-end security evaluations for production AI pipelines.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 md:grid-cols-5 gap-4">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-400"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-400">
                    {item.step}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-900">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="mt-4 text-sm font-bold text-neutral-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
