import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4 dark:bg-slate-800">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6 dark:text-slate-400">{description}</p>
      {actionText && actionHref && (
        <Button asChild size="sm">
          <Link href={actionHref}>{actionText}</Link>
        </Button>
      )}
      {actionText && !actionHref && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

