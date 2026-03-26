/**
 * Auth Store - Zustand state management for authentication
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      get isAuthenticated() {
        return Boolean(this.token && this.user);
      },

      setUser: (user) => set({ user }),

      setToken: (token) => set({ token }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      login: (user, token) =>
        set({
          user,
          token,
          error: null,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          error: null,
          isLoading: false,
        }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);

export default useAuthStore;
