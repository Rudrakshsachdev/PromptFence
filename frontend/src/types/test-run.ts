/**
 * Test Run and Execution Engine Types for Phase 2.
 */

export type TestRunStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TestCaseExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'ERROR'
  | 'SKIPPED'
  | 'CANCELLED';

export type CanaryStatus = 'ACTIVE' | 'OBSERVED' | 'EXPIRED' | 'REVOKED';

export type EventType =
  | 'RUN_CREATED'
  | 'RUN_QUEUED'
  | 'RUN_STARTED'
  | 'CASE_STARTED'
  | 'CANARY_GENERATED'
  | 'SOURCE_INSTRUMENTED'
  | 'ADAPTER_REQUEST_SENT'
  | 'ADAPTER_RESPONSE_RECEIVED'
  | 'TOOL_CALL_ATTEMPTED'
  | 'CANARY_OBSERVED'
  | 'ASSERTION_COMPLETED'
  | 'FINDING_CREATED'
  | 'CASE_COMPLETED'
  | 'RUN_COMPLETED'
  | 'RUN_FAILED'
  | 'RUN_CANCELLED';

export type AssertionType =
  | 'CANARY_EXPOSURE'
  | 'UNAUTHORIZED_TOOL_CALL'
  | 'POLICY_VIOLATION'
  | 'INSTRUCTION_OVERRIDE'
  | 'SENSITIVE_PATTERN_MATCH'
  | 'EXPECTED_BEHAVIOR'
  | 'RESPONSE_VALIDATION'
  | 'TRACE_VALIDATION';

export type AssertionStatus = 'PASSED' | 'FAILED' | 'ERROR' | 'SKIPPED';

export interface TestRun {
  id: string;
  target_id: string | null;
  test_suite_id: string | null;
  initiated_by: string;
  status: TestRunStatus;
  total_cases: number;
  completed_cases: number;
  passed_cases: number;
  failed_cases: number;
  error_cases: number;
  started_at: string | null;
  completed_at: string | null;
  is_cancelled: boolean;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  execution_snapshot?: {
    target?: {
      id: string;
      name: string;
      target_type: string;
      base_url: string;
      endpoint: string;
    };
    test_suite?: {
      id: string;
      name: string;
      description?: string;
    };
    parameters?: {
      canary_tainting_enabled: boolean;
      concurrency: number;
      timeout_seconds: number;
    };
  } | null;
  target?: {
    id: string;
    name: string;
    target_type: string;
    base_url: string;
    endpoint: string;
  } | null;
  test_suite?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
}

export interface TestRunCreate {
  target_id: string;
  test_suite_id: string;
  canary_tainting_enabled?: boolean;
  concurrency?: number;
  timeout_seconds?: number;
}

export interface TestRunProgress {
  id: string;
  status: TestRunStatus;
  total_cases: number;
  completed_cases: number;
  passed_cases: number;
  failed_cases: number;
  error_cases: number;
  percent_complete: number;
  is_cancelled: boolean;
  started_at: string | null;
  completed_at: string | null;
  latest_event: string | null;
}

export interface TestRunCase {
  id: string;
  test_run_id: string;
  scenario_id: string | null;
  scenario_version: number;
  scenario_snapshot: {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    severity?: string;
    attack_input_template?: string;
    expected_behavior?: string;
    assertion_config?: Record<string, unknown>;
  } | null;
  status: TestCaseExecutionStatus;
  execution_order: number;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  normalized_request_metadata: Record<string, unknown> | null;
  normalized_response_metadata: Record<string, unknown> | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
}

export interface DynamicCanary {
  id: string;
  test_run_id: string;
  test_run_case_id: string | null;
  source_id: string;
  source_type: string;
  key_version: string;
  status: CanaryStatus;
  token_preview: string;
  metadata_json?: Record<string, unknown> | null;
  expires_at: string;
  created_at: string;
}

export interface ExecutionEvent {
  id: string;
  test_run_id: string;
  test_run_case_id: string | null;
  event_type: EventType;
  level: string;
  message: string;
  event_metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface ExecutionLog {
  id: string;
  test_run_id: string;
  test_run_case_id: string | null;
  level: string;
  message: string;
  log_metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface AssertionResult {
  id: string;
  test_run_case_id: string;
  assertion_id: string;
  assertion_type: AssertionType;
  status: AssertionStatus;
  expected_value: string | null;
  actual_value: string | null;
  evidence: Record<string, unknown> | null;
  evaluated_at: string;
  created_at: string;
}

export interface TargetTrace {
  id: string;
  test_run_id: string;
  test_run_case_id: string | null;
  source_id: string | null;
  trace_type: string;
  trace_metadata: Record<string, unknown> | null;
  evidence_reference: Record<string, unknown> | null;
  created_at: string;
}

export interface AdapterInfo {
  name: string;
  target_type: string;
  description: string;
  supported_capabilities: string[];
}
