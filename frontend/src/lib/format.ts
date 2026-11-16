/**
 * Presentation formatting helpers. Pure functions, no React.
 * Date helpers `formatDate` / `formatRelativeTime` live in `@/lib/utils` for
 * backwards compatibility and are re-exported here.
 */
export { formatDate, formatRelativeTime } from '@/lib/utils';

/** "PROMPT_INJECTION" → "Prompt injection" (sentence case). */
export function humanize(value: string | null | undefined): string {
  if (!value) return '—';
  const words = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** First n characters of an identifier (UUIDs, hashes). */
export function shortId(id: string | null | undefined, length = 8): string {
  if (!id) return '—';
  return id.length > length ? id.slice(0, length) : id;
}

export function formatNumber(value: number | null | undefined, maxFractionDigits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFractionDigits }).format(value);
}

/** Formats a value that is already a percentage (0–100). */
export function formatPercent(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(fractionDigits)}%`;
}

/** Formats a ratio (0–1) as a percentage. */
export function formatRatio(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 2 : 1)}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes}m ${rem}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/** Duration between two ISO timestamps; if `end` is missing and `live`, measures to now. */
export function durationBetween(
  start: string | null | undefined,
  end: string | null | undefined,
  live = false,
): number | null {
  if (!start) return null;
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : live ? Date.now() : NaN;
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return Math.max(0, endMs - startMs);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** Compact timestamp for technical tables: "2026-11-16 09:25:03". */
export function formatTimestamp(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Time-only with milliseconds for event streams: "09:25:03.412". */
export function formatTimeMs(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(
    date.getMilliseconds(),
    3,
  )}`;
}

/** Message from an unknown thrown value (ApiError, Error, string). */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) return fallback;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'string') return error;
  return fallback;
}
