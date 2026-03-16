/**
 * Authentication Service
 * Handles login, logout, and user authentication
 */

import { apiClient } from './api-client';
import { ENDPOINTS } from '../config/api';
import { LoginRequest, LoginResponse, User } from '../types/api';

export class AuthService {
  /**
   * Login with email and password
   */
  async login(email: string, password: string, remember: boolean = true): Promise<string> {
    const payload: LoginRequest = {
      mail: email, // API uses 'mail' not 'email'
      password,
      remember,
    };

    console.log('Attempting login to:', ENDPOINTS.AUTH_LOGIN);
    console.log('Login payload:', { mail: email, remember, password: '***' });
    const token = await apiClient.post<string>(ENDPOINTS.AUTH_LOGIN, payload, { skipAuth: true });
    console.log('Token received from API:', token);
    apiClient.setToken(token);
    console.log('Token saved to localStorage');
    return token;
  }

  /**
   * Admin login
   */
  async adminLogin(email: string, password: string): Promise<string> {
    const payload = {
      email,
      password,
    };

    const token = await apiClient.post<string>(ENDPOINTS.AUTH_ADMIN_LOGIN, payload);
    apiClient.setToken(token);
    return token;
  }

  /**
   * Google OAuth login
   */
  async googleLogin(token: string, code: string): Promise<string> {
    const payload = { token, code };
    const authToken = await apiClient.post<string>(ENDPOINTS.AUTH_GOOGLE, payload);
    apiClient.setToken(authToken);
    return authToken;
  }

  /**
   * Microsoft OAuth login
   */
  async microsoftLogin(token: string, code: string): Promise<string> {
    const payload = { token, code };
    const authToken = await apiClient.post<string>(ENDPOINTS.AUTH_MICROSOFT, payload);
    apiClient.setToken(authToken);
    return authToken;
  }

  /**
   * Logout
   */
  logout(): void {
    apiClient.clearToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>(ENDPOINTS.ME);
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return await apiClient.get<User[]>(ENDPOINTS.USERS);
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH_FORGOT_PASSWORD, { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH_RESET, { token, password });
  }

  /**
   * Update current user's password
   */
  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(ENDPOINTS.AUTH_UPDATE_PASSWORD, {
      oldPassword,
      newPassword,
    });
  }
}

export const authService = new AuthService();