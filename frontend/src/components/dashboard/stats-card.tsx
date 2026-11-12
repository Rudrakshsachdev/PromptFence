import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border border-slate-200/80 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {value}
              </h3>
              {trend && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded dark:bg-emerald-950/40 dark:text-emerald-400">
                  {trend}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-600 transition-colors group-hover:border-teal-200 group-hover:bg-teal-50 group-hover:text-teal-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:group-hover:bg-teal-950/50 dark:group-hover:text-teal-400">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
