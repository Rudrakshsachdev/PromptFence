import React from 'react';
import { TONE_CLASSES, type Tone } from '@/lib/status';
import { cn } from '@/lib/utils';

/** Labeled 0–100 meter for rates (pass rate, coverage, exposure rate). */
export function Meter({
  label,
  value,
  tone = 'accent',
  valueLabel,
  hint,
  className,
}: {
  label: React.ReactNode;
  /** 0–100; null renders "Not measured". */
  value: number | null | undefined;
  tone?: Tone;
  valueLabel?: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  const measured = value !== null && value !== undefined && !Number.isNaN(value);
  const pct = measured ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="truncate text-xs text-muted-foreground">{label}</span>
        {measured ? (
          <span className="shrink-0 font-mono text-[13px] tabular-nums text-foreground">
            {valueLabel ?? `${pct.toFixed(1)}%`}
          </span>
        ) : (
          <span className="shrink-0 text-xs italic text-subtle-foreground">Not measured</span>
        )}
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={measured ? pct : undefined}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        {measured && (
          <div className={cn('h-full rounded-full', TONE_CLASSES[tone].bar)} style={{ width: `${pct}%` }} />
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] leading-snug text-subtle-foreground">{hint}</p>}
    </div>
  );
}

/** Large security-score readout with grade. Score is 0–100. */
export function ScoreDial({
  score,
  grade,
  size = 120,
  caption,
}: {
  score: number | null | undefined;
  grade?: string | null;
  size?: number;
  caption?: React.ReactNode;
}) {
  const measured = score !== null && score !== undefined && !Number.isNaN(score);
  const value = measured ? Math.max(0, Math.min(100, score)) : 0;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75; // 270° gauge
  const filled = arc * (value / 100);
  const color = !measured ? '#64748B' : value >= 80 ? '#34D399' : value >= 60 ? '#FBBF24' : '#F87171';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[135deg]" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#263449"
            strokeWidth={stroke}
            strokeDasharray={`${arc} ${c}`}
            strokeLinecap="round"
          />
          {measured && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={`${filled} ${c}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {measured ? (
            <>
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {Math.round(value)}
              </span>
              {grade && <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">Grade {grade}</span>}
            </>
          ) : (
            <span className="text-xs italic text-subtle-foreground">Not measured</span>
          )}
        </div>
      </div>
      {caption && <div className="mt-1 text-center text-[11px] text-subtle-foreground">{caption}</div>}
    </div>
  );
}
