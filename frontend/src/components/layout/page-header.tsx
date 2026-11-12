import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">{description}</p>}
      </div>
      {children && <div className="flex items-center space-x-3">{children}</div>}
    </div>
  );
}

export function PageActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center space-x-3">{children}</div>;
}

