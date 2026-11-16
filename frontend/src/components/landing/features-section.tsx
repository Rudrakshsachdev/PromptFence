'use client';

import React from 'react';
import {
  ShieldAlert,
  Fingerprint,
  GitBranch,
  Bot,
  RefreshCw,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldAlert,
    title: 'Adversarial Security Testing',
    description:
      'Systematic adversarial test suites targeting direct prompt injection, indirect RAG poisoning, multi-turn jailbreaking, and system prompt extraction.',
  },
  {
    icon: Fingerprint,
    title: 'Dynamic Canary Tainting',
    description:
      'Generate session-bound cryptographically unique canary tokens injected into synthetic data sources to detect sensitive information leakage in real time.',
  },
  {
    icon: GitBranch,
    title: 'Provenance & Taint Tracing',
    description:
      'Track data flow across vector retrievals, intermediate agent scratchpads, and downstream tool arguments to pinpoint the exact origin of security breaches.',
  },
  {
    icon: Bot,
    title: 'AI Agent & Tool Boundaries',
    description:
      'Enforce and audit strict execution boundaries for function calls, API tools, and multi-agent delegation against unauthorized invocation and parameter tampering.',
  },
  {
    icon: RefreshCw,
    title: 'Continuous Regression Testing',
    description:
      'Automate regression detection across LLM model upgrades, prompt engineering iterations, and RAG index changes with persistent historical baselines.',
  },
  {
    icon: BarChart3,
    title: 'Scientific Security Analytics',
    description:
      'Standardized scoring across Attack Success Rate (ASR), Canary Exposure Rate (CER), and Tool Boundary Violation Rate with executive PDF and JSON reports.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <div className="max-w-2xl">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Core Capabilities
        </h2>
        <p className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">
          Engineered for LLM Application Security
        </p>
        <p className="mt-3 text-base text-neutral-600 leading-relaxed">
          PromptFence provides end-to-end adversarial evaluation and instrumentation designed
          specifically for production AI agents, RAG pipelines, and LLM microservices.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-7 transition-all duration-200 hover:border-neutral-400 hover:shadow-xs"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 transition-colors group-hover:bg-neutral-950 group-hover:text-white group-hover:border-neutral-950">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-neutral-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-neutral-900 group-hover:text-neutral-950">
                <span>Learn more</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
