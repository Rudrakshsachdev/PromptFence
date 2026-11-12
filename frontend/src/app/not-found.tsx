import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full p-8 border border-slate-200 rounded-xl bg-white text-card-foreground shadow-2xs text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mx-auto">
          <ShieldAlert className="h-6 w-6 text-slate-600" />
        </div>
        <div className="space-y-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">404</span>
          <h3 className="text-base font-bold text-slate-800">Resource Not Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            The target URL, scenario, or dashboard page does not exist or has been relocated.
          </p>
        </div>
        <div className="pt-2">
          <Button asChild size="sm" className="w-full h-9 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white">
            <Link href="/overview">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Return to Overview
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
