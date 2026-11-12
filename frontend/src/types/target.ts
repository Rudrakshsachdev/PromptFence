export type TargetType = 'CHAT_API' | 'COMPLETION_API' | 'AGENT_API' | 'CUSTOM';
export type AuthenticationType = 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC';

export interface Target {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  target_type: TargetType;
  base_url: string;
  endpoint: string;
  http_method: string;
  authentication_type: AuthenticationType;
  headers_config?: Record<string, string> | null;
  request_template?: Record<string, unknown> | null;
  expected_response_format?: string | null;
  timeout_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TargetCreate {
  name: string;
  description?: string;
  target_type: TargetType;
  base_url: string;
  endpoint: string;
  http_method?: string;
  authentication_type?: AuthenticationType;
  headers_config?: Record<string, string>;
  request_template?: Record<string, unknown>;
  expected_response_format?: string;
  timeout_seconds?: number;
}

export interface TargetUpdate extends Partial<TargetCreate> {
  is_active?: boolean;
}

export interface TargetVersion {
  id: string;
  target_id: string;
  version_number: number;
  configuration_snapshot: Record<string, unknown>;
  created_at: string;
}

export interface TargetValidationResult {
  reachable: boolean;
  status_code?: number | null;
  response_time_ms?: number | null;
  error?: string | null;
}

