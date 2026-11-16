'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function LandingCta() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="border-t border-neutral-200 bg-neutral-50/50 py-20 px-4 sm:px-6 lg:px-8 text-center">
      <div className="mx-auto max-w-3xl space-y-6">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950">
          Secure your AI pipelines today.
        </h2>
        <p className="mx-auto max-w-xl text-sm sm:text-base text-neutral-600 leading-relaxed">
          Start testing your LLM applications against real-world adversarial attacks,
          canary exposure, and unauthorized tool execution in under 5 minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href={isAuthenticated ? '/overview' : '/login'}
            className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-7 text-xs font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Login to PromptFence'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="#research"
            className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg border border-neutral-200 bg-white px-7 text-xs font-semibold text-neutral-700 shadow-2xs transition-all hover:bg-neutral-50 hover:text-neutral-950 hover:border-neutral-300"
          >
            <span>Read Research Whitepaper</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
