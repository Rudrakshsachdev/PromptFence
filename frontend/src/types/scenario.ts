export type ScenarioCategory =
  | 'PROMPT_INJECTION'
  | 'DATA_DISCLOSURE'
  | 'TOOL_EXECUTION'
  | 'INSTRUCTION_CONFLICT'
  | 'REGRESSION';

export type ScenarioSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface TestCase {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  category: ScenarioCategory;
  severity: ScenarioSeverity;
  attack_input_template: string;
  expected_behavior?: string | null;
  assertion_config?: Record<string, unknown> | null;
  applicable_target_types?: string[] | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestCaseCreate {
  name: string;
  description?: string;
  category: ScenarioCategory;
  severity: ScenarioSeverity;
  attack_input_template: string;
  expected_behavior?: string;
  assertion_config?: Record<string, unknown>;
  applicable_target_types?: string[];
}

export interface TestCaseUpdate extends Partial<TestCaseCreate> {
  is_enabled?: boolean;
}

