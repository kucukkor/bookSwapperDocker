import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';
import { isTokenExpired } from '../utils';
import type { User, LoginCredentials, RegisterData, AuthState } from '../types';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.login(credentials);
          
          // API service artık direkt { token, user } döndürüyor
          const loginData = response as { token: string; user: User };
          
          // Token'ı localStorage'a kaydet
          localStorage.setItem('token', loginData.token);
          
          set({
            user: loginData.user,
            token: loginData.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          await apiService.register(userData);
          
          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      logout: () => {
        // localStorage'dan token'ı temizle
        localStorage.removeItem('token');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loadProfile: async () => {
        const { token } = get();
        
        if (!token) return;

        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.getProfile();
          
          // API direkt user object döndürüyor, data wrapper yok
          const userData = response.data || response; // Fallback for both formats
          
          set({
            user: userData as User,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load profile',
          });
          
          // If unauthorized, logout
          if (error instanceof Error && error.message.includes('Authentication')) {
            get().logout();
          }
        }
      },

      updateProfile: async (profileData: Partial<User>) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.updateProfile(profileData);
          
          set((state) => ({
            user: state.user ? { ...state.user, ...(response.data as Partial<User>) } : null,
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update profile',
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      initializeAuth: () => {
        const token = localStorage.getItem('token');
        
        if (token && !isTokenExpired(token)) {
          set({
            token,
            isAuthenticated: true,
          });
          
          // Load profile after setting token
          get().loadProfile();
        } else if (token && isTokenExpired(token)) {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Validate token on rehydration
        if (state?.token && isTokenExpired(state.token)) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          localStorage.removeItem('token');
        }
      },
    }
  )
); 