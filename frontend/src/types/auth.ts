export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  roles: string[];
  /** Effective permissions from the user's roles (returned by /auth/me). */
  permissions?: string[];
}

export interface Session {
  id: string;
  device_info?: string | null;
  created_at: string;
  last_used_at?: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user?: User;
}

