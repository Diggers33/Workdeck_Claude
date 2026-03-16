/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { apiClient } from '../services/api-client';
import { clearCache } from '../services/dashboard-api';
import { clearInsightsCache } from '../services/insights-engine';
import { User } from '../types/api';

function clearAllServiceCaches() {
  clearCache();
  clearInsightsCache();
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 Checking authentication status...');
      
      if (!apiClient.isAuthenticated()) {
        console.log('❌ No token found');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔄 Validating token with /queries/me...');
        const currentUser = await authService.getCurrentUser();
        console.log('✅ User authenticated:', currentUser.fullName || currentUser.email);
        setUser(currentUser);
      } catch (error) {
        console.error('❌ Token validation failed:', error);
        // Token is invalid, clear it
        apiClient.clearToken();
        clearAllServiceCaches();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for login success events (from LoginScreen)
    const handleLoginSuccess = () => {
      console.log('🔔 Login success event received, refreshing user...');
      checkAuth();
    };

    window.addEventListener('auth-login-success', handleLoginSuccess);
    return () => window.removeEventListener('auth-login-success', handleLoginSuccess);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log('🔐 Logging in...');
    const token = await authService.login(email, password);
    console.log('✅ Token received');
    
    // Fetch user profile after login
    const currentUser = await authService.getCurrentUser();
    console.log('✅ User profile loaded:', currentUser.fullName || currentUser.email);
    setUser(currentUser);
  }, []);

  const logout = useCallback(() => {
    console.log('🔐 Logging out...');
    authService.logout();
    clearAllServiceCaches();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!apiClient.isAuthenticated()) return;
    
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
