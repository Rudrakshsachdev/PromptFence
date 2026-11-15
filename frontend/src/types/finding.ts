/**
 * Security Finding types for Phase 2.
 */

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type AttributionLevel =
  | 'CONFIRMED_SOURCE_MATCH'
  | 'OBSERVED_CANARY'
  | 'TRACE_CORRELATED'
  | 'INFERRED'
  | 'UNATTRIBUTED';

export type FindingStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'FALSE_POSITIVE'
  | 'ACCEPTED_RISK';

export interface FindingStatusHistory {
  id: string;
  finding_id: string;
  old_status: FindingStatus;
  new_status: FindingStatus;
  changed_by: string | null;
  rationale: string | null;
  review_date: string | null;
  created_at: string;
}

export interface TaintFinding {
  id: string;
  test_run_id: string;
  test_run_case_id: string | null;
  canary_id: string | null;
  source_id: string | null;
  category: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  confidence: string;
  observation_location: string;
  detection_method: string;
  attribution_level: AttributionLevel;
  evidence_reference: {
    assertion_id?: string;
    assertion_type?: string;
    expected_value?: string;
    actual_value?: string;
    provenance?: {
      attribution_level: string;
      token_preview: string;
      source_id?: string;
      source_type?: string;
      explanation: string;
      limitations: string[];
    };
    [key: string]: unknown;
  } | null;
  deduplication_key: string | null;
  observed_at: string;
  status: FindingStatus;
  fingerprint: string | null;
  created_at: string;
}
