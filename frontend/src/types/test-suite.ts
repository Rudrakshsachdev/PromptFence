export interface TestSuite {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  scenario_count: number;
  suite_test_cases?: Array<{
    id: string;
    suite_id: string;
    test_case_id: string;
    execution_order: number;
    test_case?: any;
  }>;
}

export interface TestSuiteCreate {
  name: string;
  description?: string;
}

export interface TestSuiteUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface AddScenarioToSuite {
  test_case_id: string;
  execution_order: number;
}

