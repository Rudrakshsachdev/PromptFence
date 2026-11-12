import React from 'react';
import { Logo } from '@/components/shared/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          {children}
        </div>
        <div className="text-center mt-6 text-xs text-slate-500">
          PromptFence AI Application Security Testing Lab &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

