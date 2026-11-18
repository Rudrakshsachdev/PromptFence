/** Mirrors backend/app/schemas/security.py (GET /api/v1/security/overview). */
export interface SecurityOverview {
  runs: {
    total: number;
    /** Every TestRunStatus is present (0 when none). */
    by_status: Record<string, number>;
    /** Distinct targets with at least one recorded execution. */
    assessed_targets: number;
  };
  findings: {
    total: number;
    /** Every FindingStatus is present (0 when none). */
    by_status: Record<string, number>;
    by_severity: Record<string, number>;
    open_by_severity: Record<string, number>;
  };
  top_targets: {
    target_id: string;
    target_name: string;
    findings: number;
    open_findings: number;
    critical: number;
    high: number;
  }[];
  categories: { category: string; findings: number; open_findings: number }[];
  recent_status_changes: {
    finding_id: string;
    finding_title: string;
    severity: string;
    old_status: string;
    new_status: string;
    changed_at: string;
  }[];
}
