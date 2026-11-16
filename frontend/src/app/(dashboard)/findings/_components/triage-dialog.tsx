'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormField } from '@/components/forms/form-field';
import { FindingStatusBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useChangeFindingStatus } from '@/hooks/use-findings';
import { errorMessage } from '@/lib/format';
import { FINDING_STATUS_META } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { FindingStatus } from '@/types/finding';

/**
 * Mirrors the backend triage rules (findings_service): allowed transitions per
 * status, and statuses that require a written rationale. A review date is only
 * persisted for ACCEPTED_RISK.
 */
export const ALLOWED_TRANSITIONS: Record<FindingStatus, FindingStatus[]> = {
  OPEN: ['ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE', 'ACCEPTED_RISK'],
  ACKNOWLEDGED: ['OPEN', 'RESOLVED', 'FALSE_POSITIVE', 'ACCEPTED_RISK'],
  RESOLVED: ['OPEN'],
  FALSE_POSITIVE: ['OPEN'],
  ACCEPTED_RISK: ['OPEN', 'RESOLVED'],
};
export const RATIONALE_REQUIRED: FindingStatus[] = ['RESOLVED', 'FALSE_POSITIVE', 'ACCEPTED_RISK'];

const STATUS_HELP: Record<FindingStatus, string> = {
  OPEN: 'Active vulnerability requiring triage.',
  ACKNOWLEDGED: 'Reviewed and confirmed by a researcher.',
  RESOLVED: 'Mitigated or patched; verify with a re-run.',
  FALSE_POSITIVE: 'Benign behaviour or misclassification.',
  ACCEPTED_RISK: 'Documented business acceptance with a review date.',
};

export function TriageDialog({
  findingId,
  currentStatus,
  open,
  onOpenChange,
}: {
  findingId: string;
  currentStatus: FindingStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useChangeFindingStatus(findingId);
  const options = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  const [status, setStatus] = useState<FindingStatus | ''>('');
  const [rationale, setRationale] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStatus(options[0] ?? '');
      setRationale('');
      setReviewDate('');
      setSubmitted(false);
      setServerError(null);
    }
    // options derive from currentStatus; reset only when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStatus]);

  const needsRationale = !!status && RATIONALE_REQUIRED.includes(status);
  const trimmed = rationale.trim();
  const rationaleError =
    needsRationale && trimmed.length === 0
      ? `A rationale is required when marking a finding ${FINDING_STATUS_META[status as FindingStatus].label.toLowerCase()}.`
      : null;
  const today = new Date().toISOString().slice(0, 10);
  const reviewDateError = status === 'ACCEPTED_RISK' && reviewDate && reviewDate < today ? 'Review date must be in the future.' : null;
  const statusError = !status ? 'Select a new status.' : null;
  const invalid = !!(statusError || rationaleError || reviewDateError);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (invalid || !status) return;
    try {
      await mutation.mutateAsync({
        status,
        rationale: trimmed || undefined,
        review_date: status === 'ACCEPTED_RISK' && reviewDate ? new Date(reviewDate).toISOString() : undefined,
      });
      toast.success(`Finding marked ${FINDING_STATUS_META[status].label.toLowerCase()}`);
      onOpenChange(false);
    } catch (err) {
      setServerError(errorMessage(err, 'Failed to update status'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Triage finding</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Current status <FindingStatusBadge status={currentStatus} />
            </DialogDescription>
          </DialogHeader>

          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-xs font-medium text-foreground">New status</legend>
            <div className="grid gap-1.5" role="radiogroup">
              {options.map((s) => {
                const active = status === s;
                return (
                  <label
                    key={s}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors',
                      active ? 'border-primary/50 bg-primary/[0.06]' : 'border-border hover:border-border-strong',
                    )}
                  >
                    <input
                      type="radio"
                      name="finding-status"
                      value={s}
                      checked={active}
                      onChange={() => setStatus(s)}
                      className="mt-0.5 accent-[hsl(var(--primary))]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <FindingStatusBadge status={s} />
                        {RATIONALE_REQUIRED.includes(s) && (
                          <span className="text-[10px] uppercase tracking-wide text-subtle-foreground">
                            rationale required
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{STATUS_HELP[s]}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {submitted && statusError && <p className="text-[11px] font-medium text-critical">{statusError}</p>}
          </fieldset>

          <FormField
            id="triage-rationale"
            label="Rationale"
            required={needsRationale}
            error={submitted ? rationaleError ?? undefined : undefined}
            description={
              needsRationale
                ? 'Recorded in the immutable status history.'
                : 'Optional. Recorded in the status history.'
            }
          >
            <Textarea
              id="triage-rationale"
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Reasoning, compensating controls, or verification performed…"
              aria-invalid={submitted && !!rationaleError}
              maxLength={2000}
            />
          </FormField>

          {status === 'ACCEPTED_RISK' && (
            <FormField
              id="triage-review-date"
              label="Scheduled review date"
              error={reviewDateError ?? undefined}
              description="Optional. When this accepted risk should be re-evaluated."
            >
              <Input
                id="triage-review-date"
                type="date"
                min={today}
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                aria-invalid={!!reviewDateError}
                className="w-48"
              />
            </FormField>
          )}

          {serverError && (
            <p role="alert" className="rounded-md border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending || options.length === 0}>
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Update status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
