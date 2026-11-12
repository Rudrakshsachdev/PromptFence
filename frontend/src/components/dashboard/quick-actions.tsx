import React from 'react';
import Link from 'next/link';
import { Crosshair, FolderKanban, Plus, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuickActions() {
  const actions = [
    {
      title: 'Register AI Target',
      description: 'Connect and configure a new external AI application or agent endpoint.',
      href: '/targets/new',
      icon: Crosshair,
    },
    {
      title: 'Create Test Suite',
      description: 'Assemble an adversarial evaluation suite for security regression testing.',
      href: '/test-suites/new',
      icon: FolderKanban,
    },
    {
      title: 'Author Scenario',
      description: 'Design a targeted prompt injection or data disclosure attack case.',
      href: '/scenarios/new',
      icon: ShieldAlert,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              className="p-4 rounded-lg border border-slate-200 hover:border-teal-500 hover:shadow-sm transition-all group flex flex-col justify-between dark:border-slate-800"
            >
              <div>
                <div className="h-8 w-8 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors dark:bg-teal-950 dark:text-teal-400">
                  <Icon className="h-4 w-4" />
                </div>
                <h5 className="font-semibold text-sm text-slate-900 group-hover:text-teal-600 transition-colors dark:text-white">
                  {act.title}
                </h5>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 dark:text-slate-400">
                  {act.description}
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-teal-600 group-hover:translate-x-1 transition-transform">
                Get started <Plus className="h-3.5 w-3.5 ml-1" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

