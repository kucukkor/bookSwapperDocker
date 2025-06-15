import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../store';
import { isTokenExpired } from '../utils';
import type { LoginCredentials, RegisterData } from '../types';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, login, logout, register } = useAuthStore();

  // Auto logout if token is expired
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, [token, logout]);

  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    try {
      await login(credentials);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }, [login]);

  const handleRegister = useCallback(async (userData: RegisterData) => {
    try {
      await register(userData);
      // After successful registration, automatically login
      await login({
        email: userData.email,
        password: userData.password,
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }, [register, login]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isTokenExpired: (token: string) => isTokenExpired(token),
  };
}; 