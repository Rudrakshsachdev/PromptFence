import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAFA] text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans antialiased relative">
      {/* Background delicate dot grid pattern with radial fade */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70"
        aria-hidden="true"
      />

      {/* Top minimal navigation header */}
      <header className="relative z-20 w-full border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            aria-label="PromptFence Home"
          >
            <div className="relative flex shrink-0 items-center justify-center">
              <Image
                src="/brand/promptfence-mark.png"
                alt="PromptFence Logo"
                width={28}
                height={36}
                className="h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                priority
              />
            </div>
            <span className="text-[17px] sm:text-[18px] font-extrabold tracking-tight text-neutral-950 select-none">
              PromptFence
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
              Lab v3.0
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors rounded-md px-2.5 py-1.5 border border-transparent hover:border-neutral-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to website</span>
          </Link>
        </div>
      </header>

      {/* Centered card container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16 sm:px-6">
        {children}
      </main>

      {/* Clean minimal footer */}
      <footer className="relative z-20 w-full border-t border-neutral-200/60 bg-white/70 backdrop-blur-xs py-5 text-xs text-neutral-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center sm:text-left text-neutral-500">
            © 2026 PromptFence. AI Application Security Testing Lab. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-neutral-500">
            <Link href="/" className="transition-colors hover:text-neutral-900">
              Overview
            </Link>
            <Link href="/#features" className="transition-colors hover:text-neutral-900">
              Capabilities
            </Link>
            <Link href="/#research" className="transition-colors hover:text-neutral-900">
              Research
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
