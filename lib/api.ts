import { authService } from './auth'
import { getCurrentMarket } from './stores/market-store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function extractErrorMessage(errorData: any, fallback = "An error occurred"): string {
  if (!errorData) return fallback
  // Common API error shapes
  if (typeof errorData === 'string') return errorData
  if (typeof errorData.message === 'string' && errorData.message.trim()) return errorData.message
  if (typeof errorData.error === 'string' && errorData.error.trim()) return errorData.error
  if (errorData.error && typeof errorData.error.message === 'string' && errorData.error.message.trim()) {
    return errorData.error.message
  }
  // NestJS/Express validation errors array
  if (Array.isArray(errorData.errors) && errorData.errors.length) {
    const first = errorData.errors[0]
    if (typeof first === 'string') return first
    if (first && typeof first.message === 'string' && first.message.trim()) return first.message
    if (first && first.constraints) {
      const messages = Object.values(first.constraints as Record<string, string>)
      if (messages.length) return messages.join('\n')
    }
  }
  // Some libs send { details: [{ message: "..." }] }
  if (Array.isArray(errorData.details) && errorData.details.length) {
    const d0 = errorData.details[0]
    if (typeof d0 === 'string') return d0
    if (d0 && typeof d0.message === 'string') return d0.message
  }
  return fallback
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return fetchWithAuth<T>(endpoint, options)
}

