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
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login({ username, password });
          const { user, token } = response.data.data;

          localStorage.setItem("token", token);
          set({ user, token, isLoading: false });
          return true;
        } catch (error: unknown) {
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
        const token = get().token;
        if (!token) return;

        try {
          const response = await authAPI.getProfile();
          set({ user: response.data.data });
        } catch {
          // Token invalid, clear auth
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
