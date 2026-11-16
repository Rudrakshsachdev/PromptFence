import React from 'react';
import { Fingerprint, GitCompareArrows, ShieldAlert } from 'lucide-react';
import { Logo, LogoMark } from '@/components/shared/logo';

const CAPABILITIES = [
  {
    icon: ShieldAlert,
    title: 'Adversarial scenario testing',
    body: 'Run prompt injection, data disclosure and tool-abuse scenarios against LLM, RAG and agent endpoints.',
  },
  {
    icon: Fingerprint,
    title: 'Canary tainting & provenance',
    body: 'Session-bound, HMAC-verified canary tokens trace leaked context back to its instrumented source.',
  },
  {
    icon: GitCompareArrows,
    title: 'Regression & evidence',
    body: 'Compare runs against immutable baselines and export evidence reports for review.',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-sidebar p-10 lg:flex xl:p-14">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

        <div className="relative">
          <Logo href="/login" />
        </div>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <LogoMark className="h-5 w-5" />
            </span>
            <p className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
              Security testing for applications built on large language models.
            </p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Identify, investigate and monitor vulnerabilities across models, retrieval pipelines, agents and the
              tools they call.
            </p>
          </div>

          <ul className="space-y-4">
            {CAPABILITIES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-info">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[11px] text-subtle-foreground">
          PromptFence · LLM Security Platform
        </p>
      </aside>

      {/* Form column */}
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo href="/login" />
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-panel sm:p-8">{children}</div>
          <p className="mt-6 text-center text-[11px] text-subtle-foreground">
            PromptFence &copy; {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  );
}
