import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans antialiased relative">
      {/* Top minimal navigation header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
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
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      {/* Centered card container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-14 sm:px-6">
        {children}
      </main>

      {/* Clean minimal footer */}
      <footer className="w-full border-t border-neutral-200/60 bg-white py-6 text-xs text-neutral-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} PromptFence. AI Application Security Testing Lab.</p>
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
