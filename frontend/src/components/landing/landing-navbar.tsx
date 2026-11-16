'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Menu, X, ArrowRight, LayoutDashboard, LogIn } from 'lucide-react';

export function LandingNavbar() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 sm:gap-3 rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          aria-label="PromptFence Home"
        >
          <div className="relative flex shrink-0 items-center justify-center">
            <Image
              src="/brand/promptfence-mark.png"
              alt="PromptFence Logo"
              width={38}
              height={50}
              className="h-9 sm:h-[38px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              priority
            />
          </div>
          <span className="text-[19px] sm:text-[20px] font-extrabold tracking-tight text-neutral-950 select-none">
            PromptFence
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-950"
          >
            Features
          </Link>
          <Link
            href="#platform"
            className="text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-950"
          >
            Platform
          </Link>
          <Link
            href="#workflow"
            className="text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-950"
          >
            Workflow
          </Link>
          <Link
            href="#research"
            className="text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-950"
          >
            Research
          </Link>
          <Link
            href="#metrics"
            className="text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-950"
          >
            Metrics
          </Link>
        </nav>

        {/* Right CTA / Auth controls */}
        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated ? (
            <Link
              href="/overview"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-neutral-950 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Go to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-70" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-950"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-950 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-neutral-200 bg-white px-4 py-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-950"
            >
              Features
            </Link>
            <Link
              href="#platform"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-950"
            >
              Platform
            </Link>
            <Link
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-950"
            >
              Workflow
            </Link>
            <Link
              href="#research"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-950"
            >
              Research
            </Link>
            <Link
              href="#metrics"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-950"
            >
              Metrics
            </Link>
            <div className="mt-2 border-t border-neutral-100 pt-3">
              {isAuthenticated ? (
                <Link
                  href="/overview"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-950 py-2.5 text-xs font-semibold text-white shadow-sm"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white py-2 text-xs font-semibold text-neutral-900"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-950 py-2 text-xs font-semibold text-white"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