async function fetchWithAuth<T>(endpoint: string, options?: RequestInit, retryCount = 0): Promise<T> {
  const token = await authService.getValidAccessToken()

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        'X-Market': getCurrentMarket(),
        ...options?.headers,
      },
      ...options,
    })
  } catch (e: any) {
    // Network/request failure before a response is available
    throw new ApiError(0, e?.message || 'Network error, please check your connection')
  }

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
    
    throw new ApiError(response.status, extractErrorMessage(errorData))
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
      throw new ApiError(response.status, extractErrorMessage(errorData, "Login failed"))
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
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return fetchApi<any>(`/customers${qs ? `?${qs}` : ''}`)
      .then((res) => {
        const data = res?.data ?? res
        const pagination = res?.pagination ?? {}
        return {
          customers: data ?? [],
          total: pagination.total ?? res?.total ?? 0,
          page: pagination.page ?? res?.page ?? params?.page ?? 1,
          totalPages: pagination.totalPages ?? res?.totalPages ?? 1,
        }
      })
  },

  getById: async (id: string) => {
    const res = await fetchApi<any>(`/customers/${id}`)
    return res?.data ?? res
  },

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
  getAll: (params?: { page?: number; limit?: number; customerId?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    return fetchApi<any>(`/payments${qs ? `?${qs}` : ''}`)
      .then((res) => {
        const data = res?.data ?? res
        const pagination = res?.pagination ?? {}
        return {
          payments: data ?? [],
          total: pagination.total ?? res?.total ?? 0,
          page: pagination.page ?? res?.page ?? params?.page ?? 1,
          totalPages: pagination.totalPages ?? res?.totalPages ?? 1,
        }
      })
  },
  getSummary: (params?: { customerId?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    return fetchApi<any>(`/payments/summary${qs ? `?${qs}` : ''}`)
  },
  create: (data: { customerId: string; amountNaira: number; exchangeRate: number; transactionDate?: string }) =>
    fetchApi<any>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Dashboard API
export const dashboardApi = {
  getMetrics: async () => {
    const res = await fetchApi<any>("/dashboard/metrics")
    const data = res?.data ?? res
    // Normalize to UI expectations
    const totalPaymentsThisMonth = data?.totalPaymentsThisMonth ?? 0
    const totalExchangesThisMonth = data?.totalExchangesThisMonth ?? 0
    const totalVendorPaymentsThisMonth = data?.totalVendorPaymentsThisMonth ?? 0
    return {
      totalWalletBalance: data?.walletBalance ?? 0,
      activeCustomersCount: data?.totalCustomers ?? 0,
      pendingExchangesCount: data?.pendingExchanges ?? 0,
      recentTransactionsCount: totalPaymentsThisMonth + totalExchangesThisMonth + totalVendorPaymentsThisMonth,
      // Keep raw as well in case other widgets need them later
      raw: data,
    }
  },
  getRecentActivity: async () => {
    const res = await fetchApi<any>("/dashboard/recent-activity")
    return res?.data ?? []
  },
  getSummary: (params?: { customerId?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    return fetchApi<any>(`/payments/summary${qs ? `?${qs}` : ''}`)
  },
}

// Vendors API
export const vendorsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);
    const qs = searchParams.toString();
    return fetchApi<any>(`/vendors${qs ? `?${qs}` : ''}`)
      .then((res) => {
        const data = res?.data ?? res
        const pagination = res?.pagination ?? {}
        return {
          vendors: data ?? [],
          total: pagination.total ?? res?.total ?? 0,
          page: pagination.page ?? res?.page ?? params?.page ?? 1,
          totalPages: pagination.totalPages ?? res?.totalPages ?? 1,
        }
      })
  },

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
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    const qs = searchParams.toString();
    return fetchApi<any>(`/exchanges${qs ? `?${qs}` : ''}`)
      .then((res) => {
        const data = res?.data ?? res
        const pagination = res?.pagination ?? {}
        return {
          exchanges: data ?? [],
          total: pagination.total ?? res?.total ?? 0,
          page: pagination.page ?? res?.page ?? params?.page ?? 1,
          totalPages: pagination.totalPages ?? res?.totalPages ?? 1,
        }
      })
  },

  create: (data: { vendorId: string; amountNaira: number; exchangeRate: number; transactionDate?: string }) =>
    fetchApi<any>("/exchanges", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, data: { status: string }) =>
    fetchApi<any>(`/exchanges/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  addReceipt: (id: string, data: { amountUSD: number; transactionDate?: string }) =>
    fetchApi<any>(`/exchanges/${id}/receipts`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Vendor Payments API
export const vendorPaymentsApi = {
  getAll: (params?: { page?: number; limit?: number; customerId?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    return fetchApi<any>(`/vendor-payments${qs ? `?${qs}` : ''}`)
      .then((res) => {
        const data = res?.data ?? res
        const pagination = res?.pagination ?? {}
        return {
          vendorPayments: data ?? [],
          total: pagination.total ?? res?.total ?? 0,
          page: pagination.page ?? res?.page ?? params?.page ?? 1,
          totalPages: pagination.totalPages ?? res?.totalPages ?? 1,
        }
      })
  },
  getSummary: (params?: { customerId?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    return fetchApi<any>(`/vendor-payments/summary${qs ? `?${qs}` : ''}`)
  },
  create: (data: { customerId: string; vendorId: string; amountUSD: number; description?: string; transactionDate?: string }) =>
    fetchApi<any>("/vendor-payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Payment Orders API
export const paymentOrdersApi = {
  getAll: (params?: { page?: number; limit?: number; customerId?: string; vendorId?: string; status?: string; market?: string; startDate?: string; endDate?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.vendorId) searchParams.append('vendorId', params.vendorId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.market) searchParams.append('market', params.market);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return fetchApi<any>(`/payment-orders${qs ? `?${qs}` : ''}`)
      .then((res) => {
        const data = res?.data ?? res
        const pagination = res?.pagination ?? {}
        return {
          paymentOrders: data ?? [],
          total: pagination.total ?? res?.total ?? 0,
          page: pagination.page ?? res?.page ?? params?.page ?? 1,
          totalPages: pagination.totalPages ?? res?.totalPages ?? 1,
        }
      })
  },
  getSummary: (params?: { customerId?: string; vendorId?: string; status?: string; market?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.vendorId) searchParams.append('vendorId', params.vendorId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.market) searchParams.append('market', params.market);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    return fetchApi<any>(`/payment-orders/summary${qs ? `?${qs}` : ''}`)
  },
  getById: async (id: string) => {
    const res = await fetchApi<any>(`/payment-orders/${id}`)
    return res?.data ?? res
  },
  create: (data: { customerId: string; vendorId: string; amountUSD: number; amountRMB?: number; description?: string; notes?: string; market?: string }) =>
    fetchApi<any>("/payment-orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { status?: string; notes?: string }) =>
    fetchApi<any>(`/payment-orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

// Wallet API
export const walletApi = {
  getData: async () => {
    const res = await fetchApi<any>("/wallet")
    const data = res?.data ?? res
    const market = getCurrentMarket()

    if (market === 'CHINA') {
      return {
        balance: data?.totalRMB ?? 0,
        totalRMB: data?.totalRMB ?? 0,
        totalCustomerBalanceRMB: data?.totalCustomerBalanceRMB ?? 0,
        availableCustomerBalanceRMB: data?.availableCustomerBalanceRMB ?? 0,
        pendingExchangesRMB: data?.pendingExchangesRMB ?? 0,
        // Keep USD fields undefined to avoid accidental USD rendering
        totalCustomerBalanceUSD: undefined,
        customerBalanceUSD: undefined,
        pendingExchangesUSD: undefined,
        updatedAt: data?.updatedAt,
      }
    }

    return {
      balance: data?.totalUSD ?? 0,
      customerBalanceUSD: data?.availableCustomerBalanceUSD ?? data?.totalCustomerBalanceUSD ?? 0,
      pendingExchangesUSD: data?.pendingExchangesUSD ?? 0,
      totalCustomerBalanceUSD: data?.totalCustomerBalanceUSD ?? undefined,
      updatedAt: data?.updatedAt,
    }
  },
  getHistory: async (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.page !== undefined) searchParams.append('page', params.page.toString())
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())
    const qs = searchParams.toString()
    const res = await fetchApi<any>(`/wallet/history${qs ? `?${qs}` : ''}`)
    const list = res?.data ?? []
    const pagination = res?.pagination ?? {}
    const market = getCurrentMarket()
    const transactions = list.map((item: any) => ({
      id: item.id,
      type: item.type, // CREDIT | DEBIT
      amount: item.amount,
      date: item.createdAt,
      description: item.description,
      status: 'COMPLETED' as const,
      currency: market === 'CHINA' ? 'RMB' : 'USD',
    }))
    return {
      transactions,
      total: pagination.total ?? 0,
      page: pagination.page ?? 1,
      totalPages: pagination.totalPages ?? 1,
    }
  },
  
}

// Convenience function for wallet data
export const api = {
  // Auth
  login: authApi.login,
  logout: authApi.logout,

  // Dashboard
  getDashboardMetrics: dashboardApi.getMetrics,
  getDashboardRecentActivity: dashboardApi.getRecentActivity,

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

  // Payment Orders
  getPaymentOrders: paymentOrdersApi.getAll,
  getPaymentOrder: paymentOrdersApi.getById,
  createPaymentOrder: paymentOrdersApi.create,
  updatePaymentOrder: paymentOrdersApi.update,
  getPaymentOrdersSummary: paymentOrdersApi.getSummary,

  // Wallet
  getWalletData: walletApi.getData,
  getWalletHistory: walletApi.getHistory,
}
