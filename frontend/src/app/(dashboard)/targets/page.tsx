'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Copy,
  Crosshair,
  ExternalLink,
  Filter,
  MoreVertical,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SearchInput } from '@/components/forms/search-input';
import { PageActions, PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { useDeleteTarget, useTargets, useValidateTarget } from '@/hooks/use-targets';
import { formatDate } from '@/lib/utils';
import { Target } from '@/types/target';
import { toast } from 'sonner';

export default function TargetsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 250);

  const { data, isLoading, refetch, isRefetching } = useTargets(page, 50);
  const deleteMutation = useDeleteTarget();
  const [targetToDelete, setTargetToDelete] = useState<Target | null>(null);
  const [validatingTargetId, setValidatingTargetId] = useState<string | null>(null);

  // Client-side filtering
  const allItems = data?.items || [];
  const filteredTargets = allItems.filter((t) => {
    const matchesSearch = debouncedSearch
      ? t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.base_url.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.endpoint.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true;

    const matchesType = typeFilter === 'ALL' || t.target_type === typeFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && t.is_active) ||
      (statusFilter === 'INACTIVE' && !t.is_active);

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Endpoint URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="AI Application Targets"
        description="Register and manage external AI APIs, chat systems, and agent endpoints for adversarial security evaluation."
        badge={
          <Badge variant="outline" className="text-xs font-mono font-medium bg-slate-100 text-slate-700">
            {allItems.length} Registered
          </Badge>
        }
      >
        <PageActions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8 text-xs text-slate-600"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild size="sm" className="h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs">
            <Link href="/targets/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Register Target
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Search targets by name or endpoint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Architecture Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px] bg-white border-slate-200">
              <SelectValue placeholder="Architecture" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Architectures</SelectItem>
              <SelectItem value="CHAT_API">Chat API</SelectItem>
              <SelectItem value="COMPLETION_API">Completion API</SelectItem>
              <SelectItem value="AGENT_API">AI Agent</SelectItem>
              <SelectItem value="CUSTOM">Custom API</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[110px] bg-white border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Targets Table */}
      <Card className="border border-slate-200/80 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : filteredTargets.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={Crosshair}
                title="No targets match the criteria"
                description={
                  searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'Try adjusting your search queries or filter parameters.'
                    : 'Get started by connecting an AI API endpoint or LLM application.'
                }
                actionText={
                  searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? 'Clear Filters'
                    : 'Register First Target'
                }
                onAction={
                  searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? () => {
                        setSearchTerm('');
                        setTypeFilter('ALL');
                        setStatusFilter('ALL');
                      }
                    : undefined
                }
                actionHref={
                  searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                    ? undefined
                    : '/targets/new'
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Target Identity</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Architecture</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Destination Endpoint</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Authentication</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Created</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTargets.map((target) => {
                  const fullUrl = `${target.base_url}${target.endpoint}`;
                  return (
                    <TableRow key={target.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Description */}
                      <TableCell className="max-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Crosshair className="h-3.5 w-3.5 text-teal-600" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/targets/${target.id}`}
                              className="font-semibold text-xs text-slate-900 hover:text-teal-600 transition-colors truncate block"
                            >
                              {target.name}
                            </Link>
                            {target.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {target.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {target.target_type}
                        </span>
                      </TableCell>

                      {/* Endpoint with Copy Button */}
                      <TableCell className="max-w-[240px]">
                        <div className="flex items-center gap-1.5 group">
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            <span className="font-bold text-teal-600 mr-1">{target.http_method}</span>
                            {target.endpoint}
                          </span>
                          <button
                            onClick={() => handleCopy(fullUrl, target.id)}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-100"
                            title="Copy full endpoint URL"
                          >
                            {copiedId === target.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      {/* Auth */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono px-1.5 py-0 bg-slate-50 text-slate-600 border-slate-200"
                        >
                          {target.authentication_type}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge isActive={target.is_active} />
                      </TableCell>

                      {/* Created */}
                      <TableCell className="text-right text-[11px] font-mono text-slate-400">
                        {formatDate(target.created_at)}
                      </TableCell>

                      {/* Action Dropdown */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400">
                              Target Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/targets/${target.id}`} className="cursor-pointer">
                                <ExternalLink className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                <span>Inspect Details</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/targets/${target.id}/edit`} className="cursor-pointer">
                                <Wrench className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                <span>Edit Configuration</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setTargetToDelete(target)}
                              className="cursor-pointer text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5 text-red-500" />
                              <span>Delete Target</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!targetToDelete}
        onOpenChange={(open) => !open && setTargetToDelete(null)}
        title="Delete AI Target?"
        description={`Are you sure you want to delete "${targetToDelete?.name}"? All associated configuration versions will be permanently removed. Historical test runs will retain immutable execution records.`}
        confirmText="Delete Target"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (targetToDelete) {
            deleteMutation.mutate(targetToDelete.id, {
              onSuccess: () => {
                setTargetToDelete(null);
                toast.success('Target deleted successfully');
              },
            });
          }
        }}
      />
    </div>
  );
}
