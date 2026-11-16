'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  Crosshair,
  CornerDownLeft,
  FilePlus2,
  Layers,
  LibraryBig,
  Loader2,
  Plus,
  Play,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { ALL_NAV_ITEMS } from '@/constants/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { shortId } from '@/lib/format';
import { getRunStatusMeta, getSeverityMeta } from '@/lib/status';
import { cn } from '@/lib/utils';
import { findingService } from '@/services/finding.service';
import { scenarioService } from '@/services/scenario.service';
import { targetService } from '@/services/target.service';
import { testRunService } from '@/services/test-run.service';
import { testSuiteService } from '@/services/test-suite.service';

interface PaletteItem {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ElementType;
  keywords?: string;
}

const ACTIONS: PaletteItem[] = [
  { id: 'a-run', group: 'Actions', title: 'Launch test run', href: '/test-runs/new', icon: Play, keywords: 'execute start scan' },
  { id: 'a-target', group: 'Actions', title: 'Register target', href: '/targets/new', icon: Plus, keywords: 'add endpoint api' },
  { id: 'a-suite', group: 'Actions', title: 'Create test suite', href: '/test-suites/new', icon: Plus },
  { id: 'a-scenario', group: 'Actions', title: 'Create scenario', href: '/scenarios/new', icon: Plus, keywords: 'attack prompt' },
  { id: 'a-report', group: 'Actions', title: 'Generate report', href: '/reports', icon: FilePlus2, keywords: 'export pdf csv json' },
];

