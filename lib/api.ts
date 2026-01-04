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
  getById: (id: number) => api.get(`/shifts/${id}`),
  open: (opening_balance: number) => api.post("/shifts/open", { opening_balance }),
  close: (id: number, closing_balance: number) =>
    api.put(`/shifts/${id}/close`, { closing_balance }),
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
    api.put(`/transactions/${id}/void`, { reason }),
  getDailyReport: (date?: string) =>
    api.get("/transactions/report/daily", { params: { date } }),
  getMonthlyReport: (year?: number, month?: number) =>
    api.get("/transactions/report/monthly", { params: { year, month } }),
};
