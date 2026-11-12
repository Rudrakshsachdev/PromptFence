'use client';

import React from 'react';
import { ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Platform Settings & Diagnostics"
        description="Environment configuration, security parameters, and Phase 1 runtime attributes."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-teal-600" /> Security Controls Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Outbound SSRF Validation:</span>
              <span className="text-emerald-600 font-semibold">Active (Loopback & Metadata blocked)</span>
            </div>
            <Separator />
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Password Hashing Algorithm:</span>
              <span className="font-mono text-slate-900 dark:text-white">Argon2id (RFC 9106)</span>
            </div>
            <Separator />
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Cookie Security Mode:</span>
              <span className="font-mono text-slate-900 dark:text-white">HttpOnly, SameSite=Lax</span>
            </div>
            <Separator />
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Token Rotation & Family Tracking:</span>
              <span className="text-emerald-600 font-semibold">Enabled (Reuse detection armed)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center">
              <Terminal className="h-4 w-4 mr-2 text-teal-600" /> Platform Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Frontend Tier:</span>
              <span className="font-mono text-slate-900 dark:text-white">Next.js 14 App Router (Port 3000)</span>
            </div>
            <Separator />
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Backend Tier:</span>
              <span className="font-mono text-slate-900 dark:text-white">FastAPI with Uvicorn (Port 8000)</span>
            </div>
            <Separator />
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Database Engine:</span>
              <span className="font-mono text-slate-900 dark:text-white">PostgreSQL 16 with SQLAlchemy 2.0</span>
            </div>
            <Separator />
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Phase 2 Extension Points:</span>
              <span className="text-teal-600 font-semibold">Canary Tainting & Provenance Tracing</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

