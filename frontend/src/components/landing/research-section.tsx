'use client';

import React from 'react';
import { BookOpen, Layers, Cpu, Shield, Award, Check } from 'lucide-react';

const METRICS = [
  {
    code: 'ASR',
    name: 'Attack Success Rate',
    desc: 'Percentage of adversarial attempts that bypassed system safeguards.',
    formula: 'ASR = (Successful Attacks / Total Test Cases) × 100%',
  },
  {
    code: 'CER',
    name: 'Canary Exposure Rate',
    desc: 'Frequency of session-bound canary token disclosure in outputs.',
    formula: 'CER = (Exposed Canaries / Total Tainted Canaries) × 100%',
  },
  {
    code: 'PTR',
    name: 'Provenance Tracking Rate',
    desc: 'Accuracy of tracking untrusted data across multi-step retrieval chains.',
    formula: 'PTR = (Successfully Traced Steps / Total Intermediate Steps) × 100%',
  },
  {
    code: 'TBVR',
    name: 'Tool Boundary Violation Rate',
    desc: 'Proportion of unauthorized function calls executed by AI agents.',
    formula: 'TBVR = (Unauthorized Tool Invocations / Total Tool Calls) × 100%',
  },
  {
    code: 'RRR',
    name: 'Regression Rate',
    desc: 'Proportion of previously passing test scenarios that regressed in current run.',
    formula: 'RRR = (Regressed Scenarios / Total Baseline Scenarios) × 100%',
  },
  {
    code: 'PSI',
    name: 'PromptFence Security Index',
    desc: 'Composite 0–100 weighted metric combining all adversarial dimensions.',
    formula: 'PSI = 100 - (0.35·ASR + 0.35·CER + 0.20·TBVR + 0.10·RRR)',
  },
];

const ARCHITECTURES = [
  {
    title: 'Retrieval-Augmented Generation (RAG)',
    desc: 'Evaluates vector stores, document chunking, and context window assembly against indirect prompt injection and document poisoning.',
  },
  {
    title: 'Autonomous AI Agents & Tool Calling',
    desc: 'Tests function calling schemas, parameter tampering, unauthorized shell/SQL execution, and multi-agent delegation chains.',
  },
  {
    title: 'Direct LLM Endpoints & Chat APIs',
    desc: 'Evaluates raw foundation models and fine-tuned deployments against instruction overrides, jailbreaks, and system prompt leakage.',
  },
];

export function ResearchSection() {
  return (
    <section id="research" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20 border-t border-neutral-200">
      {/* Research Paper Feature Banner */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-8 sm:p-12 mb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-800">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Scientific Research Paper</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Dynamic Session-Bound Canary Tainting & Provenance Tracing
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Unlike static regex or signature-based firewalls, PromptFence dynamically instruments
              synthetic knowledge bases with session-bound, cryptographically random canary tokens.
              This guarantees mathematical certainty when measuring indirect prompt injection and data
              exfiltration.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg px-4 py-2.5 shadow-2xs">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Zero false-positive canary detection</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg px-4 py-2.5 shadow-2xs">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Cryptographic provenance verification</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg px-4 py-2.5 shadow-2xs">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Reproducible attack seeds & logs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Architectures */}
      <div className="mb-16">
        <div className="max-w-2xl">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Scope of Protection
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
            Supported AI Architectures
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {ARCHITECTURES.map((arch, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-400"
            >
              <h3 className="text-base font-bold text-neutral-950">{arch.title}</h3>
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed">{arch.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Standardized Security Metrics */}
      <div id="metrics" className="scroll-mt-20">
        <div className="max-w-2xl">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Empirical Evaluation
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
            Standardized Scientific Metrics
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            Every security run computes strict quantitative metrics to power comparative benchmarking.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {METRICS.map((metric, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-300"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-neutral-950 bg-neutral-100 px-2 py-0.5 rounded">
                    {metric.code}
                  </span>
                  <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Metric
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-neutral-900">{metric.name}</h4>
                <p className="mt-1 text-xs text-neutral-600">{metric.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 font-mono text-[11px] text-neutral-500">
                {metric.formula}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
