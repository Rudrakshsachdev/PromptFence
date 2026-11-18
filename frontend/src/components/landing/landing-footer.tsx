'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-xs text-neutral-500">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-neutral-100">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex shrink-0 items-center justify-center">
              <Image
                src="/brand/promptfence-mark.png"
                alt="PromptFence Logo"
                width={24}
                height={31}
                className="h-7 w-auto object-contain opacity-90 transition-opacity group-hover:opacity-100"
              />
            </div>
            <span className="font-bold text-neutral-950 tracking-tight text-sm">
              PromptFence
            </span>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-500 text-xs">
              AI Application Security Testing Lab
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="#features" className="hover:text-neutral-900 transition-colors">
              Features
            </Link>
            <Link href="#platform" className="hover:text-neutral-900 transition-colors">
              Platform
            </Link>
            <Link href="#workflow" className="hover:text-neutral-900 transition-colors">
              Workflow
            </Link>
            <Link href="#research" className="hover:text-neutral-900 transition-colors">
              Research
            </Link>
            <Link href="#metrics" className="hover:text-neutral-900 transition-colors">
              Metrics
            </Link>
            <Link href="/auth/login" className="hover:text-neutral-900 transition-colors font-medium">
              Login
            </Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} PromptFence. All rights reserved.</p>
          <p className="text-neutral-400">
            Dynamic Session-Bound Canary Tainting & Provenance Tracing
          </p>
        </div>
      </div>
    </footer>
  );
}
