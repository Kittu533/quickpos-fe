import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "@/lib/api";

export interface User {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: "admin" | "manager" | "cashier";
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        console.log('[DEBUG] authStore.login called');
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login({ username, password });
          console.log('[DEBUG] Login API response:', response.data);
          const { user, token } = response.data.data;

          console.log('[DEBUG] Saving token to localStorage');
          localStorage.setItem("token", token);
          console.log('[DEBUG] Setting user and token in store');
          set({ user, token, isLoading: false });
          console.log('[DEBUG] Login successful, user:', user.username);
          return true;
        } catch (error: unknown) {
          console.log('[DEBUG] Login error:', error);
          const err = error as { response?: { data?: { message?: string } } };
          set({
            error: err.response?.data?.message || "Login failed",
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null });
      },

      checkAuth: async () => {
        console.log('[DEBUG] authStore.checkAuth called');
        // Also log to localStorage for debug panel
        const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
        logs.push({ time: new Date().toISOString(), message: 'checkAuth called', data: null });
        localStorage.setItem('debug_logs', JSON.stringify(logs));

        const token = get().token;
        if (!token) {
          console.log('[DEBUG] checkAuth - No token in store');
          return;
        }

        try {
          console.log('[DEBUG] checkAuth - Calling getProfile API');
          logs.push({ time: new Date().toISOString(), message: 'Calling getProfile API...', data: null });
          localStorage.setItem('debug_logs', JSON.stringify(logs));

          const response = await authAPI.getProfile();
          console.log('[DEBUG] checkAuth - Profile response:', response.data);

          logs.push({ time: new Date().toISOString(), message: 'Profile SUCCESS', data: JSON.stringify(response.data) });
          localStorage.setItem('debug_logs', JSON.stringify(logs));

          set({ user: response.data.data });
          console.log('[DEBUG] checkAuth - User set successfully');
        } catch (error: unknown) {
          const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
          console.log('[DEBUG] checkAuth - Error:', err);

          const errorMsg = `Status: ${err.response?.status || 'N/A'}, Message: ${err.response?.data?.message || err.message || 'Unknown error'}`;
          logs.push({ time: new Date().toISOString(), message: 'Profile FAILED - ' + errorMsg, data: null });
          localStorage.setItem('debug_logs', JSON.stringify(logs));

          // Token invalid, clear auth
          console.log('[DEBUG] checkAuth - Clearing token and user');
          localStorage.removeItem("token");
          set({ user: null, token: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

// Helper to check role permissions
export const hasRole = (user: User | null, allowedRoles: string[]): boolean => {
  if (!user) return false;
  return allowedRoles.includes(user.role);
};

export const isAdmin = (user: User | null): boolean => hasRole(user, ["admin"]);
export const isManager = (user: User | null): boolean =>
  hasRole(user, ["admin", "manager"]);
export const isCashier = (user: User | null): boolean =>
  hasRole(user, ["admin", "cashier"]);
