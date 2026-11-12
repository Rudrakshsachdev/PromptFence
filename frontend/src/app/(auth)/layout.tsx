import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 dark:bg-slate-950">
      {/* Left Column: Security Branding & Feature Highlight (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-950 text-white relative overflow-hidden border-r border-slate-800">
        {/* Subtle background tech grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo & System Indicator */}
        <div className="relative z-10 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-teal-400">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>AI Sec Lab Active</span>
          </div>
        </div>

        {/* Center: Mission & Feature Highlights */}
        <div className="relative z-10 space-y-8 my-auto py-12 max-w-lg">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-950/60 border border-teal-800/60 text-teal-300 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              <span>Adversarial Testing Lab</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Provenance-Aware Security Testing for AI Applications.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Systematically evaluate LLMs, chat endpoints, and autonomous agents against indirect prompt injection, data disclosure, and unauthorized tool execution.
            </p>
          </div>

          {/* Key Feature Highlights */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-950 text-teal-400 border border-teal-800">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Dynamic Canary Tainting Seams</p>
                <p className="text-[11px] text-slate-400">
                  Mathematically verifiable detection of sensitive context leakage into output streams.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-950 text-teal-400 border border-teal-800">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Immutable Target Versioning</p>
                <p className="text-[11px] text-slate-400">
                  Every parameter update creates reproducible historical snapshots for regression tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-950 text-teal-400 border border-teal-800">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Hardened Multi-Stage SSRF Defense</p>
                <p className="text-[11px] text-slate-400">
                  Perimeter guards blocking loopback, link-local, and cloud metadata endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>PromptFence Core v0.1</span>
          <span>Argon2id · JWT Rotation · RBAC</span>
        </div>
      </div>

      {/* Right Column: Auth Form Card */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex justify-center mb-6">
            <Logo />
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            {children}
          </div>

          <div className="text-center text-[11px] text-slate-400">
            PromptFence &copy; {new Date().getFullYear()} &middot; AI Application Security Lab
          </div>
        </div>
      </div>
    </div>
  );
}
