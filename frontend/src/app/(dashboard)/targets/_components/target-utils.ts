import type { TestRun } from '@/types/test-run';

/** Header / field names that carry credentials and must never render in plaintext. */
const SENSITIVE_KEY_RE =
  /(auth|token|secret|password|passwd|api[-_]?key|x-api-key|cookie|session|credential|bearer|private)/i;

export const MASK = '••••••••';

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_RE.test(key);
}

/** Recursively replaces values under sensitive keys with a fixed mask (display only). */
export function maskSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        isSensitiveKey(k) && v !== null && v !== '' ? MASK : maskSecrets(v),
      ]),
    );
  }
  return value;
}

export const AUTH_TYPE_LABELS: Record<string, string> = {
  NONE: 'None',
  BEARER: 'Bearer token',
  API_KEY: 'API key header',
  BASIC: 'Basic auth',
};

/**
 * Builds a map of entity id → most recent run from a list of runs.
 * Used to derive "last run" columns from one bounded fetch instead of N requests.
 */
export function latestRunBy(runs: TestRun[] | undefined, key: 'target_id' | 'test_suite_id') {
  const map = new Map<string, TestRun>();
  for (const run of runs ?? []) {
    const id = run[key];
    if (!id) continue;
    const ts = new Date(run.started_at ?? run.created_at).getTime();
    const current = map.get(id);
    if (!current || ts > new Date(current.started_at ?? current.created_at).getTime()) {
      map.set(id, run);
    }
  }
  return map;
}