/** Global ⌘K / Ctrl+K palette: pages, actions, and live search across workspace entities. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(query.trim(), 250);

  // Entity sources load only while the palette is open; keys match page hooks so cache is shared.
  const targets = useQuery({
    queryKey: ['targets', 1, 100],
    queryFn: () => targetService.getTargets(1, 100),
    enabled: open,
    staleTime: 60_000,
  });
  const suites = useQuery({
    queryKey: ['test-suites', 1, 100],
    queryFn: () => testSuiteService.getSuites(1, 100),
    enabled: open,
    staleTime: 60_000,
  });
  const scenarios = useQuery({
    queryKey: ['scenarios', { page: 1, pageSize: 100 }],
    queryFn: () => scenarioService.getScenarios({ page: 1, pageSize: 100 }),
    enabled: open,
    staleTime: 60_000,
  });
  const runs = useQuery({
    queryKey: ['test-runs', { page: 1, page_size: 25 }],
    queryFn: () => testRunService.listTestRuns({ page: 1, page_size: 25 }),
    enabled: open,
    staleTime: 30_000,
  });
  const findings = useQuery({
    queryKey: ['findings', { search: debounced, page: 1, page_size: 6 }],
    queryFn: () => findingService.listFindings({ search: debounced, page: 1, page_size: 6 }),
    enabled: open && debounced.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (i: PaletteItem) =>
      !q || `${i.title} ${i.subtitle ?? ''} ${i.keywords ?? ''}`.toLowerCase().includes(q);

    const pages: PaletteItem[] = ALL_NAV_ITEMS.map((n) => ({
      id: `p-${n.href}`,
      group: 'Pages',
      title: n.title,
      subtitle: n.description,
      href: n.href,
      icon: n.icon,
    }));

    const entityLimit = q ? 6 : 0; // entities appear only once the user types
    const entities: PaletteItem[] = q
      ? [
          ...(targets.data?.items ?? []).map((t) => ({
            id: `t-${t.id}`,
            group: 'Targets',
            title: t.name,
            subtitle: `${t.base_url}${t.endpoint}`,
            href: `/targets/${t.id}`,
            icon: Crosshair,
          })),
          ...(suites.data?.items ?? []).map((s) => ({
            id: `s-${s.id}`,
            group: 'Test Suites',
            title: s.name,
            subtitle: `${s.scenario_count} scenarios`,
            href: `/test-suites/${s.id}`,
            icon: Layers,
          })),
          ...(scenarios.data?.items ?? []).map((s) => ({
            id: `sc-${s.id}`,
            group: 'Scenarios',
            title: s.name,
            subtitle: getSeverityMeta(s.severity).label,
            href: `/scenarios/${s.id}`,
            icon: LibraryBig,
          })),
          ...(runs.data?.items ?? []).map((r) => ({
            id: `r-${r.id}`,
            group: 'Test Runs',
            title: `Run ${shortId(r.id)}`,
            subtitle: `${r.target?.name ?? r.execution_snapshot?.target?.name ?? 'Unknown target'} · ${getRunStatusMeta(r.status).label}`,
            href: `/test-runs/${r.id}`,
            icon: Activity,
            keywords: `${r.id} ${r.test_suite?.name ?? ''}`,
          })),
        ]
      : [];

    const findingItems: PaletteItem[] = (findings.data?.items ?? []).map((f) => ({
      id: `f-${f.id}`,
      group: 'Findings',
      title: f.title,
      subtitle: `${getSeverityMeta(f.severity).label} · ${shortId(f.id)}`,
      href: `/findings/${f.id}`,
      icon: ShieldAlert,
    }));

    const grouped = new Map<string, PaletteItem[]>();
    for (const i of [...ACTIONS.filter(match), ...pages.filter(match), ...entities.filter(match)]) {
      const list = grouped.get(i.group) ?? [];
      if (i.group === 'Actions' || i.group === 'Pages' || list.length < entityLimit) list.push(i);
      grouped.set(i.group, list);
    }
    if (findingItems.length) grouped.set('Findings', findingItems);
    return Array.from(grouped.values()).flat();
  }, [query, targets.data, suites.data, scenarios.data, runs.data, findings.data]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const go = (item: PaletteItem | undefined) => {
    if (!item) return;
    onOpenChange(false);
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(items[activeIndex]);
    }
  };

  const isSearching =
    open && query.trim().length > 0 && (targets.isLoading || suites.isLoading || scenarios.isLoading || runs.isLoading || findings.isFetching);

  let lastGroup = '';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-popover shadow-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]"
          onKeyDown={onKeyDown}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <div className="flex items-center gap-2.5 border-b border-border px-3.5">
            {isSearching ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-subtle-foreground" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-subtle-foreground" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, targets, runs, findings…"
              className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-list"
              aria-activedescendant={items[activeIndex] ? `cp-${items[activeIndex].id}` : undefined}
            />
            <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-subtle-foreground sm:block">
              ESC
            </kbd>
          </div>
          <div ref={listRef} id="command-palette-list" role="listbox" className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5">
            {items.length === 0 ? (
              <p className="px-3 py-10 text-center text-[13px] text-muted-foreground">
                No results for “{query}”
              </p>
            ) : (
              items.map((item, idx) => {
                const showGroup = item.group !== lastGroup;
                lastGroup = item.group;
                const Icon = item.icon;
                const active = idx === activeIndex;
                return (
                  <React.Fragment key={item.id}>
                    {showGroup && (
                      <p className="px-2.5 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
                        {item.group}
                      </p>
                    )}
                    <div
                      id={`cp-${item.id}`}
                      role="option"
                      aria-selected={active}
                      data-index={idx}
                      onMouseMove={() => setActiveIndex(idx)}
                      onClick={() => go(item)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2',
                        active ? 'bg-surface text-foreground' : 'text-foreground/90',
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-subtle-foreground')} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{item.title}</p>
                        {item.subtitle && (
                          <p className="truncate text-[11px] text-muted-foreground">{item.subtitle}</p>
                        )}
                      </div>
                      {active && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-subtle-foreground" />}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-border bg-surface/40 px-3.5 py-2 text-[11px] text-subtle-foreground">
            <span className="flex items-center gap-1">
              <kbd className="font-mono">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> open
            </span>
            {query.trim().length > 0 && query.trim().length < 2 && (
              <span className="ml-auto">Type 2+ characters to search findings</span>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
