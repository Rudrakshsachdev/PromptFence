import { apiClient } from '@/lib/api-client';
import { Session, User } from '@/types/auth';
import { SuccessResponse } from '@/types/api';

export const authService = {
  async register(data: { email: string; password: string; full_name: string }): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }): Promise<{ access_token: string }> {
    return apiClient<{ access_token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>('/api/v1/auth/logout', {
      method: 'POST',
    });
  },

  async logoutAll(): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>('/api/v1/auth/logout-all', {
      method: 'POST',
    });
  },

  async forgotPassword(email: string): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(data: { token: string; new_password: string }): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyEmail(token: string): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async getMe(): Promise<User> {
    return apiClient<User>('/api/v1/auth/me');
  },

  async updateProfile(data: { full_name?: string; avatar_url?: string }): Promise<User> {
    return apiClient<User>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>('/api/v1/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSessions(): Promise<Session[]> {
    return apiClient<Session[]>('/api/v1/users/me/sessions');
  },

  async revokeSession(sessionId: string): Promise<SuccessResponse> {
    return apiClient<SuccessResponse>(`/api/v1/users/me/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

