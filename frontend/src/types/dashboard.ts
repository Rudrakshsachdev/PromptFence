export interface DashboardOverview {
  total_targets: number;
  active_targets: number;
  total_test_suites: number;
  total_test_cases: number;
  enabled_test_cases: number;
  recent_targets: Array<{
    id: string;
    name: string;
    target_type: string;
    base_url: string;
    is_active: boolean;
    created_at?: string;
  }>;
  recent_test_cases: Array<{
    id: string;
    name: string;
    category: string;
    severity: string;
    is_enabled: boolean;
    created_at?: string;
  }>;
}

export interface ActivityItem {
  type: string;
  title: string;
  timestamp: string | null;
  entity_id: string;
}

export interface DashboardActivity {
  activities: ActivityItem[];
}

export interface DashboardDistributions {
  targets_by_type: Record<string, number>;
  test_cases_by_category: Record<string, number>;
  test_cases_by_severity: Record<string, number>;
}

