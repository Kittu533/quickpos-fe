import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.warn("⚠️ NEXT_PUBLIC_API_URL is not set in environment variables");
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper to get full image URL from relative path
export const getImageUrl = (imagePath: string | undefined | null): string | null => {
  if (!imagePath) return null;

  // If already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Prepend API URL to relative paths
  const baseUrl = API_URL?.replace(/\/api\/?$/, '') || '';
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Auth API
export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post("/auth/login", data),
  register: (data: {
    username: string;
    fullname: string;
    email: string;
    password: string;
    role?: string;
  }) => api.post("/auth/register", data),
  getProfile: () => api.get("/auth/profile"),
  logout: () => api.post("/auth/logout"),
};

// Users API
export const usersAPI = {
  getAll: (params?: Record<string, unknown>) => api.get("/users", { params }),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post("/users", data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  toggleStatus: (id: number) => api.patch(`/users/${id}/toggle-status`),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  getById: (id: number) => api.get(`/categories/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post("/categories", data),
  update: (id: number, data: { name: string; description?: string }) =>
    api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Products API
export const productsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get("/products", { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  getByBarcode: (code: string) => api.get(`/products/barcode/${code}`),
  getLowStock: () => api.get("/products/alerts/low-stock"),
  create: (data: FormData) =>
    api.post("/products", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, data: FormData | Record<string, unknown>) =>
    api.put(`/products/${id}`, data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    }),
  updateStock: (id: number, quantity: number) =>
    api.patch(`/products/${id}/stock`, { quantity }),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Customers API
export const customersAPI = {
  getAll: (params?: Record<string, unknown>) => api.get("/customers", { params }),
  getById: (id: number) => api.get(`/customers/${id}`),
  getByPhone: (phone: string) => api.get(`/customers/phone/${phone}`),
  getByCode: (code: string) => api.get(`/customers/code/${code}`),
  getTransactions: (id: number, params?: Record<string, unknown>) =>
    api.get(`/customers/${id}/transactions`, { params }),
  create: (data: { name: string; phone?: string; email?: string }) =>
    api.post("/customers", data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

// Shifts API
export const shiftsAPI = {
  getCurrent: () => api.get("/shifts/current"),
  getAll: (params?: Record<string, unknown>) => api.get("/shifts", { params }),
  getMyShifts: (params?: Record<string, unknown>) => api.get("/shifts/my", { params }),
  getById: (id: number) => api.get(`/shifts/${id}`),
  open: (opening_cash: number) => api.post("/shifts/open", { opening_cash }),
  close: (closing_cash: number, notes?: string) =>
    api.post("/shifts/close", { closing_cash, notes }),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get("/transactions", { params }),
  getById: (id: number) => api.get(`/transactions/${id}`),
  create: (data: {
    items: Array<{ product_id: number; quantity: number }>;
    customer_id?: number;
    payment_method: string;
    amount_paid: number;
    notes?: string;
  }) => api.post("/transactions", data),
  void: (id: number, reason: string) =>
    api.post(`/transactions/${id}/void`, { reason }),
  getDailyReport: (date?: string) =>
    api.get("/transactions/report/daily", { params: { date } }),
  getMonthlyReport: (year?: number, month?: number) =>
    api.get("/transactions/report/monthly", { params: { year, month } }),
};

// Payments API (Midtrans)
export const paymentsAPI = {
  getClientKey: () => api.get("/payments/client-key"),
  createPayment: (transactionId: number) =>
    api.post("/payments/create", { transaction_id: transactionId }),
  checkStatus: (orderId: string) => api.get(`/payments/status/${orderId}`),
  cancelPayment: (orderId: string) => api.post(`/payments/cancel/${orderId}`),
  syncPayment: (transactionId: number) => api.post(`/payments/sync/${transactionId}`),
  // For testing purposes
  simulateNotification: (data: any) => api.post("/payments/notification", data),
};
