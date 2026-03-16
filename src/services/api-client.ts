/**
 * API Client
 * Base HTTP client with authentication, error handling, and response unwrapping
 */

import { API_CONFIG } from '../config/api';
import { ApiResponse, ApiError } from '../types/api';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public errors: ApiError[] = []
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class AuthenticationError extends ApiClientError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiClientError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Get the stored authentication token
   */
  private getToken(): string | null {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    return token;
  }

  /**
   * Set the authentication token
   */
  public setToken(token: string): void {
    // Remove "Bearer " if it's already in the token
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    // Store with Bearer prefix
    const tokenToStore = `Bearer ${cleanToken}`;
    console.log('Storing token:', tokenToStore.substring(0, 20) + '...');
    localStorage.setItem(API_CONFIG.TOKEN_KEY, tokenToStore);
  }

  /**
   * Remove the authentication token
   */
  public clearToken(): void {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Build headers for the request
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getToken();
    if (token) {
      // Token is already prefixed with "Bearer " in storage
      headers.Authorization = token;
    }

    return headers;
  }

  /**
   * Handle API response
   * Unwraps the response and extracts result or throws error
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`API Response: ${response.status} ${response.statusText}`);
    
    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401) {
        console.error('401 Unauthorized');
        // Try to parse the response body for a more specific error
        try {
          const errorData = await response.json();
          console.error('401 Error data:', errorData);
          const errorCode = errorData.result?.code || errorData.errors?.[0]?.code || 'AUTHENTICATION_ERROR';
          const errorMessage = errorData.errors?.[0]?.message ||
            (errorCode === 'AUTHENTICATION_ERROR' ? 'Invalid email or password' : 'Authentication token is invalid or expired');
          this.clearToken();
          throw new AuthenticationError(errorMessage);
        } catch (e) {
          if (e instanceof AuthenticationError) throw e;
          this.clearToken();
          throw new AuthenticationError('Authentication token is invalid or expired');
        }
      }
      if (response.status === 403) {
        throw new AuthorizationError();
      }

      // Try to parse error response
      try {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        console.error('API Error result:', errorData?.result);
        const message = errorData.errors?.[0]?.message
          || errorData.result?.message
          || errorData.result?.error
          || (typeof errorData.result === 'string' ? errorData.result : null)
          || `HTTP ${response.status}: ${response.statusText}`;
        throw new ApiClientError(
          message,
          errorData.errors?.[0]?.code || errorData.result?.code || `HTTP_${response.status}`,
          errorData.errors || [errorData.result]
        );
      } catch (e) {
        if (e instanceof ApiClientError) throw e;
        throw new ApiClientError(
          `HTTP ${response.status}: ${response.statusText}`,
          `HTTP_${response.status}`
        );
      }
    }

    // Parse JSON response
    const data: ApiResponse<T> = await response.json();
    console.log('API Response data:', data);

    // Handle application-level errors
    if (data.status === 'KO') {
      const firstError = data.errors?.[0];
      console.error('Application error:', firstError);
      throw new ApiClientError(
        firstError?.message || 'An error occurred',
        firstError?.code || 'UNKNOWN_ERROR',
        data.errors || []
      );
    }

    // Return unwrapped result
    return data.result;
  }

  /**
   * Make a GET request
   */
  public async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: { headers?: Record<string, string>; signal?: AbortSignal }
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    console.log(`GET ${url.toString()}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // If an external signal is provided, forward its abort to our controller
    if (options?.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.buildHeaders(options?.headers),
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      if ((error as Error).name === 'AbortError') {
        if (options?.signal?.aborted) {
          throw new ApiClientError('Request aborted', 'ABORTED');
        }
        throw new ApiClientError('Request timeout', 'TIMEOUT');
      }
      throw new ApiClientError(
        (error as Error).message || 'Network error',
        'NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a POST request
   */
  public async post<T>(
    endpoint: string,
    body?: any,
    options?: { headers?: Record<string, string>; skipAuth?: boolean }
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    console.log(`POST ${this.baseUrl}${endpoint}`, body ? 'with body' : 'no body');
    if (body) console.log('Request body:', body);

    try {
      // Build headers, optionally skipping auth
      const headers = options?.skipAuth 
        ? { 'Content-Type': 'application/json', ...options?.headers }
        : this.buildHeaders(options?.headers);

      console.log('Request headers:', headers);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new ApiClientError('Request timeout', 'TIMEOUT');
      }
      throw new ApiClientError(
        (error as Error).message || 'Network error',
        'NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a PUT request
   */
  public async put<T>(
    endpoint: string,
    body?: any,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.buildHeaders(options?.headers),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new ApiClientError('Request timeout', 'TIMEOUT');
      }
      throw new ApiClientError(
        (error as Error).message || 'Network error',
        'NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a DELETE request
   */
  public async delete<T>(
    endpoint: string,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.buildHeaders(options?.headers),
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new ApiClientError('Request timeout', 'TIMEOUT');
      }
      throw new ApiClientError(
        (error as Error).message || 'Network error',
        'NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();