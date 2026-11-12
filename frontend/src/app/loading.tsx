import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center space-y-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-teal-400 shadow-md">
          <ShieldAlert className="h-5 w-5 animate-pulse" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500"></span>
          </span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            PromptFence
          </p>
          <p className="text-[10px] font-mono text-slate-400">Loading security lab...</p>
        </div>
      </div>
    </div>
  );
}
