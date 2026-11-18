'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface AnimatedWord {
  text: string;
  gradientClass: string;
}

const HERO_WORDS: AnimatedWord[] = [
  {
    text: 'Test.',
    gradientClass: 'from-[#2563EB] to-[#06B6D4]', // Blue to cyan
  },
  {
    text: 'Trace.',
    gradientClass: 'from-[#7C3AED] to-[#EC4899]', // Purple to pink
  },
  {
    text: 'Secure.',
    gradientClass: 'from-[#F97316] to-[#FACC15]', // Orange to yellow
  },
];

export function LandingHero() {
  const { isAuthenticated } = useAuth();
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  useEffect(() => {
    // Respect user's motion preferences
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      if (prefersReducedMotion) return;
    }

    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % HERO_WORDS.length);
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex flex-col items-center justify-center pt-20 pb-16 sm:pt-28 sm:pb-24 text-center px-4 sm:px-6">
      {/* Top Release Pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1 text-xs font-medium text-neutral-800 shadow-2xs mb-8 transition-all hover:border-neutral-300">
        <span className="flex h-2 w-2 rounded-full bg-[#2563EB] animate-pulse" />
        <span className="font-semibold text-neutral-900">PromptFence 3.0</span>
        <span className="text-neutral-400">•</span>
        <span className="text-neutral-600">Dynamic Canary Tainting & Provenance Tracing</span>
        <ArrowRight className="h-3 w-3 text-neutral-400" />
      </div>

      {/* Main Hero Headline with Vercel-Style Rotating Gradient Highlight */}
      <h1
        aria-label="Test. Trace. Secure."
        className="flex flex-col items-center justify-center select-none"
      >
        {HERO_WORDS.map((item, index) => {
          const isActive = activeWordIndex === index;
          return (
            <div
              key={item.text}
              className="relative inline-flex items-center justify-center"
            >
              {/* Inactive Base Layer: Solid Black */}
              <span
                className={`block font-black tracking-[-0.05em] text-neutral-950 transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                  fontSize: 'clamp(3.75rem, 11vw, 9.75rem)',
                  lineHeight: 0.92,
                }}
              >
                {item.text}
              </span>

              {/* Active Layer: Vibrant Gradient Overlay */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 block font-black tracking-[-0.05em] bg-gradient-to-r ${
                  item.gradientClass
                } bg-clip-text text-transparent pointer-events-none transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  fontSize: 'clamp(3.75rem, 11vw, 9.75rem)',
                  lineHeight: 0.92,
                }}
              >
                {item.text}
              </span>
            </div>
          );
        })}
      </h1>

      {/* Primary Action Buttons */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <Link
          href="#platform"
          className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-lg bg-neutral-950 px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          <span>Explore Platform</span>
        </Link>
        <Link
          href={isAuthenticated ? '/overview' : '/auth/login'}
          className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-lg border border-neutral-200 bg-white px-8 text-sm font-semibold text-neutral-700 shadow-2xs transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          <span>{isAuthenticated ? 'Go to Dashboard' : 'Login to PromptFence'}</span>
        </Link>
      </div>

      {/* Supporting Headline & Description */}
      <div className="mt-12 max-w-2xl mx-auto space-y-3">
        <p className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
          Find vulnerabilities before attackers do.
        </p>
        <p className="text-sm sm:text-base text-neutral-500 font-normal leading-relaxed">
          Test LLM-integrated applications, trace sensitive information flows, and secure
          AI-powered systems with advanced security testing and provenance analysis.
        </p>
      </div>
    </section>
  );
}
