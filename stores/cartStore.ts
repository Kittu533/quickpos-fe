import { create } from "zustand";

export interface CartItem {
  product_id: number;
  product_name: string;
  barcode?: string;
  price: number;
  quantity: number;
  stock: number;
  image_url?: string;
}

export interface Customer {
  id: number;
  member_code: string;
  name: string;
  phone?: string;
  points: number;
}

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  
  // Actions
  addItem: (product: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  
  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
}

// Constants from backend
const MEMBER_DISCOUNT_PERCENT = 5;
const TAX_PERCENT = 10;
const POINTS_PER_AMOUNT = 10000;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,

  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.product_id === product.product_id
      );

      if (existingItem) {
        // Update quantity if item exists
        const newQty = existingItem.quantity + (product.quantity || 1);
        if (newQty > existingItem.stock) {
          // Don't exceed stock
          return state;
        }
        return {
          items: state.items.map((item) =>
            item.product_id === product.product_id
              ? { ...item, quantity: newQty }
              : item
          ),
        };
      }

      // Add new item
      return {
        items: [
          ...state.items,
          { ...product, quantity: product.quantity || 1 },
        ],
      };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.product_id !== productId) };
      }

      const item = state.items.find((i) => i.product_id === productId);
      if (item && quantity > item.stock) {
        return state; // Don't exceed stock
      }

      return {
        items: state.items.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item
        ),
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product_id !== productId),
    }));
  },

  clearCart: () => {
    set({ items: [], customer: null });
  },

  setCustomer: (customer) => {
    set({ customer });
  },

  getSubtotal: () => {
    return get().items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));

// Helper to calculate transaction totals
export const calculateTotals = (subtotal: number, isMember: boolean) => {
  const discount = isMember ? Math.round((subtotal * MEMBER_DISCOUNT_PERCENT) / 100) : 0;
  const afterDiscount = subtotal - discount;
  const tax = Math.round((afterDiscount * TAX_PERCENT) / 100);
  const total = afterDiscount + tax;
  const pointsEarned = isMember && subtotal >= POINTS_PER_AMOUNT 
    ? Math.floor(subtotal / POINTS_PER_AMOUNT) 
    : 0;

  return {
    subtotal,
    discount,
    discountPercent: isMember ? MEMBER_DISCOUNT_PERCENT : 0,
    tax,
    taxPercent: TAX_PERCENT,
    total,
    pointsEarned,
  };
};
