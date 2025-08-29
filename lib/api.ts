import { authService } from './auth'

const API_BASE_URL = "http://localhost:3001/api"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return fetchWithAuth<T>(endpoint, options)
}

async function fetchWithAuth<T>(endpoint: string, options?: RequestInit, retryCount = 0): Promise<T> {
  const token = await authService.getValidAccessToken()

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
    ...options,
  })

  // Handle 401 Unauthorized - token might be expired
  if (response.status === 401 && retryCount === 0) {
    try {
      // Try to refresh the token
      const newToken = await authService.refreshAccessToken()
      if (newToken) {
        // Retry the request with the new token
        return fetchWithAuth<T>(endpoint, options, retryCount + 1)
      }
    } catch (error) {
      // Refresh failed, clear auth and redirect to login
      authService.clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiError(401, 'Authentication failed')
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    // If it's still 401 after retry, clear auth
    if (response.status === 401) {
      authService.clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    
    throw new ApiError(response.status, errorData.message || "An error occurred")
  }

  return response.json()
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(response.status, errorData.message || "Login failed")
    }

    const data = await response.json()
    
    // Store tokens and user data using auth service
    if (data.data?.access_token && data.data?.refresh_token && data.data?.user) {
      authService.setAuth(
        {
          accessToken: data.data.access_token,
          refreshToken: data.data.refresh_token,
        },
        data.data.user
      )
    }

    return data
  },

  logout: async () => {
    try {
      await fetchApi("/auth/logout", { method: "POST" })
    } finally {
      // Always clear local auth state regardless of API response
      authService.clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  },

  refresh: (refreshToken: string) =>
    fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    }),
}

// Customers API
export const customersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    fetchApi<{ customers: any[]; total: number; page: number; totalPages: number }>(
      `/customers?${new URLSearchParams(params as any).toString()}`,
    ),

  getById: (id: string) => fetchApi<any>(`/customers/${id}`),

  create: (data: { name: string; email?: string; phone?: string }) =>
    fetchApi<any>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name: string; email?: string; phone?: string }) =>
    fetchApi<any>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) => fetchApi(`/customers/${id}`, { method: "DELETE" }),
}

// Payments API
export const paymentsApi = {
  getAll: (params?: { page?: number; limit?: number; customerId?: string }) =>
    fetchApi<{ payments: any[]; total: number; page: number; totalPages: number }>(
      `/payments?${new URLSearchParams(params as any).toString()}`,
    ),

  create: (data: { customerId: string; amountNaira: number; exchangeRate: number; amountUSD: number }) =>
    fetchApi<any>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Dashboard API
export const dashboardApi = {
  getMetrics: () => fetchApi<any>("/dashboard/metrics"),
}

// Vendors API
export const vendorsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string }) =>
    fetchApi<{ vendors: any[]; total: number; page: number; totalPages: number }>(
      `/vendors?${new URLSearchParams(params as any).toString()}`,
    ),

  create: (data: { name: string; type: "EXCHANGE" | "PAYMENT"; contactInfo?: string }) =>
    fetchApi<any>("/vendors", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name: string; type: "EXCHANGE" | "PAYMENT"; contactInfo?: string }) =>
    fetchApi<any>(`/vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) => fetchApi(`/vendors/${id}`, { method: "DELETE" }),
}

// Exchanges API
export const exchangesApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    fetchApi<{ exchanges: any[]; total: number; page: number; totalPages: number }>(
      `/exchanges?${new URLSearchParams(params as any).toString()}`,
    ),

  create: (data: { vendorId: string; amountNaira: number; exchangeRate: number; amountUSD: number }) =>
    fetchApi<any>("/exchanges", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, data: { status: string }) =>
    fetchApi<any>(`/exchanges/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// Vendor Payments API
export const vendorPaymentsApi = {
  getAll: (params?: { page?: number; limit?: number; customerId?: string }) =>
    fetchApi<{ vendorPayments: any[]; total: number; page: number; totalPages: number }>(
      `/vendor-payments?${new URLSearchParams(params as any).toString()}`,
    ),

  create: (data: { customerId: string; vendorId: string; amountUSD: number; description?: string }) =>
    fetchApi<any>("/vendor-payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Wallet API
export const walletApi = {
  getData: () =>
    fetchApi<{
      balance: number
      totalExchanges: number
      recentActivity: Array<{
        id: string
        type: "EXCHANGE" | "PAYMENT"
        amount: number
        date: string
        description: string
      }>
      transactions: Array<{
        id: string
        type: "EXCHANGE" | "PAYMENT"
        amount: number
        date: string
        description: string
        vendor?: string
        customer?: string
        status: "COMPLETED" | "PENDING"
      }>
    }>("/wallet"),
}

// Convenience function for wallet data
export const api = {
  // Auth
  login: authApi.login,
  logout: authApi.logout,

  // Dashboard
  getDashboardMetrics: dashboardApi.getMetrics,

  // Customers
  getCustomers: customersApi.getAll,
  getCustomer: customersApi.getById,
  createCustomer: customersApi.create,
  updateCustomer: customersApi.update,
  deleteCustomer: customersApi.delete,

  // Payments
  getPayments: paymentsApi.getAll,
  createPayment: paymentsApi.create,

  // Vendors
  getVendors: vendorsApi.getAll,
  createVendor: vendorsApi.create,
  updateVendor: vendorsApi.update,
  deleteVendor: vendorsApi.delete,

  // Exchanges
  getExchanges: exchangesApi.getAll,
  createExchange: exchangesApi.create,
  updateExchangeStatus: exchangesApi.updateStatus,

  // Vendor Payments
  getVendorPayments: vendorPaymentsApi.getAll,
  createVendorPayment: vendorPaymentsApi.create,

  // Wallet
  getWalletData: walletApi.getData,
}
