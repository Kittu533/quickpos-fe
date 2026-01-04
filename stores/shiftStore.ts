import { create } from "zustand";
import { shiftsAPI } from "@/lib/api";

export interface Shift {
  id: number;
  user_id: number;
  shift_start: string;
  shift_end?: string;
  opening_balance: number;
  closing_balance?: number;
  total_sales: number;
  total_transactions: number;
  status: "open" | "closed";
  user?: {
    id: number;
    username: string;
    fullname: string;
  };
}

interface ShiftState {
  currentShift: Shift | null;
  isLoading: boolean;
  error: string | null;

  fetchCurrentShift: () => Promise<void>;
  openShift: (openingBalance: number) => Promise<boolean>;
  closeShift: (closingBalance: number) => Promise<{ summary: Record<string, unknown> } | null>;
  clearError: () => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: null,
  isLoading: false,
  error: null,

  fetchCurrentShift: async () => {
    set({ isLoading: true });
    try {
      const response = await shiftsAPI.getCurrent();
      set({ currentShift: response.data.data, isLoading: false });
    } catch {
      set({ currentShift: null, isLoading: false });
    }
  },

  openShift: async (openingBalance: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await shiftsAPI.open(openingBalance);
      set({ currentShift: response.data.data, isLoading: false });
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || "Failed to open shift",
        isLoading: false,
      });
      return false;
    }
  },

  closeShift: async (closingBalance: number) => {
    const shift = get().currentShift;
    if (!shift) return null;

    set({ isLoading: true, error: null });
    try {
      const response = await shiftsAPI.close(shift.id, closingBalance);
      set({ currentShift: null, isLoading: false });
      return { summary: response.data.summary };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || "Failed to close shift",
        isLoading: false,
      });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
